# Architecture

`dsh-web-search-gateway` is a two-half DSH plugin: a host module that
serves the `ctx.web` search seam, and a browser module that renders one settings
card. There is no service of its own, no background work, and no state.

```
src/
  shared/config.mjs      field vocabulary + normalizeConfig()   ← both halves
  host/
    index.js             plugin entry: section, provider, routes
    provider.js          the ctx.web search provider
    protocol.js          request bodies per protocol
    parse.js             response envelopes → sources
  client/
    index.tsx            registers the settings card
    SettingsCard.tsx     the card
    locales.ts / i18n.ts copy + translator
    types.ts             structural slices of framework types
lib/client.js            built browser bundle (committed)
cordis.patch.yml         bundle patch (web seam + provider row)
```

## Where the seams are

### `ctx.web` — the search provider

`apply()` calls `ctx.web.registerSearchProvider(provider)` with an object shaped
`{ id, available(), search(request, signal) }`. `id` is the stable string
`openrouter`; the composition selects it with

```yaml
- id: web
  config:
    searchProvider: openrouter
```

`search` receives `{ query, maxResults }` and returns
`{ content?, sources[], truncated }`. The seam — not the plugin — applies the
final result cap, so the provider returns everything the gateway sent and lets
the harness trim. `truncated` is always `false`: this provider never truncates on
its own.

The provider **never throws a transport error for a semantic failure**. A gateway
that answers without searching is a failure worth reporting, so it throws a
`WebError` carrying `WEB_PROVIDER_ERROR` and a message naming the model and the
protocol; a missing key throws `WEB_PROVIDER_CREDENTIAL_MISSING`. Both are routed
by `code`, so the plugin does not depend on the harness's error class identity —
it dynamically imports `@deepseek-ai/dsh-web` and falls back to a local class with
the same `name` and `code` when that import is unavailable (a linked checkout
without the installation closure).

### Configuration projection

`resolveOptions(ctx, config)` runs on **every** search. It normalizes the current
section and returns a fresh `resolveApiKey` thunk, so:

- a settings edit reaches the next search without a restart;
- a rotated credential is re-read per search, never cached;
- an invalid value degrades to a default instead of breaking the plugin.

`normalizeConfig` lives in `src/shared/config.mjs` and is the single source of
truth for field names, defaults, bounds, and protocol ids — the card and the
provider import the same module, so a field cannot drift between the form that
writes it and the code that reads it.

### Settings

The host installs the `web-search-openrouter` namespace:

```js
ctx.inject(['settings'], (c) => {
  c.settings.installSection(ctx, SETTINGS_NAMESPACE, schema, config, { setSource, onChange })
})
```

`setSource` hands the plugin a live accessor for the resolved section; the
composition entry is the base layer and `settings.yaml` overrides it. The schema
is built from a dynamic `import('@deepseek-ai/schemastery')` inside a `try`, so a
bare checkout without the peer still composes — the composition entry is then the
only configuration source, and the card shows the namespace as unavailable rather
than failing.

The browser half claims the same namespace on the keyed `settings.plugin.item`
slot, so the card is exactly the one the host registered a schema for. All reads
go through the bound settings scope's describe-mirror; all writes go through its
revision-fenced `set`/`unset`. The card never fetches settings over HTTP.

### The one value that is not a setting

The API key is not part of the section. It is written through
`GET|POST /web-search-openrouter/credential` into the DSH credential store via
`ctx.credentials.describe/set/unset`, and read back per search. That keeps the
secret out of `settings.yaml`, out of settings responses, and out of the browser
bundle's state; the card only ever sees `{ configured, writable, source }`.

### Request construction

`protocol.js` builds the body. All three protocols POST to `<baseURL>/responses`
and differ only in how search is enabled:

| Protocol | Body fragment |
|---|---|
| `openai` | `tools: [{ type: 'web_search' }]` (+ `filters` only when domains are configured) |
| `openrouter` | `tools: [{ type: 'openrouter:web_search', parameters: { engine, max_results, … } }]` |
| `plugin` | `plugins: [{ id: 'web', engine, max_results, include_domains, exclude_domains }]` |

The `input` is the same instruction the harness's own DeepSeek provider sends
(`Perform a web search for the query: <query>`), which keeps model behaviour
consistent when the engine changes underneath.

`openai` sends the tool object bare by default because strict gateways validate
it and reject unknown members; domain filters are opt-in.

### Response parsing

`parse.js` emits `{ sources, searched, answer, usage }`.

- `searched` is the honesty bit. It is true only when the gateway reported a
  server-side search — a `web_search_call`, an `openrouter:web_search` item, or a
  `url_citation` annotation. A model that answers from memory produces
  `searched: false`, and the provider turns that into an explicit error instead
  of a plausible-looking empty result set.
- Sources are keyed by URL, first-seen order preserved, and a field missing from
  the first sighting is filled in by a later one. `action.sources[]` and
  annotations are therefore merged rather than duplicated.
- A `url_citation` without an excerpt is sliced out of the message text between
  `start_index` and `end_index` — the OpenRouter-documented way to recover the
  cited sentence.

Everything in `parse.js` and `protocol.js` is a pure function, which is why the
test suite can cover the shapes of three different gateways without a network.

## Cost model

One `web_search` tool call is not one gateway request:

```
web_search  →  dsh-tool-web merges queries  →  N provider.search() calls
                                            →  N Responses requests
                                            →  N × (search results + model turn)
```

`searchMaxQueries` (in `dsh-tool-web`) bounds `N`. Each request bills the search
model's input context — measured at roughly 8.5k input tokens for a single
one-result query on `api.b.ai` with `gpt-5.4-nano`. The plugin's cost controls are
`maxResults` (fewer, shorter results), `maxOutputTokens`, and `includeAnswer:
false` (drops the search model's prose from what reaches the conversation).

See [gateways.md](./gateways.md) for measured numbers and engine choices.

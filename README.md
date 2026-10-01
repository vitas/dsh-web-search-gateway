# dsh-web-search-gateway

**Grounded web search for DeepSeek Harness, on the gateway you already pay for.**

[![CI](https://github.com/vitas/dsh-web-search-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/vitas/dsh-web-search-gateway/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-web-search-gateway.svg)](https://www.npmjs.com/package/dsh-web-search-gateway)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](./package.json)

## Why

The built-in `web_search` runs on DeepSeek's own endpoint and bills **that**
account — one search is a full model turn, because DeepSeek exposes no dedicated
search endpoint. If your chat runs somewhere cheaper, your search does not.

This plugin moves the search call onto an OpenRouter-compatible gateway, so
search is billed where your chat already is, at your gateway's price and with
the model you pick:

- **Your model.** The search model is configured separately from the chat model,
  so a cheap chat model can stay exactly as it is.
- **Your price.** On `api.b.ai`: chat on a discounted `deepseek-v4.1-flash`,
  search on `gpt-5.4-nano` — the cheapest model there that actually searches.
- **Your ceiling.** `dsh-tool-web`'s `searchMaxQueries` (default 4) can turn one
  tool call into four searches. Set it to `1` and the cost is one search.

Nothing about the model-facing tool changes: same tool, same arguments, same
citeable results. Only the engine behind it moves.

> **The cheap models usually cannot search.** On `api.b.ai` the DeepSeek, GLM,
> Qwen, MiniMax and MiMo models accept the request and silently never search —
> so on that gateway the search model *must* differ from your chat model. The
> plugin fails loudly instead of returning the model's memory as results. See
> [Verified gateways](#verified-gateways).

![The Web search settings card, with a passing connection test](assets/screenshot-settings.png)

---

## Install

```sh
dsh plugin add dsh-web-search-gateway --profile web
dsh credential set OPENROUTER_API_KEY   # or export it before launching dsh
```

The package ships a bundle patch, so the first line composes everything: it
points the web seam at this provider and inserts the provider row. The key is
resolved **per search** (credentials service, then the process environment), so
rotating it never needs a restart — but the patch and a linked host entry are
read at boot, so restart `dsh web` once after installing.

<details>
<summary>GitHub or local checkout instead of npm</summary>

```sh
dsh plugin add github:vitas/dsh-web-search-gateway --profile web

git clone https://github.com/vitas/dsh-web-search-gateway.git
cd dsh-web-search-gateway && npm install && npm run build
dsh plugin add link:$PWD --profile web
```
</details>

## Quick start

1. Install, then restart `dsh web`.
2. **Settings → Plugins → Web search (OpenRouter)**.
3. Set **Endpoint**, **Search model**, paste the **API key**.
4. **Test search** — you get a source count, the latency, and the first hits.

---

## Verified gateways

Web search is a *server tool*: the gateway must implement it for the model you
name, and it is not part of the OpenAI-compatible standard — only the message
shape is. "OpenAI-compatible" therefore says nothing about whether search works,
which is why every claim here is measured rather than assumed.

### Why not just point the built-in provider at my gateway?

The built-in `dsh-web-search-deepseek` provider is Anthropic-compatible and does
expose `baseURL` and `model`, so re-pointing it is the obvious first idea. On
`api.b.ai` it doesn't work: the request is accepted and the search never runs —
`deepseek-v4.1-flash` answers from memory (0 results, 44 input tokens for the
whole turn), and `gpt-5.4-nano` gets the tool back as a *client-side* call. Only
`/v1/responses` with the native OpenAI tool searches there, and only for the
OpenAI family. Measurements: [docs/gateways.md](./docs/gateways.md#why-the-built-in-provider-cannot-simply-be-re-pointed).

### `api.b.ai` (protocol `openai`)

Works on `/v1/responses` with `tools: [{ type: 'web_search' }]`; hits arrive as
`url_citation` annotations. Cheapest first:

| Model | Citations | Notes |
|---|---|---|
| `gpt-5.4-nano` | 2 | cheapest verified; ~8.5k input tokens per query |
| `gpt-5.4-mini` | 4 | |
| `gpt-5.5-instant` | 8 | |
| `gpt-5-mini` | 4 | large input token count |
| `gpt-6-astra`, `gpt-6-sol`, `gpt-5.6-sol`, `gpt-5.5` | 1–4 | |

Not supported — `glm-*`, `deepseek-*`, `qwen*`, `minimax-*`, `mimo-*`, and
`gpt-5-nano` all return **HTTP 200 with no search at all** (they don't implement
OpenAI's server-side tool, and an unknown entry in `tools` is dropped rather than
rejected); Gemini and Anthropic are refused at the route with `not supported on
/v1/responses`; `:online`, `plugins: [{ id: 'web' }]` and `openrouter:web_search`
are OpenRouter's conventions and don't exist here.

**Input tokens tell a real search from a silent no-op.** A search that ran injects
its results into the context, so the same prompt suddenly costs thousands of
tokens: **4313** for `gpt-5.4-nano`, against **18** for `gpt-5-nano` and **24–105**
for the non-OpenAI families. That is why the provider checks `searched` rather
than trusting a 200. Per-model failures and cost levers:
[docs/gateways.md](./docs/gateways.md).

### `openrouter.ai` (protocol `openrouter`)

`baseURL: https://openrouter.ai/api/v1` plus a model carrying the web-search
badge. `engine`, `searchContextSize`, `maxUses`, `maxTotalResults` and the domain
filters pass through as server-tool `parameters`. On a gateway that isn't
OpenRouter this protocol is rejected — that's the gateway talking, not the plugin.

For OpenAI proper (`https://api.openai.com/v1`) the default protocol works as-is;
sources arrive as `web_search_call.action.sources[]` and take the same code path.

## Protocols

| `protocol` | Wire shape | Use for |
|---|---|---|
| `openai` *(default)* | `tools: [{ type: 'web_search' }]` | OpenAI, Azure, and aggregators that proxy the native tool (`api.b.ai`) |
| `openrouter` | `tools: [{ type: 'openrouter:web_search', parameters }]` | `openrouter.ai`, and gateways that adopted the server tool |
| `plugin` *(deprecated)* | `plugins: [{ id: 'web', … }]` | older gateways that never adopted the server tool |

The provider also reads `web_search_call.action.sources[]`,
`openrouter:web_search.action.sources[]` and `url_citation` annotations —
including snippets sliced out of the cited span when the gateway sends no
excerpt.

## Settings

Every field is editable from the card and can be seeded from the composition
entry. Where the card lives depends on your harness version: DSH 0.1.7 puts it
on the row's own page under **Plugins** (the sidebar entry), DSH 0.1.5 under
**Settings → web-search-openrouter**. Edits land in the profile's patch, or in
`settings.yaml` on 0.1.5. A value that overrides the composition entry is marked
*overridden* and can be reset from the card.

| Field | Default | Meaning |
|---|---|---|
| `protocol` | `openai` | Enablement surface (above) |
| `baseURL` | `https://openrouter.ai/api/v1` | Gateway base; `/responses` is appended |
| `model` | `openai/gpt-5.2` | Model that exposes web search on that gateway |
| `apiKeyEnv` | `OPENROUTER_API_KEY` | Credential reference, resolved per search |
| `apiKey` | — | Literal key; wins over `apiKeyEnv` (keep it out of shared profiles) |
| `maxResults` | `5` | Requested results, 1–25; lower is cheaper |
| `maxOutputTokens` | `1024` | `max_output_tokens` for one search turn |
| `includeAnswer` | `false` | Return the search model's prose as `content` too |
| `allowedDomains`, `excludedDomains` | — | Restrict results to, or drop results from, these hostnames |
| `engine`, `searchContextSize`, `maxUses`, `maxTotalResults` | — | `openrouter` protocol only; passed through as server-tool parameters |
| `referer`, `title` | — | `HTTP-Referer` / `X-Title` attribution headers |

## Cost

Billed as tokens on the search model, not per query. Levers, cheapest first:
pick the cheapest model that searches (and only that one — the chat model is
separate), set `searchMaxQueries: 1`, keep `maxResults` low, leave
`includeAnswer` off. Measured numbers: [docs/gateways.md](./docs/gateways.md#cost).

## Troubleshooting

| Symptom | Cause |
|---|---|
| `WEB_PROVIDER_CREDENTIAL_MISSING` | No key under `apiKeyEnv`; set it in the card or export it before launching `dsh`. |
| *"the gateway ran no server-side search for model …"* | That model doesn't expose web search on that gateway. Pick one from the table above. |
| *"Invalid value: 'openrouter:web_search'"* | The gateway doesn't implement OpenRouter's server tool; switch `protocol` to `openai`. |
| *"node only allows access to inference API paths"* | A gateway-side proxy restriction; check `baseURL` (a stray trailing slash used to produce `//responses`). |
| `HTTP 404` on `/responses` | Chat-completions-only gateway; this provider needs a Responses endpoint. |

## Development

```sh
npm install          # esbuild + typescript
npm run check        # host syntax check + client typecheck
npm test             # 35 tests, no network, no credentials (1 skipped: the live one)
npm run check-locales
npm run build        # rebuild the committed lib/client.js (also runs on npm pack)

# Live smoke test — opt-in, never in CI.
DSH_WEB_SEARCH_LIVE=1 OPENROUTER_API_KEY=sk-... \
DSH_WEB_SEARCH_BASE_URL=https://api.b.ai/v1 DSH_WEB_SEARCH_MODEL=gpt-5.4-nano \
node --test test/live.test.mjs
```

Architecture, seam contracts and the release process: [docs/](./docs). Three
protocols; one browser card (English / 中文 / Русский); no `@deepseek-ai/*` runtime
imports; no install-time script — the bundle is committed and CI fails if it
drifted.

## Privacy

No stored data, no background work. Per search, one HTTPS request to `baseURL`
with your query, the model name and the configured parameters; the gateway's own
terms govern the rest. The key is read from the DSH credential store at call time
and is never written to settings, logs or the browser.

## License

[Apache-2.0](./LICENSE).

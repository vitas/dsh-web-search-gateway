# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-09-30

Supports both settings models: DSH 0.1.7 (Plugins row pages) and DSH 0.1.5
(the `web-search-openrouter` page under Settings). No configuration change is
needed on either version — the same `cordis.patch.yml` entry keeps working.

### Added

- Row-configuration page for DSH 0.1.7, which replaced `settings.plugin.item`
  with the keyed `plugins.row.config` slot. A row's own `Config` is its settings
  section there, so the form is registered against
  `web-search-openrouter#web-search-openrouter`.
- `summary` locale key (en/zh/ru) for the row description DSH 0.1.7 renders
  where the package carries none.

### Fixed

- **DSH 0.1.7: the settings form is reachable again.** The entry was missing
  from the Plugins page entirely — no Configure control and no namespace — and
  it is the *volatile* part of a `Config` schema that 0.1.7 projects a form
  from. Every field is now marked `.volatile()`, which is inert on 0.1.5, whose
  `schemastery` (3.18.2) has no such method.
- **DSH 0.1.7: the configured endpoint and model reach the search again.** 0.1.7
  hands each volatile field to `apply` as a live accessor (`config.model.get()`)
  rather than a value. Read as a scalar it looks like an absent field, so every
  row silently fell back to the schema defaults and searches went to
  `openrouter.ai` whatever the patch said. Values are read through the accessor
  now, which also makes a settings edit reach the next search without a restart.
- DSH 0.1.7 removed `ctx.settings.installSection` and `ctx.settingsScope`. The
  imperative registration is guarded on the method being present, so it is
  skipped rather than throwing where the seam is gone.

## [1.0.0] — 2025-09-24

First public release. Published to npm as
[`@samebits/dsh-web-search-openrouter`](https://www.npmjs.com/package/@samebits/dsh-web-search-openrouter).

### Added

- `ctx.web` search provider (`id: openrouter`) that runs the built-in
  `web_search` tool server-side on an OpenRouter-compatible Responses gateway.
- Three request protocols: `openai` (`tools: [{ type: 'web_search' }]`),
  `openrouter` (`openrouter:web_search` server tool with `parameters`), and the
  deprecated `plugin` shape (`plugins: [{ id: 'web' }]`).
- Response parsing for `web_search_call.action.sources[]`,
  `openrouter:web_search.action.sources[]`, and `url_citation` annotations —
  including snippets sliced from the cited span when no excerpt is supplied.
  Sources are deduplicated by URL with missing fields merged across sightings.
- `web-search-openrouter` settings namespace, editable from the Plugins settings
  tab, with live reload through the settings scope. English, 中文 and Русский
  copy dictionaries.
- Settings card with per-field override markers and reset, a write-only API-key
  row backed by the DSH credential store, and a **Test search** button that runs
  one real query through the saved configuration.
- Loopback routes `POST /web-search-openrouter/test` and
  `GET|POST /web-search-openrouter/credential`.
- Per-search credential resolution through `ctx.credentials`, falling back to the
  launching process environment.
- Routable failures (`WEB_PROVIDER_CREDENTIAL_MISSING`, `WEB_ABORTED`,
  `WEB_PROVIDER_ERROR`), including a distinct error when the gateway answers
  without running a server-side search.
- 34 offline tests (`node --test`) plus an opt-in live smoke test.
- Bundle patch (`dsh.bundle.patch`) that points the web seam at this provider and
  composes the provider row, so `dsh plugin add` is the whole installation.
- GitHub Actions CI: host syntax check, client typecheck, locale parity, unit
  tests, committed-bundle freshness, and `npm pack` inspection.

[1.1.0]: https://github.com/vitas/dsh-web-search-openrouter/releases/tag/v1.1.0
[1.0.0]: https://github.com/vitas/dsh-web-search-openrouter/releases/tag/v1.0.0

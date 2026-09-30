/**
 * Configuration vocabulary shared by the host and browser halves.
 *
 * The host projects a settings section (or the composition entry) through
 * {@link normalizeConfig} on every search; the browser card renders the same
 * field metadata. Keeping both here means a field can never drift between the
 * form that writes it and the provider that reads it.
 *
 * Dependency-free and side-effect-free on purpose: the host imports it with a
 * plain `import`, and esbuild inlines it into the browser bundle.
 *
 * @module dsh-web-search-openrouter/config
 */

/** Stable provider id this plugin registers with `ctx.web`. */
export const PROVIDER_ID = 'openrouter'

/** Settings namespace owned by this plugin. */
export const SETTINGS_NAMESPACE = 'web-search-openrouter'

/** Cordis plugin name used by loader diagnostics. */
export const PLUGIN_NAME = 'web-search-openrouter'

/** npm package name this plugin ships as. */
export const PACKAGE_NAME = '@samebits/dsh-web-search-openrouter'

/**
 * Key the browser half registers the row's configuration page under.
 *
 * DSH 0.1.7 keys `plugins.row.config` by `<package name>#<row id>`, and this
 * plugin's row id is its cordis plugin name. 0.1.5 keys the old
 * `settings.plugin.item` by the settings namespace instead; both are derived
 * here so the two halves cannot disagree about which entry they own.
 */
export const ROW_CONFIG_KEY = `${PACKAGE_NAME}#${PLUGIN_NAME}`

/** Canonical OpenRouter Responses base; `/responses` is appended. */
export const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'

/** Default search model on OpenRouter (documented with the web_search server tool). */
export const DEFAULT_MODEL = 'openai/gpt-5.2'

/** Default credential reference, resolved per search through `ctx.credentials`. */
export const DEFAULT_API_KEY_ENV = 'OPENROUTER_API_KEY'

/** Upper bound accepted by OpenRouter's `max_results` (1–25; Perplexity 1–20). */
export const MAX_RESULTS_LIMIT = 25

/** Lower bound accepted by OpenRouter's `max_results`. */
export const MIN_RESULTS = 1

/** Default results requested per search call. */
export const DEFAULT_MAX_RESULTS = 5

/** Default output cap for one search turn. */
export const DEFAULT_MAX_OUTPUT_TOKENS = 1024

/** Attribution header sent on every request. Bump with the package version. */
export const USER_AGENT = 'dsh-web-search-openrouter/1.1.0'

/**
 * Request shapes this provider speaks. Each one reaches a gateway's server-side
 * web search over the Responses API; only the enablement surface differs.
 *
 * - `openai`     — OpenAI's native `{ type: 'web_search' }` server tool. Works on
 *   OpenAI itself and on OpenRouter-compatible gateways that proxy the native
 *   tool (verified on api.b.ai). Results arrive as `url_citation` annotations.
 * - `openrouter` — OpenRouter's `{ type: 'openrouter:web_search', parameters }`
 *   server tool (the current, non-deprecated surface). Works on
 *   OpenRouter's Responses and Chat Completions APIs.
 * - `plugin`     — the deprecated `plugins: [{ id: 'web' }]` request field,
 *   kept for gateways that never adopted the server tool.
 *
 * @type {ReadonlyArray<{ id: string, path: string, deprecated?: boolean }>}
 */
export const PROTOCOLS = Object.freeze([
  Object.freeze({ id: 'openai', path: '/responses' }),
  Object.freeze({ id: 'openrouter', path: '/responses' }),
  Object.freeze({ id: 'plugin', path: '/responses', deprecated: true }),
])

/** Protocol ids in display order. */
export const PROTOCOL_IDS = Object.freeze(PROTOCOLS.map((protocol) => protocol.id))

/** Whether `value` is a non-empty string. */
export function nonEmpty(value) {
  return typeof value === 'string' && value.length > 0
}

/** Whether `value` is a positive whole number. */
export function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0
}

/**
 * Clamp a requested result count into the range every engine accepts.
 * @param value - candidate count.
 * @returns the clamped count, or `undefined` when not a positive integer.
 */
export function clampMaxResults(value) {
  if (!isPositiveInteger(value)) return undefined
  return Math.min(Math.max(value, MIN_RESULTS), MAX_RESULTS_LIMIT)
}

/**
 * Normalize a raw list of domains: trimmed, lowercased, de-duplicated,
 * blanks dropped. An empty result reads as "no filter".
 * @param value - candidate list.
 * @returns a normalized array (possibly empty).
 */
export function normalizeDomainList(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const domain = entry.trim().toLowerCase()
    if (domain.length > 0) seen.add(domain)
  }
  return [...seen]
}

/**
 * Project one raw config object (composition entry or resolved settings
 * section) into the fully-defaulted options the provider serves its next
 * search with. Never throws: malformed values fall back to defaults so a bad
 * edit surfaces as a failing search rather than a broken plugin.
 *
 * @param raw - the raw section, possibly `undefined` or a non-object.
 * @returns normalized options.
 */
export function normalizeConfig(raw) {
  const config = raw !== null && typeof raw === 'object' ? raw : {}
  const protocol = nonEmpty(config.protocol) ? config.protocol : 'openai'
  return {
    protocol: PROTOCOL_IDS.includes(protocol) ? protocol : 'openai',
    apiKey: nonEmpty(config.apiKey) ? config.apiKey : undefined,
    apiKeyEnv: nonEmpty(config.apiKeyEnv) ? config.apiKeyEnv : DEFAULT_API_KEY_ENV,
    baseURL: nonEmpty(config.baseURL) ? config.baseURL : DEFAULT_BASE_URL,
    model: nonEmpty(config.model) ? config.model : DEFAULT_MODEL,
    maxResults: clampMaxResults(config.maxResults),
    maxOutputTokens: isPositiveInteger(config.maxOutputTokens)
      ? config.maxOutputTokens
      : DEFAULT_MAX_OUTPUT_TOKENS,
    includeAnswer: config.includeAnswer === true,
    engine: nonEmpty(config.engine) ? config.engine : undefined,
    searchContextSize: nonEmpty(config.searchContextSize) ? config.searchContextSize : undefined,
    maxUses: isPositiveInteger(config.maxUses) ? config.maxUses : undefined,
    maxTotalResults: isPositiveInteger(config.maxTotalResults) ? config.maxTotalResults : undefined,
    allowedDomains: normalizeDomainList(config.allowedDomains),
    excludedDomains: normalizeDomainList(config.excludedDomains),
    referer: nonEmpty(config.referer) ? config.referer : undefined,
    title: nonEmpty(config.title) ? config.title : undefined,
  }
}

/** Protocol metadata for one id, or the `openai` entry for an unknown id. */
export function protocolSpec(id) {
  return PROTOCOLS.find((protocol) => protocol.id === id) ?? PROTOCOLS[0]
}

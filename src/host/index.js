/**
 * `dsh-web-search-openrouter` — host half.
 *
 * Registers a `ctx.web` search provider that runs the harness's built-in
 * `web_search` tool through an OpenRouter-compatible gateway, using the same
 * endpoint and credential as the chat models. It also owns the
 * `web-search-openrouter` settings namespace (the Plugins settings card) and a
 * loopback test route the card calls to prove the configuration works.
 *
 * No server of its own, no telemetry: the only outbound traffic is the search
 * request itself, to the endpoint the user configured.
 *
 * @module dsh-web-search-openrouter/host
 */

import {
  DEFAULT_API_KEY_ENV,
  DEFAULT_BASE_URL,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_MAX_RESULTS,
  DEFAULT_MODEL,
  MAX_RESULTS_LIMIT,
  PLUGIN_NAME,
  PROTOCOL_IDS,
  SETTINGS_NAMESPACE,
} from '../shared/config.mjs'
import { OpenRouterSearchProvider, resolveOptions } from './provider.js'

export { OpenRouterSearchProvider } from './provider.js'

/** Cordis plugin name used by loader diagnostics. */
export const name = PLUGIN_NAME

/** The web seam this provider registers into. */
export const inject = ['web']

/** Loopback route the settings card uses for its "Test search" button. */
export const TEST_ROUTE = '/web-search-openrouter/test'

/** Loopback route the settings card uses to read and write the API key. */
export const CREDENTIAL_ROUTE = '/web-search-openrouter/credential'

/** POSIX-shell identifier grammar accepted by the credentials seam. */
const REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

/** Upper bound on sources echoed back to the card. */
const TEST_SOURCE_LIMIT = 8

/** Default probe query; specific enough to produce real hits on any engine. */
const TEST_QUERY = 'DeepSeek Harness web search plugin'

/**
 * Build a settings schema, optionally marking every field volatile.
 *
 * `.volatile()` is what tells DSH 0.1.7 which fields belong to a row's settings
 * form: its settings service projects the form from the volatile part of a
 * Config schema only (`volatileForm` in dsh-settings) and refuses writes that do
 * not lie beneath a volatile node. A schema with no volatile field is invisible
 * to the Plugins page — the entry is dropped from `describe`, no namespace is
 * served, and every user override is silently rejected — which is exactly what
 * happened to this plugin before the marker was added.
 *
 * The marker is NOT free: a volatile field resolves from outside the local
 * document, so a bare schemastery call such as `schema({})` yields nothing for
 * it. The imperative `installSection` path below resolves the section that way,
 * so it keeps the plain schema and both versions behave as they always did.
 *
 * @param z - the schemastery module.
 * @param volatile - mark every field `.volatile()`.
 * @returns the object schema.
 */
function makeSchema(z, volatile) {
  /** Apply the volatile marker where the schema type supports it. */
  const mark = (schema) => (volatile && typeof schema.volatile === 'function' ? schema.volatile() : schema)
  return z.object({
    protocol: mark(z.union(PROTOCOL_IDS.map((id) => z.const(id))).default('openai')),
    apiKey: mark(z.string().role('secret')),
    apiKeyEnv: mark(z.string().role('credential-ref').default(DEFAULT_API_KEY_ENV)),
    baseURL: mark(z.string().default(DEFAULT_BASE_URL)),
    model: mark(z.string().default(DEFAULT_MODEL)),
    maxResults: mark(z.number().step(1).min(1).max(MAX_RESULTS_LIMIT).default(DEFAULT_MAX_RESULTS)),
    maxOutputTokens: mark(z.number().step(1).min(1).default(DEFAULT_MAX_OUTPUT_TOKENS)),
    includeAnswer: mark(z.boolean().default(false)),
    engine: mark(z.string()),
    searchContextSize: mark(z.string()),
    maxUses: mark(z.number().step(1).min(1)),
    maxTotalResults: mark(z.number().step(1).min(1)),
    allowedDomains: mark(z.array(z.string())),
    excludedDomains: mark(z.array(z.string())),
    referer: mark(z.string()),
    title: mark(z.string()),
  })
}

/**
 * The two schemas, built once. Absent when schemastery does not resolve — a
 * bare development checkout without the peer still composes, with the
 * composition entry as the only configuration source.
 *
 * @returns `{ settings, config }`: the plain schema the imperative path
 *   registers, and the volatile one the loader exposes as Config.
 */
async function buildSchemas() {
  try {
    const { default: z } = await import('@deepseek-ai/schemastery')
    return { settings: makeSchema(z, false), config: makeSchema(z, true) }
  } catch {
    return { settings: undefined, config: undefined }
  }
}

/**
 * The row's Config schema, which the loader applies to `config` before `apply`.
 *
 * DSH 0.1.7 dropped `ctx.settings.installSection` and made a plugin's settings
 * section the Config of its own Loader row: the loader validates the row's
 * configuration against this export, and the settings service projects it into
 * a form the Plugins page renders. Without it a row has no schema, so the
 * settings service has no section for it and every user override is rejected —
 * the plugin silently keeps the composition entry's values.
 *
 * 0.1.5 has no such convention, so `apply` below still registers the same
 * fields imperatively and both versions stay configured. Cordis treats a
 * missing Config as "no schema", so the peer-less checkout composes exactly as
 * it did before.
 */
const SCHEMAS = await buildSchemas()

/** The volatile schema the loader exposes as this row's Config. */
export const Config = SCHEMAS.config

/** Write one JSON response with no caching. */
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

/** Read and parse a small JSON request body; resolves `{}` for an empty body. */
async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 64 * 1024) throw new Error('request body too large')
    chunks.push(chunk)
  }
  if (size === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

/**
 * Plugin entry.
 *
 * @param ctx - host cordis context.
 * @param config - the row's config, already resolved by the loader against
 *   {@link Config} (the composition entry, overlaid with the settings layer on
 *   0.1.5).
 */
/**
 * Read one resolved config field.
 *
 * DSH 0.1.7 hands a volatile field over as a live accessor rather than a value —
 * the shipped providers read `config.model.get()`. Reading that accessor as a
 * scalar yields the accessor object itself, which then looks like an absent
 * field, so every row silently falls back to the schema defaults and the user's
 * own configuration never reaches the search. 0.1.5 hands over plain values, so
 * this is a no-op there. Reading through the accessor on every call is also what
 * makes a settings edit reach the next search without a restart.
 *
 * @param value - one field of the loader-resolved config.
 * @returns the current value behind it.
 */
function readField(value) {
  return value !== null && typeof value === 'object' && typeof value.get === 'function' ? value.get() : value
}

/** Project a whole resolved config through {@link readField}. */
function readConfig(config) {
  if (config === null || typeof config !== 'object') return {}
  return Object.fromEntries(Object.entries(config).map(([key, value]) => [key, readField(value)]))
}

/**
 * Register the search provider and the two loopback routes the card uses.
 *
 * @param ctx - the plugin context.
 * @param config - the row's config, already resolved by the loader against
 *   {@link Config}.
 */
export async function apply(ctx, config = {}) {
  /** Effective configuration, read fresh so live settings edits apply. */
  let current = () => readConfig(config)

  ctx.inject(['settings'], (settingsCtx) => {
    // DSH 0.1.7 replaced this seam: a plugin's settings section is now its own
    // Loader row's Config, which the loader applied to `config` before this
    // call, and which `mutate` writes back into the profile patch — a write the
    // loader answers by re-applying the row. Registering here would be wrong
    // rather than redundant, so the missing method is the signal to stop.
    if (typeof settingsCtx.settings.installSection !== 'function') return
    if (SCHEMAS.settings === undefined) return
    try {
      settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, SCHEMAS.settings, config, {
        setSource: (source) => {
          current = () => readConfig(source())
        },
        onChange: () => {},
      })
    } catch {
      // The composition entry stays authoritative and every other surface keeps
      // working — a settings registration must never take the provider down.
    }
  })

  const provider = new OpenRouterSearchProvider(() => {
    const options = resolveOptions(ctx, current())
    return {
      ...options,
      log: (event) => ctx.logger?.debug?.(`${PLUGIN_NAME}: ${JSON.stringify(event)}`),
    }
  })
  ctx.web.registerSearchProvider(provider)

  // The card's "Test search" and key-management routes. Registered only when
  // the web GUI is mounted; headless and SDK compositions simply never fire
  // this fiber.
  ctx.inject(['webServer'], (serverCtx) => {
    if (!serverCtx.webServer?.register) return

    /** Resolve the credentials service, if this composition has one. */
    const credentialsOf = () => ctx.get('credentials')

    /** The reference the current configuration names, when it is well-formed. */
    const currentRef = () => {
      const env = resolveOptions(ctx, current()).apiKeyEnv
      return REF_PATTERN.test(env) ? env : undefined
    }

    const disposeTest = serverCtx.webServer.register({
      kind: 'exact',
      path: TEST_ROUTE,
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
        }
        let query = TEST_QUERY
        try {
          const body = await readJsonBody(req)
          if (typeof body?.query === 'string' && body.query.trim().length > 0) query = body.query.trim().slice(0, 400)
        } catch (error) {
          return sendJson(res, 400, { ok: false, error: `invalid request body: ${String(error?.message ?? error)}` })
        }
        const options = resolveOptions(ctx, current())
        const startedAt = Date.now()
        try {
          const result = await provider.search({ query, maxResults: TEST_SOURCE_LIMIT })
          return sendJson(res, 200, {
            ok: true,
            protocol: options.protocol,
            model: options.model,
            baseURL: options.baseURL,
            query,
            durationMs: Date.now() - startedAt,
            sources: result.sources.slice(0, TEST_SOURCE_LIMIT).map((source) => ({
              url: source.url,
              ...(source.title !== undefined ? { title: source.title } : {}),
              ...(source.snippet !== undefined ? { snippet: source.snippet.slice(0, 240) } : {}),
            })),
            ...(result.content !== undefined ? { answer: result.content.slice(0, 1200) } : {}),
          })
        } catch (error) {
          return sendJson(res, 200, {
            ok: false,
            protocol: options.protocol,
            model: options.model,
            baseURL: options.baseURL,
            query,
            durationMs: Date.now() - startedAt,
            code: typeof error?.code === 'string' ? error.code : 'WEB_PROVIDER_ERROR',
            error: String(error?.message ?? error),
          })
        }
      },
    })

    const disposeCredential = serverCtx.webServer.register({
      kind: 'exact',
      path: CREDENTIAL_ROUTE,
      handler: async (req, res) => {
        const ref = currentRef()
        if (ref === undefined) {
          return sendJson(res, 200, { ok: false, error: 'apiKeyEnv is not a valid credential reference' })
        }
        const credentials = credentialsOf()
        if (credentials === undefined) {
          return sendJson(res, 200, { ok: false, configured: false, writable: false, error: 'no credentials service in this composition' })
        }
        try {
          if (req.method === 'GET') {
            const info = await credentials.describe(ref)
            return sendJson(res, 200, {
              ok: true,
              apiKeyEnv: ref,
              configured: info.configured === true,
              writable: info.writable === true,
              ...(info.source !== undefined ? { source: info.source } : {}),
            })
          }
          if (req.method !== 'POST') {
            return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
          }
          const body = await readJsonBody(req)
          const value = typeof body?.value === 'string' ? body.value : ''
          if (value.length === 0) await credentials.unset(ref)
          else await credentials.set(ref, value)
          const info = await credentials.describe(ref)
          return sendJson(res, 200, {
            ok: true,
            apiKeyEnv: ref,
            configured: info.configured === true,
            writable: info.writable === true,
            ...(info.source !== undefined ? { source: info.source } : {}),
          })
        } catch (error) {
          return sendJson(res, 200, {
            ok: false,
            apiKeyEnv: ref,
            code: typeof error?.code === 'string' ? error.code : 'CREDENTIAL_WRITE_FAILED',
            error: String(error?.message ?? error),
          })
        }
      },
    })

    serverCtx.effect(() => () => {
      disposeTest?.()
      disposeCredential?.()
    })
  })

  ctx.logger?.info?.(`${PLUGIN_NAME}: provider registered as "${provider.id}"`)
}

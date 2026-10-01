/**
 * The `ctx.web` search provider backed by an OpenRouter-compatible gateway.
 *
 * Everything the provider needs is projected from the current configuration on
 * every call (`resolveOptions`), so a saved settings edit reaches the next
 * search without a restart, and a rotated credential is re-resolved per
 * search.
 *
 * Credentials: a literal `apiKey` wins; otherwise the `apiKeyEnv` reference is
 * read through `ctx.credentials` (the store the DSH Models page writes) and
 * finally from the launching process environment.
 *
 * @module dsh-web-search-gateway/host/provider
 */

import {
  DEFAULT_API_KEY_ENV,
  MAX_RESULTS_LIMIT,
  PROVIDER_ID,
  USER_AGENT,
  clampMaxResults,
  normalizeConfig,
} from '../shared/config.mjs'
import { parseSearchResponse, errorMessage, reportedSearchCount } from './parse.js'
import { buildSearchBody, endpointFor, pathFor } from './protocol.js'

/** The harness error class when the web seam is resolvable, else a local twin. */
const LocalWebError = class WebError extends Error {
  constructor(message, code, options) {
    super(message, options)
    this.name = 'WebError'
    this.code = code
  }
}

/** Resolve the real `WebError` when present so `instanceof` checks keep working. */
const WebErrorBase = await import('@deepseek-ai/dsh-web')
  .then((mod) => (typeof mod?.WebError === 'function' ? mod.WebError : LocalWebError))
  .catch(() => LocalWebError)

/** A `WEB_*`-coded failure the harness can route on. */
export class WebError extends WebErrorBase {}

/** POSIX-shell identifier grammar accepted by the credentials seam. */
const REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

/** True for a fetch/`AbortSignal` abort. */
function isAbortError(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Providers whose native tool must be named differently on the wire. */
const TYPE_HINTS = 'gpt-5.4-nano, gpt-5.4-mini, gpt-5.5-instant, gpt-6-astra, gpt-5.6-sol, or an OpenRouter model with the web-search badge'

/**
 * Project one resolved config section into the options the next search runs
 * with, including a per-call credential resolver.
 *
 * @param ctx - plugin context supplying the credential and logger planes.
 * @param config - the currently authoritative section.
 * @returns options for {@link OpenRouterSearchProvider}.
 */
export function resolveOptions(ctx, config) {
  const options = normalizeConfig(config)
  const apiKeyEnv = options.apiKeyEnv ?? DEFAULT_API_KEY_ENV
  return {
    ...options,
    apiKeyEnv,
    resolveApiKey: async () => {
      if (options.apiKey !== undefined) return options.apiKey
      const credentials = ctx.get?.('credentials')
      if (credentials !== undefined) {
        const resolved = await credentials.resolve(apiKeyEnv)
        if (resolved !== undefined && typeof resolved.value === 'string' && resolved.value.length > 0) {
          return resolved.value
        }
      }
      const ambient = process.env[apiKeyEnv]
      return typeof ambient === 'string' && ambient.length > 0 ? ambient : undefined
    },
  }
}

/** The Responses-API web search provider. */
export class OpenRouterSearchProvider {
  /**
   * @param resolveOptions - thunk projecting the current options.
   */
  constructor(resolveOptions) {
    this.resolveOptions = resolveOptions
  }

  get id() {
    return PROVIDER_ID
  }

  /**
   * Cheap local usability check; never makes a network call. Async credential
   * resolution cannot run here, so a configured reference reads as usable and
   * a missing value fails the search itself with `WEB_PROVIDER_CREDENTIAL_MISSING`.
   */
  available() {
    const options = this.resolveOptions()
    return (
      URL.canParse(options.baseURL) &&
      options.model.length > 0 &&
      (options.apiKey !== undefined || REF_PATTERN.test(options.apiKeyEnv))
    )
  }

  /**
   * Run one search through the gateway's server-side web search.
   *
   * @param request - the query and the consumer's result bound.
   * @param signal - optional cancellation forwarded to `fetch`.
   * @returns normalized sources (the seam applies the final result cap).
   */
  async search(request, signal) {
    const options = this.resolveOptions()
    const endpoint = endpointFor(options.baseURL, pathFor(options.protocol))

    const apiKey = await options.resolveApiKey()
    if (apiKey === undefined) {
      throw new WebError(
        `OpenRouter web search has no API key for "${options.apiKeyEnv}"; store it through the credentials service (Settings → Models), export it in the launching environment, or set a literal "apiKey" in the web-search-openrouter config`,
        'WEB_PROVIDER_CREDENTIAL_MISSING',
      )
    }

    // The configured bound is the user's cost control; the consumer's bound is
    // the fallback when the config leaves it unset.
    const maxResults = options.maxResults ?? clampMaxResults(request.maxResults)
    const body = buildSearchBody(
      { ...options, maxResults: maxResults !== undefined ? Math.min(maxResults, MAX_RESULTS_LIMIT) : undefined },
      request.query,
    )

    const headers = {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      accept: 'application/json',
      'user-agent': USER_AGENT,
    }
    if (options.referer !== undefined) headers['http-referer'] = options.referer
    if (options.title !== undefined) headers['x-title'] = options.title

    const startedAt = Date.now()
    let response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        redirect: 'error',
        headers,
        body: JSON.stringify(body),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error) {
      if (isAbortError(error)) {
        throw new WebError('OpenRouter web search aborted', 'WEB_ABORTED', { cause: error })
      }
      throw new WebError(
        `OpenRouter web search request failed against ${endpoint}: ${String(error)}`,
        'WEB_PROVIDER_ERROR',
        { cause: error },
      )
    }

    if (!response.ok) {
      let message
      try {
        message = errorMessage(await response.json())
      } catch (error) {
        if (isAbortError(error)) {
          throw new WebError('OpenRouter web search aborted', 'WEB_ABORTED', { cause: error })
        }
      }
      throw new WebError(
        message ?? `OpenRouter web search API error (HTTP ${response.status}) at ${endpoint}`,
        'WEB_PROVIDER_ERROR',
      )
    }

    let envelope
    try {
      envelope = await response.json()
    } catch (error) {
      throw new WebError(
        `OpenRouter returned an unprocessable response body from ${endpoint}: ${String(error)}`,
        'WEB_PROVIDER_ERROR',
        { cause: error },
      )
    }

    if (envelope?.error != null) {
      throw new WebError(
        errorMessage(envelope) ?? 'OpenRouter web search failed',
        'WEB_PROVIDER_ERROR',
      )
    }

    const { sources, searched, answer, usage } = parseSearchResponse(envelope)
    if (!searched) {
      throw new WebError(
        `the gateway ran no server-side search for model "${options.model}" via the "${options.protocol}" protocol at ${endpoint}; that model may not expose web search — pick one that does (${TYPE_HINTS})`,
        'WEB_PROVIDER_ERROR',
      )
    }

    const searches = reportedSearchCount(usage)
    this.resolveOptions().log?.({
      endpoint,
      protocol: options.protocol,
      model: options.model,
      sources: sources.length,
      searched: searches,
      durationMs: Date.now() - startedAt,
    })

    return {
      ...(options.includeAnswer && answer !== undefined ? { content: answer } : {}),
      sources,
      truncated: false,
    }
  }
}

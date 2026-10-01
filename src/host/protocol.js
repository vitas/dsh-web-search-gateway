/**
 * Request construction for each supported web-search protocol.
 *
 * All three protocols POST to the gateway's Responses endpoint; they differ
 * only in how server-side search is switched on:
 *
 * | protocol     | enablement surface                                        |
 * |--------------|-----------------------------------------------------------|
 * | `openai`     | `tools: [{ type: 'web_search' }]` (native OpenAI tool)     |
 * | `openrouter` | `tools: [{ type: 'openrouter:web_search', parameters }]`   |
 * | `plugin`     | `plugins: [{ id: 'web', … }]` (deprecated OpenRouter form) |
 *
 * Pure functions; unit-tested in `test/protocol.test.mjs`.
 *
 * @module dsh-web-search-gateway/host/protocol
 */

import { protocolSpec } from '../shared/config.mjs'

/** The instruction the search model receives. Matches the shipped DeepSeek provider. */
export function searchInstruction(query) {
  return `Perform a web search for the query: ${query}`
}

/** Join a gateway base with an operation path, tolerating a trailing slash. */
export function endpointFor(baseURL, path) {
  return `${baseURL.replace(/\/+$/, '')}${path}`
}

/**
 * Build the `parameters` object OpenRouter's `openrouter:web_search` server
 * tool accepts, omitting everything the caller left unset.
 */
function serverToolParameters(options) {
  const parameters = {}
  if (options.engine !== undefined) parameters.engine = options.engine
  if (options.maxResults !== undefined) parameters.max_results = options.maxResults
  if (options.maxTotalResults !== undefined) parameters.max_total_results = options.maxTotalResults
  if (options.searchContextSize !== undefined) parameters.search_context_size = options.searchContextSize
  if (options.maxUses !== undefined) parameters.max_uses = options.maxUses
  if (options.allowedDomains.length > 0) parameters.allowed_domains = options.allowedDomains
  if (options.excludedDomains.length > 0) parameters.excluded_domains = options.excludedDomains
  return parameters
}

/**
 * Build the deprecated `plugins: [{ id: 'web' }]` entry. Field names here are
 * the plugin-era ones (`include_domains` / `exclude_domains`).
 */
function webPlugin(options) {
  const plugin = { id: 'web' }
  if (options.engine !== undefined) plugin.engine = options.engine
  if (options.maxResults !== undefined) plugin.max_results = options.maxResults
  if (options.allowedDomains.length > 0) plugin.include_domains = options.allowedDomains
  if (options.excludedDomains.length > 0) plugin.exclude_domains = options.excludedDomains
  return plugin
}

/**
 * Build the native OpenAI `web_search` tool entry. Only the tool type is sent
 * by default; domain filters are added only when configured, because strict
 * gateways validate the tool object and reject unknown members.
 */
function nativeWebSearchTool(options) {
  const tool = { type: 'web_search' }
  if (options.allowedDomains.length > 0 || options.excludedDomains.length > 0) {
    tool.filters = {
      ...(options.allowedDomains.length > 0 ? { allowed_domains: options.allowedDomains } : {}),
      ...(options.excludedDomains.length > 0 ? { excluded_domains: options.excludedDomains } : {}),
    }
  }
  return tool
}

/**
 * Build the complete JSON body for one search.
 *
 * @param options - normalized options from `normalizeConfig`.
 * @param query - the single search query.
 * @returns the request body to POST.
 */
export function buildSearchBody(options, query) {
  const body = {
    model: options.model,
    input: searchInstruction(query),
    max_output_tokens: options.maxOutputTokens,
  }
  if (options.protocol === 'openrouter') {
    const parameters = serverToolParameters(options)
    body.tools = [
      {
        type: 'openrouter:web_search',
        ...(Object.keys(parameters).length > 0 ? { parameters } : {}),
      },
    ]
    return body
  }
  if (options.protocol === 'plugin') {
    body.plugins = [webPlugin(options)]
    return body
  }
  body.tools = [nativeWebSearchTool(options)]
  return body
}

/**
 * The Responses operation path for a protocol.
 * @param protocolId - one of `PROTOCOL_IDS`.
 */
export function pathFor(protocolId) {
  return protocolSpec(protocolId).path
}

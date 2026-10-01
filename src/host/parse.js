/**
 * Response-envelope parsing for the Responses-API web search provider.
 *
 * Gateways differ in where they put the hits, so this module understands every
 * shape observed in the wild and folds them into one deduplicated source list:
 *
 * - `openai` / `openrouter` server tool items — `web_search_call` (OpenAI,
 *   api.b.ai) and `openrouter:web_search` (OpenRouter) carrying
 *   `action.sources[]` with `url`, `title`, `snippet`/`text`, and a date.
 * - `url_citation` annotations on `output_text` content parts — the shape
 *   OpenRouter documents and api.b.ai returns. The citeable text is the
 *   annotation's `content` when present, otherwise the slice of the message
 *   text between `start_index` and `end_index`.
 *
 * Pure functions only; no network, no configuration. Unit-tested in
 * `test/parse.test.mjs`.
 *
 * @module dsh-web-search-gateway/host/parse
 */

/** Non-empty string check, inlined to keep this module dependency-free. */
function text(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

/**
 * Index sources by URL, keeping the first snippet/title seen for each and
 * treating a later blank as "still missing".
 */
function createCollector() {
  const byUrl = new Map()
  return {
    /**
     * Record one candidate source.
     * @param url - absolute result URL.
     * @param title - provider-supplied title.
     * @param snippet - provider-supplied excerpt.
     * @param publishedAt - provider-supplied publication/crawl date.
     */
    add(url, title, snippet, publishedAt) {
      const href = text(url)
      if (href === undefined) return
      const next = {
        url: href,
        ...(text(title) !== undefined ? { title } : {}),
        ...(text(snippet) !== undefined ? { snippet } : {}),
        ...(text(publishedAt) !== undefined ? { publishedAt } : {}),
      }
      const existing = byUrl.get(href)
      if (existing === undefined) {
        byUrl.set(href, next)
        return
      }
      if (existing.title === undefined && next.title !== undefined) existing.title = next.title
      if (existing.snippet === undefined && next.snippet !== undefined) existing.snippet = next.snippet
      if (existing.publishedAt === undefined && next.publishedAt !== undefined) existing.publishedAt = next.publishedAt
    },
    /** @returns the collected sources in first-seen order. */
    list() {
      return [...byUrl.values()]
    },
  }
}

/**
 * Pull a snippet out of a `url_citation` annotation, preferring the
 * provider-supplied excerpt and falling back to the cited span of the message.
 */
function annotationSnippet(annotation, messageText) {
  const excerpt = text(annotation?.content)
  if (excerpt !== undefined) return excerpt
  if (messageText === undefined) return undefined
  const start = Number.isInteger(annotation?.start_index) ? annotation.start_index : undefined
  const end = Number.isInteger(annotation?.end_index) ? annotation.end_index : undefined
  if (start === undefined || end === undefined || end <= start) return undefined
  return text(messageText.slice(start, end))
}

/**
 * Collect every content part of one `message` output item.
 * @returns `{ text, annotations }` for that item.
 */
function readMessage(item) {
  const parts = Array.isArray(item?.content) ? item.content : []
  const texts = []
  const annotations = []
  for (const part of parts) {
    if (part?.type !== 'output_text' && part?.type !== 'text') continue
    const body = text(part.text)
    if (body !== undefined) texts.push(body)
    if (Array.isArray(part.annotations)) {
      for (const annotation of part.annotations) {
        if (annotation?.type === 'url_citation') annotations.push(annotation)
      }
    }
  }
  return { text: texts.length > 0 ? texts.join('\n\n') : undefined, annotations }
}

/**
 * Fold one Responses envelope into the seam's vocabulary.
 *
 * @param body - the parsed response envelope.
 * @returns `{ sources, searched, answer, usage }`:
 *   `searched` is true when the gateway actually ran a server-side search —
 *   which is what separates "this query had no hits" from "this model or
 *   gateway ignores the web_search tool".
 */
export function parseSearchResponse(body) {
  const collector = createCollector()
  const output = Array.isArray(body?.output) ? body.output : []
  let searched = false
  let answer

  for (const item of output) {
    if (item?.type === 'web_search_call' || item?.type === 'openrouter:web_search') {
      searched = true
      const action = item.action ?? {}
      for (const source of Array.isArray(action.sources) ? action.sources : []) {
        collector.add(
          source?.url,
          source?.title,
          source?.snippet ?? source?.text ?? source?.content,
          source?.publishedDate ?? source?.published_date ?? source?.pageAge ?? source?.page_age,
        )
      }
    }
    if (item?.type === 'message') {
      const { text: messageText, annotations } = readMessage(item)
      if (messageText !== undefined) answer = answer === undefined ? messageText : `${answer}\n\n${messageText}`
      for (const annotation of annotations) {
        searched = true
        collector.add(
          annotation.url,
          annotation.title,
          annotationSnippet(annotation, messageText),
          annotation.publishedAt ?? annotation.published_date,
        )
      }
    }
  }

  // Some gateways expose only the flattened convenience field.
  const flat = text(body?.output_text)
  if (answer === undefined && flat !== undefined) answer = flat

  return { sources: collector.list(), searched, answer, usage: body?.usage }
}

/** Best-effort human message out of a gateway error envelope. */
export function errorMessage(body) {
  const error = body?.error
  if (text(error) !== undefined) return error
  if (text(error?.message) !== undefined) return error.message
  if (text(body?.message) !== undefined) return body.message
  return undefined
}

/** Number of server-side searches the gateway reported, when it reports one. */
export function reportedSearchCount(usage) {
  const value = usage?.server_tool_use?.web_search_requests
  return Number.isFinite(value) ? value : undefined
}

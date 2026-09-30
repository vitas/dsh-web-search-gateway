/**
 * Settings card for the `web-search-openrouter` namespace, rendered on the
 * Plugins settings tab through the keyed `settings.plugin.item` slot.
 *
 * Reads ride the framework describe-mirror via the bound settings scope (never
 * a private fetch); writes go through the scope's revision-fenced `set`/
 * `unset`, so this card and `settings.yaml` can never clobber each other. The
 * API key is the one value that does not live in the section: it is written
 * through the host's credential route into the DSH credential store and never
 * rides a settings response.
 *
 * Built from plain React + design tokens to respect DSH's client
 * bundle-purity rule.
 */
import * as React from 'react'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { localeRevision, subscribeLocale, tr } from './i18n.js'
import type { CredentialStatus, SettingsSnapshot, TestResult, WebSearchScope } from './types.js'

const CREDENTIAL_ROUTE = '/web-search-openrouter/credential'
const TEST_ROUTE = '/web-search-openrouter/test'

const PROTOCOLS = [
  { id: 'openai', labelKey: 'protocolOpenai' as const },
  { id: 'openrouter', labelKey: 'protocolOpenrouter' as const },
  { id: 'plugin', labelKey: 'protocolPlugin' as const },
]

const CONTEXT_SIZES = ['low', 'medium', 'high']

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 8px',
  borderRadius: 6,
  border: '1px solid var(--dsw-alias-border-default, #444)',
  background: 'var(--dsw-alias-bg-input, transparent)',
  color: 'var(--dsw-alias-text-primary, inherit)',
  font: 'inherit',
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }
const hintStyle: React.CSSProperties = { fontSize: 11, color: 'var(--dsw-alias-text-tertiary, #888)', marginTop: 3 }
const resetStyle: React.CSSProperties = {
  marginLeft: 6,
  font: 'inherit',
  fontSize: 10,
  background: 'none',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  textDecoration: 'underline',
}
const buttonStyle: React.CSSProperties = {
  font: 'inherit',
  fontSize: 12,
  padding: '5px 10px',
  borderRadius: 6,
  border: '1px solid var(--dsw-alias-border-default, #444)',
  background: 'var(--dsw-alias-bg-input, transparent)',
  color: 'inherit',
  cursor: 'pointer',
}
const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  padding: '1px 6px',
  borderRadius: 999,
  border: '1px solid var(--dsw-alias-border-default, #444)',
  color: 'var(--dsw-alias-text-tertiary, #888)',
}
const errorStyle: React.CSSProperties = { fontSize: 11, color: 'var(--dsw-alias-text-danger, #e66)', marginTop: 4 }

/** Observe the bound settings scope as a React snapshot. */
function useScopeSnapshot(scope: WebSearchScope): SettingsSnapshot {
  const subscribe = useCallback((listener: () => void) => scope.subscribe(listener), [scope])
  const get = useCallback(() => scope.getSnapshot(), [scope])
  return useSyncExternalStore(subscribe, get, get)
}

/** One labeled control: local draft while editing, parse-on-commit, reset-to-base. */
function Field(props: {
  id: string
  label: string
  hint: string
  value: string
  overridden: boolean
  disabled: boolean
  parse: (text: string) => unknown
  onCommit: (parsed: unknown) => void
  onReset: () => void
  multiline?: boolean
  monospace?: boolean
  inputType?: string
  placeholder?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const shown = draft ?? props.value
  const commit = () => {
    if (draft === null) return
    setDraft(null)
    try {
      const parsed = props.parse(shown)
      setError(null)
      props.onCommit(parsed)
    } catch (e) {
      setError(String((e as Error)?.message ?? e))
    }
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={props.id} style={labelStyle}>
        {props.label}
        {props.overridden && (
          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color: 'var(--dsw-alias-text-accent, #69f)' }}>
            {tr('overridden')}
            <button type="button" style={resetStyle} onClick={props.onReset} disabled={props.disabled}>
              {tr('reset')}
            </button>
          </span>
        )}
      </label>
      {props.multiline ? (
        <textarea
          id={props.id}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
          value={shown}
          disabled={props.disabled}
          placeholder={props.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
        />
      ) : (
        <input
          id={props.id}
          type={props.inputType ?? 'text'}
          style={{ ...inputStyle, ...(props.monospace ? { fontFamily: 'var(--dsw-alias-font-mono, monospace)' } : {}) }}
          value={shown}
          disabled={props.disabled}
          placeholder={props.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
      )}
      <div style={hintStyle}>{props.hint}</div>
      {error !== null && <div style={errorStyle}>{error}</div>}
    </div>
  )
}

/** A `<select>` over a fixed option list. */
function SelectField(props: {
  id: string
  label: string
  hint: string
  value: string
  options: Array<{ value: string; label: string }>
  overridden: boolean
  disabled: boolean
  onCommit: (value: string) => void
  onReset: () => void
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={props.id} style={labelStyle}>
        {props.label}
        {props.overridden && (
          <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color: 'var(--dsw-alias-text-accent, #69f)' }}>
            {tr('overridden')}
            <button type="button" style={resetStyle} onClick={props.onReset} disabled={props.disabled}>
              {tr('reset')}
            </button>
          </span>
        )}
      </label>
      <select
        id={props.id}
        style={inputStyle}
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onCommit(e.target.value)}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div style={hintStyle}>{props.hint}</div>
    </div>
  )
}

/** Comma-separated string <-> domain list. */
function parseDomains(text: string): string[] | undefined {
  const list = text
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0)
  return list.length > 0 ? [...new Set(list)] : undefined
}

function formatDomains(value: unknown): string {
  return Array.isArray(value) ? value.join(', ') : ''
}

/** Whole-number parser that leaves the field unset when blank. */
function parseOptionalInt(text: string): number | undefined {
  const trimmed = text.trim()
  if (trimmed.length === 0) return undefined
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`"${text}" is not a positive whole number`)
  return parsed
}

/** The API-key row: write-only input plus the host's credential state. */
function KeyRow(props: { scope: WebSearchScope; apiKeyEnv: string; disabled: boolean }) {
  const [status, setStatus] = useState<CredentialStatus | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(CREDENTIAL_ROUTE, { headers: { accept: 'application/json' } })
      setStatus((await response.json()) as CredentialStatus)
    } catch {
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh, props.apiKeyEnv])

  const write = async (value: string) => {
    setBusy(true)
    setNotice(null)
    setError(null)
    try {
      const response = await fetch(CREDENTIAL_ROUTE, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      const result = (await response.json()) as CredentialStatus
      setStatus(result)
      if (result.ok) {
        setDraft('')
        setNotice(value.length === 0 ? tr('keyCleared') : tr('keySaved'))
      } else {
        setError(tr('keyFailed', { error: result.error ?? 'unknown error' }))
      }
    } catch (e) {
      setError(tr('keyFailed', { error: String((e as Error)?.message ?? e) }))
    } finally {
      setBusy(false)
    }
  }

  const configured = status?.configured === true
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor="web-search-openrouter-key" style={labelStyle}>
        {tr('apiKeyLabel')}{' '}
        <span style={badgeStyle}>
          {configured ? tr('keyConfigured') : tr('keyMissing')}
          {status?.source !== undefined ? ` · ${tr('keySource', { source: status.source })}` : ''}
        </span>
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          id="web-search-openrouter-key"
          type="password"
          autoComplete="off"
          style={inputStyle}
          value={draft}
          placeholder={tr('apiKeyPlaceholder')}
          disabled={props.disabled || busy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.length > 0) void write(draft)
          }}
        />
        <button type="button" style={buttonStyle} disabled={props.disabled || busy || draft.length === 0} onClick={() => void write(draft)}>
          {tr('keyWrite')}
        </button>
        <button type="button" style={buttonStyle} disabled={props.disabled || busy || !configured} onClick={() => void write('')}>
          {tr('keyClear')}
        </button>
      </div>
      <div style={hintStyle}>{tr('apiKeyHint')}</div>
      {notice !== null && <div style={{ ...hintStyle, color: 'var(--dsw-alias-text-accent, #69f)' }}>{notice}</div>}
      {error !== null && <div style={errorStyle}>{error}</div>}
    </div>
  )
}

/** The connection test: one real search through the saved configuration. */
function TestPanel(props: { disabled: boolean }) {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const run = async () => {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch(TEST_ROUTE, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(query.trim().length > 0 ? { query: query.trim() } : {}),
      })
      setResult((await response.json()) as TestResult)
    } catch (e) {
      setResult({ ok: false, error: String((e as Error)?.message ?? e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--dsw-alias-border-default, #333)' }}>
      <div style={{ ...labelStyle, marginBottom: 6 }}>{tr('testTitle')}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          style={inputStyle}
          value={query}
          placeholder={tr('testQueryHint')}
          disabled={props.disabled || busy}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void run()
          }}
        />
        <button type="button" style={buttonStyle} disabled={props.disabled || busy} onClick={() => void run()}>
          {busy ? tr('testing') : tr('testButton')}
        </button>
      </div>
      <div style={hintStyle}>{tr('testHint')}</div>
      {result !== null && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          {result.ok ? (
            <>
              <div style={{ color: 'var(--dsw-alias-text-accent, #69f)' }}>
                {result.sources && result.sources.length > 0
                  ? tr('testOk', { n: result.sources.length, ms: result.durationMs ?? 0 })
                  : tr('testNoSources')}
              </div>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {(result.sources ?? []).slice(0, 5).map((source) => (
                  <li key={source.url} style={{ marginBottom: 2 }}>
                    <a href={source.url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                      {source.title ?? source.url}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <div style={errorStyle}>
                {tr('testFailed')}
                {result.code !== undefined ? ` (${result.code})` : ''}: {result.error}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Top-level card.
 *
 * Renders the namespace's status line while it has no values to edit. `heading`
 * draws the card's own title and subtitle; the DSH 0.1.7 plugin manager page
 * supplies both itself around the row's form, so the registration there passes
 * `heading: false` rather than printing the title twice.
 */
export function WebSearchSettingsCard(props: { scope: WebSearchScope; heading?: boolean }) {
  const snapshot = useScopeSnapshot(props.scope)
  // Re-render on active-language change; `tr` reads the translator at render time.
  useSyncExternalStore(subscribeLocale, localeRevision, localeRevision)
  if (snapshot.status === 'unavailable') {
    return <div style={{ fontSize: 12 }}>{tr('unavailable')}</div>
  }
  if (snapshot.status === 'loading' || snapshot.value === undefined) {
    return <div style={{ fontSize: 12 }}>{tr('loading')}</div>
  }

  const value = snapshot.value
  const user = (snapshot.user !== null && typeof snapshot.user === 'object' ? snapshot.user : {}) as Record<string, unknown>
  const disabled = snapshot.writable === false
  const overridden = (field: string) => field in user
  const set = (field: string, next: unknown) => {
    if (next === undefined) void props.scope.unset(field)
    else void props.scope.set(field, next)
  }
  const isOpenRouter = (value.protocol ?? 'openai') === 'openrouter'

  return (
    <div>
      {props.heading === false ? null : (
        <>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{tr('title')}</div>
          <div style={{ ...hintStyle, marginBottom: 12 }}>{tr('subtitle')}</div>
        </>
      )}

      <SelectField
        id="web-search-openrouter-protocol"
        label={tr('protocolLabel')}
        hint={tr('protocolHint')}
        value={value.protocol ?? 'openai'}
        options={PROTOCOLS.map((protocol) => ({ value: protocol.id, label: tr(protocol.labelKey) }))}
        overridden={overridden('protocol')}
        disabled={disabled}
        onCommit={(next) => set('protocol', next)}
        onReset={() => set('protocol', undefined)}
      />

      <Field
        id="web-search-openrouter-baseurl"
        label={tr('baseUrlLabel')}
        hint={tr('baseUrlHint')}
        monospace
        value={value.baseURL ?? ''}
        overridden={overridden('baseURL')}
        disabled={disabled}
        parse={(text) => (text.trim().length > 0 ? text.trim() : undefined)}
        onCommit={(next) => set('baseURL', next)}
        onReset={() => set('baseURL', undefined)}
      />

      <Field
        id="web-search-openrouter-model"
        label={tr('modelLabel')}
        hint={tr('modelHint')}
        monospace
        value={value.model ?? ''}
        overridden={overridden('model')}
        disabled={disabled}
        parse={(text) => (text.trim().length > 0 ? text.trim() : undefined)}
        onCommit={(next) => set('model', next)}
        onReset={() => set('model', undefined)}
      />

      <Field
        id="web-search-openrouter-keyenv"
        label={tr('apiKeyEnvLabel')}
        hint={tr('apiKeyEnvHint')}
        monospace
        value={value.apiKeyEnv ?? ''}
        overridden={overridden('apiKeyEnv')}
        disabled={disabled}
        parse={(text) => (text.trim().length > 0 ? text.trim() : undefined)}
        onCommit={(next) => set('apiKeyEnv', next)}
        onReset={() => set('apiKeyEnv', undefined)}
      />

      <KeyRow scope={props.scope} apiKeyEnv={value.apiKeyEnv ?? ''} disabled={disabled} />

      <Field
        id="web-search-openrouter-maxresults"
        label={tr('maxResultsLabel')}
        hint={tr('maxResultsHint')}
        inputType="number"
        value={value.maxResults === undefined ? '' : String(value.maxResults)}
        overridden={overridden('maxResults')}
        disabled={disabled}
        parse={parseOptionalInt}
        onCommit={(next) => set('maxResults', next)}
        onReset={() => set('maxResults', undefined)}
      />

      <Field
        id="web-search-openrouter-maxoutput"
        label={tr('maxOutputTokensLabel')}
        hint={tr('maxOutputTokensHint')}
        inputType="number"
        value={value.maxOutputTokens === undefined ? '' : String(value.maxOutputTokens)}
        overridden={overridden('maxOutputTokens')}
        disabled={disabled}
        parse={parseOptionalInt}
        onCommit={(next) => set('maxOutputTokens', next)}
        onReset={() => set('maxOutputTokens', undefined)}
      />

      {isOpenRouter && (
        <>
          <Field
            id="web-search-openrouter-engine"
            label={tr('engineLabel')}
            hint={tr('engineHint')}
            value={value.engine ?? ''}
            overridden={overridden('engine')}
            disabled={disabled}
            parse={(text) => (text.trim().length > 0 ? text.trim() : undefined)}
            onCommit={(next) => set('engine', next)}
            onReset={() => set('engine', undefined)}
          />
          <SelectField
            id="web-search-openrouter-context"
            label={tr('contextSizeLabel')}
            hint={tr('contextSizeHint')}
            value={value.searchContextSize ?? 'medium'}
            options={CONTEXT_SIZES.map((size) => ({ value: size, label: size }))}
            overridden={overridden('searchContextSize')}
            disabled={disabled}
            onCommit={(next) => set('searchContextSize', next)}
            onReset={() => set('searchContextSize', undefined)}
          />
        </>
      )}

      <Field
        id="web-search-openrouter-allow"
        label={tr('filterLabel')}
        hint={tr('filterHint')}
        value={formatDomains(value.allowedDomains)}
        overridden={overridden('allowedDomains')}
        disabled={disabled}
        parse={parseDomains}
        onCommit={(next) => set('allowedDomains', next)}
        onReset={() => set('allowedDomains', undefined)}
      />

      <Field
        id="web-search-openrouter-block"
        label={tr('excludeLabel')}
        hint={tr('excludeHint')}
        value={formatDomains(value.excludedDomains)}
        overridden={overridden('excludedDomains')}
        disabled={disabled}
        parse={parseDomains}
        onCommit={(next) => set('excludedDomains', next)}
        onReset={() => set('excludedDomains', undefined)}
      />

      <label style={{ ...labelStyle, fontWeight: 400, marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={value.includeAnswer === true}
          disabled={disabled}
          onChange={(e) => set('includeAnswer', e.target.checked ? true : undefined)}
        />{' '}
        {tr('includeAnswerLabel')}
        <div style={hintStyle}>{tr('includeAnswerHint')}</div>
      </label>

      <TestPanel disabled={disabled} />
    </div>
  )
}

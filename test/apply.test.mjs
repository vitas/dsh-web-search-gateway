/**
 * End-to-end wiring test for the plugin entry: proves that `apply` registers
 * exactly one provider under the expected id, installs the settings section
 * under the expected namespace with a schema that supplies the documented
 * defaults, and exposes the two loopback routes the settings card calls.
 *
 * No network: the missing-credential path is asserted offline.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { apply, CREDENTIAL_ROUTE, TEST_ROUTE, name } from '../src/host/index.js'
import { PROVIDER_ID, SETTINGS_NAMESPACE } from '../src/shared/config.mjs'

/** Build a ctx stub that records what the plugin registers. */
function makeCtx(options = {}) {
  const record = { providers: [], sections: [], routes: [], effects: [], logs: [] }
  const credentials = options.credentials
  const ctx = {
    get: (service) => (service === 'credentials' ? credentials : undefined),
    logger: {
      info: (message) => record.logs.push(message),
      debug: (message) => record.logs.push(message),
    },
    web: {
      registerSearchProvider: (provider) => record.providers.push(provider),
    },
    effect: (fn) => record.effects.push(fn),
    inject: (services, callback) => {
      if (services.includes('settings')) {
        callback({
          settings: {
            installSection: (owner, namespace, schema, entry, hooks) => {
              record.sections.push({ owner, namespace, schema, entry, hooks })
            },
          },
        })
      }
      if (services.includes('webServer')) {
        callback({
          webServer: {
            register: (route) => {
              record.routes.push(route)
              return () => {}
            },
          },
          effect: (fn) => record.effects.push(fn),
        })
      }
    },
  }
  return { ctx, record }
}

/** Invoke one route handler with a fake request and capture the response. */
async function callRoute(route, { method = 'POST', body } = {}) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))]
  const req = {
    method,
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) yield chunk
    },
  }
  let status
  let payload
  const res = {
    writeHead: (code) => {
      status = code
    },
    end: (data) => {
      payload = data
    },
  }
  await route.handler(req, res)
  return { status, body: payload === undefined || payload === '' ? undefined : JSON.parse(payload) }
}

test('the plugin exports the name the composition entry expects', () => {
  assert.equal(name, 'web-search-openrouter')
})

test('apply registers one provider under the configured id and installs the section', async () => {
  const { ctx, record } = makeCtx()
  await apply(ctx, { baseURL: 'https://gateway.example/v1', model: 'm', apiKeyEnv: 'SOME_KEY' })

  assert.equal(record.providers.length, 1)
  assert.equal(record.providers[0].id, PROVIDER_ID)
  assert.equal(record.providers[0].available(), true)

  const section = record.sections.find((entry) => entry.namespace === SETTINGS_NAMESPACE)
  assert.ok(section !== undefined, 'the settings namespace must be installed')
  assert.equal(section.entry.baseURL, 'https://gateway.example/v1')

  const paths = record.routes.map((route) => route.path)
  assert.deepEqual(paths, [TEST_ROUTE, CREDENTIAL_ROUTE])
  for (const route of record.routes) assert.equal(route.kind, 'exact')
})

test('the installed schema supplies the documented defaults', async () => {
  const { ctx, record } = makeCtx()
  await apply(ctx, {})
  const section = record.sections[0]
  const resolved = section.schema({})
  assert.equal(resolved.protocol, 'openai')
  assert.equal(resolved.baseURL, 'https://openrouter.ai/api/v1')
  assert.equal(resolved.model, 'openai/gpt-5.2')
  assert.equal(resolved.apiKeyEnv, 'OPENROUTER_API_KEY')
  assert.equal(resolved.maxResults, 5)
  assert.equal(resolved.maxOutputTokens, 1024)
  assert.equal(resolved.includeAnswer, false)
})

test('a 0.1.7 volatile accessor is unwrapped, not read as a field', async () => {
  const { ctx, record } = makeCtx()
  // DSH 0.1.7 hands every volatile field over as a live accessor instead of a
  // value. Reading one as a scalar yields the accessor object, which then reads
  // as an absent field, so the row silently falls back to the schema defaults
  // and the user's own endpoint and model never reach the search.
  await apply(ctx, {
    baseURL: { get: () => 'https://api.b.ai/v1' },
    model: { get: () => 'gpt-5.4-nano' },
    maxResults: { get: () => 7 },
  })
  const options = record.providers[0].resolveOptions()
  assert.equal(options.baseURL, 'https://api.b.ai/v1')
  assert.equal(options.model, 'gpt-5.4-nano')
  assert.equal(options.maxResults, 7)
})

test('the settings section forwards live edits through setSource', async () => {
  const { ctx, record } = makeCtx()
  await apply(ctx, { model: 'composed' })
  const { setSource } = record.sections[0].hooks
  assert.equal(typeof setSource, 'function')
  setSource(() => ({ model: 'edited-live' }))
  // The provider projects the new source on its next search.
  const options = record.providers[0].resolveOptions()
  assert.equal(options.model, 'edited-live')
})

test('a missing credential is reported as a routable failure, not a throw', async () => {
  const { ctx, record } = makeCtx()
  await apply(ctx, { baseURL: 'https://gateway.invalid/v1', model: 'm', apiKeyEnv: 'ABSENT_KEY_FOR_TEST' })
  delete process.env.ABSENT_KEY_FOR_TEST

  const testRoute = record.routes.find((route) => route.path === TEST_ROUTE)
  const { status, body } = await callRoute(testRoute, { body: {} })
  assert.equal(status, 200)
  assert.equal(body.ok, false)
  assert.equal(body.code, 'WEB_PROVIDER_CREDENTIAL_MISSING')
  assert.equal(body.protocol, 'openai')
})

test('the test route rejects anything but POST', async () => {
  const { ctx, record } = makeCtx()
  await apply(ctx, {})
  const testRoute = record.routes.find((route) => route.path === TEST_ROUTE)
  const { status } = await callRoute(testRoute, { method: 'GET' })
  assert.equal(status, 405)
})

test('the credential route reports an unusable reference instead of writing', async () => {
  const { ctx, record } = makeCtx()
  await apply(ctx, { apiKeyEnv: 'not a ref' })
  const route = record.routes.find((entry) => entry.path === CREDENTIAL_ROUTE)

  const read = await callRoute(route, { method: 'GET' })
  assert.equal(read.body.ok, false)

  const write = await callRoute(route, { body: { value: 'sk-new' } })
  assert.equal(write.body.ok, false)
  assert.match(write.body.error, /not a valid credential reference/)
})

test('the credential route reads and writes through the credentials service', async () => {
  const calls = []
  const credentials = {
    describe: async (ref) => ({ configured: true, writable: true, source: 'store' }),
    set: async (ref, value) => calls.push(['set', ref, value]),
    unset: async (ref) => calls.push(['unset', ref]),
  }
  const { ctx, record } = makeCtx({ credentials })
  await apply(ctx, { apiKeyEnv: 'MY_KEY' })
  const route = record.routes.find((entry) => entry.path === CREDENTIAL_ROUTE)

  const read = await callRoute(route, { method: 'GET' })
  assert.deepEqual(read.body, { ok: true, apiKeyEnv: 'MY_KEY', configured: true, writable: true, source: 'store' })

  await callRoute(route, { body: { value: 'sk-new' } })
  await callRoute(route, { body: { value: '' } })
  assert.deepEqual(calls, [['set', 'MY_KEY', 'sk-new'], ['unset', 'MY_KEY']])
})

test('a credential write failure is reported, never thrown at the card', async () => {
  const credentials = {
    describe: async () => ({ configured: false, writable: true }),
    set: async () => {
      throw new Error('read-only source shadows this reference')
    },
    unset: async () => {},
  }
  const { ctx, record } = makeCtx({ credentials })
  await apply(ctx, { apiKeyEnv: 'MY_KEY' })
  const route = record.routes.find((entry) => entry.path === CREDENTIAL_ROUTE)
  const { status, body } = await callRoute(route, { body: { value: 'sk-new' } })
  assert.equal(status, 200)
  assert.equal(body.ok, false)
  assert.match(body.error, /read-only source/)
})

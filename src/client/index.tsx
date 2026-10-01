/**
 * `dsh-web-search-gateway` — browser half.
 *
 * Registers the `web-search-openrouter` configuration card on whichever Plugins
 * surface the running client offers, without a version check:
 *
 * - DSH 0.1.7+ moved Plugins to a sidebar page (`dsh-client-ui-plugin-manager`)
 *   and keys row configuration by `<package name>#<row id>` on the
 *   `plugins.row.config` slot. The page owns the row's form, and
 *   `ctx.configForms.get(NS)` is the scope the card binds — deliberately the
 *   same `getSnapshot`/`subscribe`/`set`/`unset` shape the old settings scope
 *   had, so the card itself did not have to change with the seam.
 * - DSH 0.1.5 keeps the Plugins settings tab and the `settings.plugin.item`
 *   slot, bound through `ctx.settingsScope.bind({ namespace })`.
 *
 * Each surface is registered through its own `ctx.inject`, so a fiber fires
 * only where its service exists: 0.1.7 has no `settingsScope` and 0.1.5 has no
 * `configForms`. Uses only cordis client context services and its own
 * components — no value imports from other DSH client packages (bundle-purity
 * rule). Where neither seam exists the fibers never fire and nothing throws.
 *
 * Localization: registers en/zh dictionaries (the locales DSH ships) plus a
 * Russian language pack — `addLanguage({ id: 'ru' })` makes Russian selectable
 * and re-evaluates the browser language list, so a Russian browser activates it
 * automatically.
 */
import * as React from 'react'
import { WebSearchSettingsCard } from './SettingsCard.js'
import { bindTranslator, notifyLocale, tr } from './i18n.js'
import { en, zh, ru } from './locales.js'
import { PACKAGE_NAME, ROW_CONFIG_KEY, SETTINGS_NAMESPACE as NS } from '../shared/config.mjs'

export const name = 'dsh-web-search-gateway'
export const inject = ['slots', 'locale']

/** Register the copy dictionaries and bind the translator. */
function wireLocale(ctx: any): void {
  const locale = ctx.locale
  if (!locale) return
  try {
    ctx.effect(() => locale.register(NS, 'en', en))
    ctx.effect(() => locale.register(NS, 'zh', zh))
    ctx.effect(() => locale.register(NS, 'ru', ru))
    const hasRu = (locale.getSnapshot?.().locales ?? []).some((entry: { id: string }) => entry.id === 'ru')
    if (!hasRu) ctx.effect(() => locale.addLanguage({ id: 'ru', label: 'Русский', fallback: 'en' }))
    const translate = locale.bind(NS)
    bindTranslator((key: string, params?: Record<string, string | number>) => translate(key, params))
    // Re-render the mounted card when the active language changes.
    ctx.effect(() => locale.subscribe(() => notifyLocale()))
  } catch {
    // The i18n shim already renders English; a locale anomaly must not hide the card.
  }
}

/**
 * DSH 0.1.7+ — the settings form on the plugin manager page.
 *
 * There are two keyed slots for it, and the choice decides how many clicks the
 * form is worth. `plugins.bundle.config`, keyed by package name, is what the
 * shipped bundles use: the page draws the section itself and the form is there the
 * moment the plugin page opens. `plugins.row.config`, keyed `<package>#<row id>`,
 * instead files the form on the row's own page, one click away behind a Configure
 * control in Components — correct, but not what anyone expects next to a shipped
 * plugin.
 *
 * So we register the package slot as the primary surface and keep the row slot for
 * 0.1.7, which knows only that one.
 *
 * `view: 'summary'` is the row's one-liner, shown when the package carries no
 * description of its own; `view: 'page'` is the form. The page draws the title,
 * icon, and crumb around that form, so the card drops its own heading here.
 *
 * @param ctx - the browser plugin context.
 */
function registerRowConfig(ctx: any): void {
  ctx.inject(['configForms'], (c: any) => {
    const card = (props: { view?: string }) =>
      props?.view === 'summary'
        ? React.createElement('span', null, tr('summary'))
        : React.createElement(WebSearchSettingsCard, { scope: c.configForms.get(NS), heading: false })

    // Each surface is guarded on its own, so a loader that predates the package
    // slot still gets the row page instead of losing the form entirely.
    const register = () => {
      try {
        c.slots.inject('plugins.bundle.config', () =>
          c.slots.register({ name: 'plugins.bundle.config', key: PACKAGE_NAME, locale: NS }, card),
        )
      } catch {
        // 0.1.7 declares no package-page slot; the row page below is the surface.
      }
      try {
        c.slots.inject('plugins.row.config', () =>
          c.slots.register({ name: 'plugins.row.config', key: ROW_CONFIG_KEY, locale: NS }, card),
        )
      } catch {
        // A slot anomaly must never break the Plugins page itself.
      }
    }

    try {
      // `whileServed` keeps the registration alive only while the Host actually
      // serves our namespace, so a deployment that never composed us shows no
      // trace of the entry.
      if (typeof c.configForms?.whileServed === 'function') {
        c.effect(() => c.configForms.whileServed([NS], register), 'web-search-openrouter: settings page')
      } else {
        register()
      }
    } catch {
      // A slot anomaly must never break the Plugins page itself.
    }
  })
}

/**
 * DSH 0.1.5 — the Plugins settings tab, keyed by the settings namespace.
 *
 * @param ctx - the browser plugin context.
 */
function registerSettingsItem(ctx: any): void {
  ctx.inject(['settingsScope'], (c: any) => {
    try {
      const scope = c.settingsScope.bind({ namespace: NS })
      c.slots.inject('settings.plugin.item', () =>
        c.slots.register({ name: 'settings.plugin.item', key: NS, id: 'web-search-openrouter', order: 20 }, () =>
          React.createElement(WebSearchSettingsCard, { scope }),
        ),
      )
    } catch {
      // Binding anomalies must never break the settings page itself.
    }
  })
}

export function apply(ctx: any) {
  wireLocale(ctx)
  registerRowConfig(ctx)
  registerSettingsItem(ctx)
}

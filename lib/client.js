window.__ModuleLoader__.load({
	id: "dsh-web-search-gateway",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		"use strict";
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __export = (target, all) => {
		  for (var name2 in all)
		    __defProp(target, name2, { get: all[name2], enumerable: true });
		};
		var __copyProps = (to, from, except, desc) => {
		  if (from && typeof from === "object" || typeof from === "function") {
		    for (let key of __getOwnPropNames(from))
		      if (!__hasOwnProp.call(to, key) && key !== except)
		        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
		  }
		  return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
		  // If the importer is in node compatibility mode or this is not an ESM
		  // file that has been converted to a CommonJS file using a Babel-
		  // compatible transform (i.e. "__esModule" has not been set), then set
		  // "default" to the CommonJS "module.exports" for node compatibility.
		  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
		  mod
		));
		var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

		// src/client/index.tsx
		var index_exports = {};
		__export(index_exports, {
		  apply: () => apply,
		  inject: () => inject,
		  name: () => name
		});
		module.exports = __toCommonJS(index_exports);
		var React = __toESM(require("react"), 1);

		// src/client/SettingsCard.tsx
		var import_react = require("react");

		// src/client/locales.ts
		var en = {
		  title: "Web search (OpenRouter)",
		  subtitle: "Runs the built-in web_search tool on your OpenRouter-compatible gateway — same endpoint and key as your chat models.",
		  // Row one-liner on the DSH 0.1.7 plugin manager page, shown when the row
		  // carries no description of its own. Shorter than `subtitle` on purpose: it
		  // sits in a detail page's description slot, not under a card title.
		  summary: "Runs web_search on your own OpenRouter-compatible gateway — same endpoint and key as your chat models.",
		  loading: "Loading…",
		  unavailable: "This composition does not expose the settings namespace. Configuration stays in the profile patch.",
		  overridden: "overridden",
		  reset: "reset",
		  protocolLabel: "Protocol",
		  protocolHint: 'How server-side search is switched on. Use "Native" for OpenAI and gateways that proxy the native tool; "OpenRouter server tool" on openrouter.ai; "Deprecated plugin" only for older gateways.',
		  protocolOpenai: "Native web_search tool",
		  protocolOpenrouter: "OpenRouter server tool",
		  protocolPlugin: "Deprecated plugins[] field",
		  baseUrlLabel: "Endpoint",
		  baseUrlHint: "Gateway base URL; /responses is appended. e.g. https://openrouter.ai/api/v1",
		  modelLabel: "Search model",
		  modelHint: "Any model the gateway exposes with web search. Cheap models are best — the search turn is billed as tokens.",
		  maxResultsLabel: "Results per search",
		  maxResultsHint: "Requested result count, 1–25. Lower is cheaper.",
		  maxOutputTokensLabel: "Output cap",
		  maxOutputTokensHint: "max_output_tokens for one search turn.",
		  includeAnswerLabel: "Include the search model answer",
		  includeAnswerHint: "Off keeps the conversation lean: only citeable sources are returned.",
		  engineLabel: "Search engine",
		  engineHint: "OpenRouter only: auto, native, exa, firecrawl or parallel.",
		  contextSizeLabel: "Context size",
		  contextSizeHint: "OpenRouter only: low, medium or high.",
		  apiKeyEnvLabel: "Key reference",
		  apiKeyEnvHint: "Name of the credential the search reads, resolved per call.",
		  apiKeyLabel: "API key",
		  apiKeyHint: "Stored in the DSH credential store. Leave blank to keep the current key.",
		  apiKeyPlaceholder: "paste a new key to replace",
		  keyConfigured: "key configured",
		  keyMissing: "no key stored",
		  keySource: "from {source}",
		  keyWrite: "Save key",
		  keyClear: "Clear key",
		  keySaved: "Key saved",
		  keyCleared: "Key cleared",
		  keyFailed: "Could not write the key: {error}",
		  testTitle: "Connection test",
		  testHint: "Runs one real search through the saved configuration.",
		  testButton: "Test search",
		  testing: "Searching…",
		  testOk: "{n} sources in {ms} ms",
		  testNoSources: "The gateway searched but returned no citeable sources.",
		  testFailed: "Failed",
		  testQueryLabel: "Probe query",
		  testQueryHint: "The query the test sends.",
		  filterLabel: "Allow domains",
		  filterHint: "Comma-separated hostnames; empty means no filter.",
		  excludeLabel: "Block domains",
		  excludeHint: "Comma-separated hostnames to exclude.",
		  docs: "Setup guide"
		};
		var zh = {
		  title: "网页搜索（OpenRouter）",
		  subtitle: "让内置的 web_search 工具走你的 OpenRouter 兼容网关——与对话模型共用同一个端点和密钥。",
		  summary: "让 web_search 走你自己的 OpenRouter 兼容网关——与对话模型共用同一个端点和密钥。",
		  loading: "加载中…",
		  unavailable: "当前组合未暴露设置命名空间，配置仍以 profile 补丁为准。",
		  overridden: "已覆盖",
		  reset: "重置",
		  protocolLabel: "协议",
		  protocolHint: "开启服务端搜索的方式。OpenAI 及代理原生工具的网关用「原生」；openrouter.ai 用「OpenRouter 服务端工具」；仅旧网关用「已弃用插件字段」。",
		  protocolOpenai: "原生 web_search 工具",
		  protocolOpenrouter: "OpenRouter 服务端工具",
		  protocolPlugin: "已弃用的 plugins[] 字段",
		  baseUrlLabel: "端点",
		  baseUrlHint: "网关基础地址，会自动追加 /responses。例如 https://openrouter.ai/api/v1",
		  modelLabel: "搜索模型",
		  modelHint: "网关上任何支持网页搜索的模型。建议用便宜模型——搜索轮次按 token 计费。",
		  maxResultsLabel: "每次结果数",
		  maxResultsHint: "请求的结果条数，1–25。越少越便宜。",
		  maxOutputTokensLabel: "输出上限",
		  maxOutputTokensHint: "单次搜索轮次的 max_output_tokens。",
		  includeAnswerLabel: "包含搜索模型的回答",
		  includeAnswerHint: "关闭可保持上下文精简：只返回可引用来源。",
		  engineLabel: "搜索引擎",
		  engineHint: "仅 OpenRouter：auto、native、exa、firecrawl 或 parallel。",
		  contextSizeLabel: "上下文规模",
		  contextSizeHint: "仅 OpenRouter：low、medium 或 high。",
		  apiKeyEnvLabel: "密钥引用名",
		  apiKeyEnvHint: "搜索读取的凭据名称，每次调用都会重新解析。",
		  apiKeyLabel: "API 密钥",
		  apiKeyHint: "保存在 DSH 凭据库中。留空则保留当前密钥。",
		  apiKeyPlaceholder: "粘贴新密钥以替换",
		  keyConfigured: "已配置密钥",
		  keyMissing: "未存储密钥",
		  keySource: "来源：{source}",
		  keyWrite: "保存密钥",
		  keyClear: "清除密钥",
		  keySaved: "密钥已保存",
		  keyCleared: "密钥已清除",
		  keyFailed: "密钥写入失败：{error}",
		  testTitle: "连接测试",
		  testHint: "用已保存的配置执行一次真实搜索。",
		  testButton: "测试搜索",
		  testing: "搜索中…",
		  testOk: "{ms} 毫秒内返回 {n} 条来源",
		  testNoSources: "网关执行了搜索，但没有返回可引用来源。",
		  testFailed: "失败",
		  testQueryLabel: "探测查询",
		  testQueryHint: "测试发送的查询词。",
		  filterLabel: "允许域名",
		  filterHint: "逗号分隔的主机名；留空表示不过滤。",
		  excludeLabel: "屏蔽域名",
		  excludeHint: "要排除的逗号分隔主机名。",
		  docs: "配置指南"
		};
		var ru = {
		  title: "Веб-поиск (OpenRouter)",
		  subtitle: "Встроенный инструмент web_search работает через ваш OpenRouter-совместимый шлюз — тот же endpoint и ключ, что у чат-моделей.",
		  summary: "Инструмент web_search работает через ваш OpenRouter-совместимый шлюз — тот же endpoint и ключ, что у чат-моделей.",
		  loading: "Загрузка…",
		  unavailable: "В этой сборке нет пространства настроек. Конфигурация остаётся в патче профиля.",
		  overridden: "переопределено",
		  reset: "сбросить",
		  protocolLabel: "Протокол",
		  protocolHint: "Способ включения серверного поиска. «Нативный» — для OpenAI и шлюзов, проксирующих нативный инструмент; «серверный инструмент OpenRouter» — для openrouter.ai; «устаревший plugins[]» — только для старых шлюзов.",
		  protocolOpenai: "Нативный инструмент web_search",
		  protocolOpenrouter: "Серверный инструмент OpenRouter",
		  protocolPlugin: "Устаревшее поле plugins[]",
		  baseUrlLabel: "Endpoint",
		  baseUrlHint: "Базовый URL шлюза; /responses добавляется автоматически. Например https://openrouter.ai/api/v1",
		  modelLabel: "Модель поиска",
		  modelHint: "Любая модель шлюза с поддержкой веб-поиска. Берите дешёвую — поиск тарифицируется токенами.",
		  maxResultsLabel: "Результатов на запрос",
		  maxResultsHint: "Запрашиваемое число результатов, 1–25. Меньше — дешевле.",
		  maxOutputTokensLabel: "Лимит вывода",
		  maxOutputTokensHint: "max_output_tokens на один поисковый запрос.",
		  includeAnswerLabel: "Включать ответ модели поиска",
		  includeAnswerHint: "Выключено — контекст остаётся компактным: возвращаются только источники.",
		  engineLabel: "Поисковый движок",
		  engineHint: "Только OpenRouter: auto, native, exa, firecrawl или parallel.",
		  contextSizeLabel: "Размер контекста",
		  contextSizeHint: "Только OpenRouter: low, medium или high.",
		  apiKeyEnvLabel: "Имя ссылки на ключ",
		  apiKeyEnvHint: "Имя credential, которое читает поиск; резолвится на каждый вызов.",
		  apiKeyLabel: "API-ключ",
		  apiKeyHint: "Хранится в credential-сторе DSH. Оставьте пустым, чтобы сохранить текущий.",
		  apiKeyPlaceholder: "вставьте новый ключ для замены",
		  keyConfigured: "ключ настроен",
		  keyMissing: "ключ не сохранён",
		  keySource: "источник: {source}",
		  keyWrite: "Сохранить ключ",
		  keyClear: "Удалить ключ",
		  keySaved: "Ключ сохранён",
		  keyCleared: "Ключ удалён",
		  keyFailed: "Не удалось записать ключ: {error}",
		  testTitle: "Проверка соединения",
		  testHint: "Выполняет один настоящий поиск с сохранённой конфигурацией.",
		  testButton: "Проверить поиск",
		  testing: "Идёт поиск…",
		  testOk: "{n} источников за {ms} мс",
		  testNoSources: "Шлюз выполнил поиск, но не вернул источников.",
		  testFailed: "Ошибка",
		  testQueryLabel: "Тестовый запрос",
		  testQueryHint: "Запрос, который отправляет проверка.",
		  filterLabel: "Разрешённые домены",
		  filterHint: "Хосты через запятую; пусто — без фильтра.",
		  excludeLabel: "Исключённые домены",
		  excludeHint: "Хосты через запятую, которые нужно исключить.",
		  docs: "Руководство по настройке"
		};

		// src/client/i18n.ts
		function interpolate(template, params) {
		  if (!params) return template;
		  return template.replace(/\{(\w+)\}/g, (match, name2) => name2 in params ? String(params[name2]) : match);
		}
		var active = (key, params) => interpolate(String(en[key] ?? key), params);
		function bindTranslator(translate) {
		  active = translate;
		}
		var tr = (key, params) => active(key, params);
		var listeners = /* @__PURE__ */ new Set();
		var version = 0;
		function subscribeLocale(listener) {
		  listeners.add(listener);
		  return () => listeners.delete(listener);
		}
		function localeRevision() {
		  return version;
		}
		function notifyLocale() {
		  version += 1;
		  for (const listener of listeners) listener();
		}

		// src/client/SettingsCard.tsx
		var import_jsx_runtime = require("react/jsx-runtime");
		var CREDENTIAL_ROUTE = "/web-search-openrouter/credential";
		var TEST_ROUTE = "/web-search-openrouter/test";
		var PROTOCOLS = [
		  { id: "openai", labelKey: "protocolOpenai" },
		  { id: "openrouter", labelKey: "protocolOpenrouter" },
		  { id: "plugin", labelKey: "protocolPlugin" }
		];
		var CONTEXT_SIZES = ["low", "medium", "high"];
		var inputStyle = {
		  width: "100%",
		  boxSizing: "border-box",
		  padding: "6px 8px",
		  borderRadius: 6,
		  border: "1px solid var(--dsw-alias-border-default, #444)",
		  background: "var(--dsw-alias-bg-input, transparent)",
		  color: "var(--dsw-alias-text-primary, inherit)",
		  font: "inherit"
		};
		var labelStyle = { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 2 };
		var hintStyle = { fontSize: 11, color: "var(--dsw-alias-text-tertiary, #888)", marginTop: 3 };
		var resetStyle = {
		  marginLeft: 6,
		  font: "inherit",
		  fontSize: 10,
		  background: "none",
		  border: "none",
		  color: "inherit",
		  cursor: "pointer",
		  textDecoration: "underline"
		};
		var buttonStyle = {
		  font: "inherit",
		  fontSize: 12,
		  padding: "5px 10px",
		  borderRadius: 6,
		  border: "1px solid var(--dsw-alias-border-default, #444)",
		  background: "var(--dsw-alias-bg-input, transparent)",
		  color: "inherit",
		  cursor: "pointer"
		};
		var badgeStyle = {
		  display: "inline-block",
		  fontSize: 10,
		  padding: "1px 6px",
		  borderRadius: 999,
		  border: "1px solid var(--dsw-alias-border-default, #444)",
		  color: "var(--dsw-alias-text-tertiary, #888)"
		};
		var errorStyle = { fontSize: 11, color: "var(--dsw-alias-text-danger, #e66)", marginTop: 4 };
		function useScopeSnapshot(scope) {
		  const subscribe = (0, import_react.useCallback)((listener) => scope.subscribe(listener), [scope]);
		  const get = (0, import_react.useCallback)(() => scope.getSnapshot(), [scope]);
		  return (0, import_react.useSyncExternalStore)(subscribe, get, get);
		}
		function Field(props) {
		  const [draft, setDraft] = (0, import_react.useState)(null);
		  const [error, setError] = (0, import_react.useState)(null);
		  const shown = draft ?? props.value;
		  const commit = () => {
		    if (draft === null) return;
		    setDraft(null);
		    try {
		      const parsed = props.parse(shown);
		      setError(null);
		      props.onCommit(parsed);
		    } catch (e) {
		      setError(String(e?.message ?? e));
		    }
		  };
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { htmlFor: props.id, style: labelStyle, children: [
		      props.label,
		      props.overridden && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { marginLeft: 8, fontSize: 10, fontWeight: 400, color: "var(--dsw-alias-text-accent, #69f)" }, children: [
		        tr("overridden"),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: resetStyle, onClick: props.onReset, disabled: props.disabled, children: tr("reset") })
		      ] })
		    ] }),
		    props.multiline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      "textarea",
		      {
		        id: props.id,
		        rows: 2,
		        style: { ...inputStyle, resize: "vertical" },
		        value: shown,
		        disabled: props.disabled,
		        placeholder: props.placeholder,
		        onChange: (e) => setDraft(e.target.value),
		        onBlur: commit
		      }
		    ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      "input",
		      {
		        id: props.id,
		        type: props.inputType ?? "text",
		        style: { ...inputStyle, ...props.monospace ? { fontFamily: "var(--dsw-alias-font-mono, monospace)" } : {} },
		        value: shown,
		        disabled: props.disabled,
		        placeholder: props.placeholder,
		        onChange: (e) => setDraft(e.target.value),
		        onBlur: commit,
		        onKeyDown: (e) => {
		          if (e.key === "Enter") e.target.blur();
		        }
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: hintStyle, children: props.hint }),
		    error !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: errorStyle, children: error })
		  ] });
		}
		function SelectField(props) {
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { htmlFor: props.id, style: labelStyle, children: [
		      props.label,
		      props.overridden && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { marginLeft: 8, fontSize: 10, fontWeight: 400, color: "var(--dsw-alias-text-accent, #69f)" }, children: [
		        tr("overridden"),
		        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: resetStyle, onClick: props.onReset, disabled: props.disabled, children: tr("reset") })
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      "select",
		      {
		        id: props.id,
		        style: inputStyle,
		        value: props.value,
		        disabled: props.disabled,
		        onChange: (e) => props.onCommit(e.target.value),
		        children: props.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: option.value, children: option.label }, option.value))
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: hintStyle, children: props.hint })
		  ] });
		}
		function parseDomains(text) {
		  const list = text.split(",").map((entry) => entry.trim().toLowerCase()).filter((entry) => entry.length > 0);
		  return list.length > 0 ? [...new Set(list)] : void 0;
		}
		function formatDomains(value) {
		  return Array.isArray(value) ? value.join(", ") : "";
		}
		function parseOptionalInt(text) {
		  const trimmed = text.trim();
		  if (trimmed.length === 0) return void 0;
		  const parsed = Number(trimmed);
		  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`"${text}" is not a positive whole number`);
		  return parsed;
		}
		function KeyRow(props) {
		  const [status, setStatus] = (0, import_react.useState)(null);
		  const [draft, setDraft] = (0, import_react.useState)("");
		  const [busy, setBusy] = (0, import_react.useState)(false);
		  const [notice, setNotice] = (0, import_react.useState)(null);
		  const [error, setError] = (0, import_react.useState)(null);
		  const refresh = (0, import_react.useCallback)(async () => {
		    try {
		      const response = await fetch(CREDENTIAL_ROUTE, { headers: { accept: "application/json" } });
		      setStatus(await response.json());
		    } catch {
		      setStatus(null);
		    }
		  }, []);
		  (0, import_react.useEffect)(() => {
		    void refresh();
		  }, [refresh, props.apiKeyEnv]);
		  const write = async (value) => {
		    setBusy(true);
		    setNotice(null);
		    setError(null);
		    try {
		      const response = await fetch(CREDENTIAL_ROUTE, {
		        method: "POST",
		        headers: { "content-type": "application/json" },
		        body: JSON.stringify({ value })
		      });
		      const result = await response.json();
		      setStatus(result);
		      if (result.ok) {
		        setDraft("");
		        setNotice(value.length === 0 ? tr("keyCleared") : tr("keySaved"));
		      } else {
		        setError(tr("keyFailed", { error: result.error ?? "unknown error" }));
		      }
		    } catch (e) {
		      setError(tr("keyFailed", { error: String(e?.message ?? e) }));
		    } finally {
		      setBusy(false);
		    }
		  };
		  const configured = status?.configured === true;
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12 }, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { htmlFor: "web-search-openrouter-key", style: labelStyle, children: [
		      tr("apiKeyLabel"),
		      " ",
		      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: badgeStyle, children: [
		        configured ? tr("keyConfigured") : tr("keyMissing"),
		        status?.source !== void 0 ? ` · ${tr("keySource", { source: status.source })}` : ""
		      ] })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6 }, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "input",
		        {
		          id: "web-search-openrouter-key",
		          type: "password",
		          autoComplete: "off",
		          style: inputStyle,
		          value: draft,
		          placeholder: tr("apiKeyPlaceholder"),
		          disabled: props.disabled || busy,
		          onChange: (e) => setDraft(e.target.value),
		          onKeyDown: (e) => {
		            if (e.key === "Enter" && draft.length > 0) void write(draft);
		          }
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: buttonStyle, disabled: props.disabled || busy || draft.length === 0, onClick: () => void write(draft), children: tr("keyWrite") }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: buttonStyle, disabled: props.disabled || busy || !configured, onClick: () => void write(""), children: tr("keyClear") })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: hintStyle, children: tr("apiKeyHint") }),
		    notice !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...hintStyle, color: "var(--dsw-alias-text-accent, #69f)" }, children: notice }),
		    error !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: errorStyle, children: error })
		  ] });
		}
		function TestPanel(props) {
		  const [query, setQuery] = (0, import_react.useState)("");
		  const [busy, setBusy] = (0, import_react.useState)(false);
		  const [result, setResult] = (0, import_react.useState)(null);
		  const run = async () => {
		    setBusy(true);
		    setResult(null);
		    try {
		      const response = await fetch(TEST_ROUTE, {
		        method: "POST",
		        headers: { "content-type": "application/json" },
		        body: JSON.stringify(query.trim().length > 0 ? { query: query.trim() } : {})
		      });
		      setResult(await response.json());
		    } catch (e) {
		      setResult({ ok: false, error: String(e?.message ?? e) });
		    } finally {
		      setBusy(false);
		    }
		  };
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--dsw-alias-border-default, #333)" }, children: [
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...labelStyle, marginBottom: 6 }, children: tr("testTitle") }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", gap: 6 }, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "input",
		        {
		          type: "text",
		          style: inputStyle,
		          value: query,
		          placeholder: tr("testQueryHint"),
		          disabled: props.disabled || busy,
		          onChange: (e) => setQuery(e.target.value),
		          onKeyDown: (e) => {
		            if (e.key === "Enter") void run();
		          }
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: buttonStyle, disabled: props.disabled || busy, onClick: () => void run(), children: busy ? tr("testing") : tr("testButton") })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: hintStyle, children: tr("testHint") }),
		    result !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { marginTop: 8, fontSize: 12 }, children: result.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "var(--dsw-alias-text-accent, #69f)" }, children: result.sources && result.sources.length > 0 ? tr("testOk", { n: result.sources.length, ms: result.durationMs ?? 0 }) : tr("testNoSources") }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { style: { margin: "6px 0 0", paddingLeft: 18 }, children: (result.sources ?? []).slice(0, 5).map((source) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { style: { marginBottom: 2 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: source.url, target: "_blank", rel: "noreferrer", style: { color: "inherit" }, children: source.title ?? source.url }) }, source.url)) })
		    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: errorStyle, children: [
		      tr("testFailed"),
		      result.code !== void 0 ? ` (${result.code})` : "",
		      ": ",
		      result.error
		    ] }) }) })
		  ] });
		}
		function WebSearchSettingsCard(props) {
		  const snapshot = useScopeSnapshot(props.scope);
		  (0, import_react.useSyncExternalStore)(subscribeLocale, localeRevision, localeRevision);
		  if (snapshot.status === "unavailable") {
		    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 12 }, children: tr("unavailable") });
		  }
		  if (snapshot.status === "loading" || snapshot.value === void 0) {
		    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 12 }, children: tr("loading") });
		  }
		  const value = snapshot.value;
		  const user = snapshot.user !== null && typeof snapshot.user === "object" ? snapshot.user : {};
		  const disabled = snapshot.writable === false;
		  const overridden = (field) => field in user;
		  const set = (field, next) => {
		    if (next === void 0) void props.scope.unset(field);
		    else void props.scope.set(field, next);
		  };
		  const isOpenRouter = (value.protocol ?? "openai") === "openrouter";
		  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		    props.heading === false ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 13, fontWeight: 600 }, children: tr("title") }),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...hintStyle, marginBottom: 12 }, children: tr("subtitle") })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      SelectField,
		      {
		        id: "web-search-openrouter-protocol",
		        label: tr("protocolLabel"),
		        hint: tr("protocolHint"),
		        value: value.protocol ?? "openai",
		        options: PROTOCOLS.map((protocol) => ({ value: protocol.id, label: tr(protocol.labelKey) })),
		        overridden: overridden("protocol"),
		        disabled,
		        onCommit: (next) => set("protocol", next),
		        onReset: () => set("protocol", void 0)
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      Field,
		      {
		        id: "web-search-openrouter-baseurl",
		        label: tr("baseUrlLabel"),
		        hint: tr("baseUrlHint"),
		        monospace: true,
		        value: value.baseURL ?? "",
		        overridden: overridden("baseURL"),
		        disabled,
		        parse: (text) => text.trim().length > 0 ? text.trim() : void 0,
		        onCommit: (next) => set("baseURL", next),
		        onReset: () => set("baseURL", void 0)
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      Field,
		      {
		        id: "web-search-openrouter-model",
		        label: tr("modelLabel"),
		        hint: tr("modelHint"),
		        monospace: true,
		        value: value.model ?? "",
		        overridden: overridden("model"),
		        disabled,
		        parse: (text) => text.trim().length > 0 ? text.trim() : void 0,
		        onCommit: (next) => set("model", next),
		        onReset: () => set("model", void 0)
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      Field,
		      {
		        id: "web-search-openrouter-keyenv",
		        label: tr("apiKeyEnvLabel"),
		        hint: tr("apiKeyEnvHint"),
		        monospace: true,
		        value: value.apiKeyEnv ?? "",
		        overridden: overridden("apiKeyEnv"),
		        disabled,
		        parse: (text) => text.trim().length > 0 ? text.trim() : void 0,
		        onCommit: (next) => set("apiKeyEnv", next),
		        onReset: () => set("apiKeyEnv", void 0)
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRow, { scope: props.scope, apiKeyEnv: value.apiKeyEnv ?? "", disabled }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      Field,
		      {
		        id: "web-search-openrouter-maxresults",
		        label: tr("maxResultsLabel"),
		        hint: tr("maxResultsHint"),
		        inputType: "number",
		        value: value.maxResults === void 0 ? "" : String(value.maxResults),
		        overridden: overridden("maxResults"),
		        disabled,
		        parse: parseOptionalInt,
		        onCommit: (next) => set("maxResults", next),
		        onReset: () => set("maxResults", void 0)
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      Field,
		      {
		        id: "web-search-openrouter-maxoutput",
		        label: tr("maxOutputTokensLabel"),
		        hint: tr("maxOutputTokensHint"),
		        inputType: "number",
		        value: value.maxOutputTokens === void 0 ? "" : String(value.maxOutputTokens),
		        overridden: overridden("maxOutputTokens"),
		        disabled,
		        parse: parseOptionalInt,
		        onCommit: (next) => set("maxOutputTokens", next),
		        onReset: () => set("maxOutputTokens", void 0)
		      }
		    ),
		    isOpenRouter && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        Field,
		        {
		          id: "web-search-openrouter-engine",
		          label: tr("engineLabel"),
		          hint: tr("engineHint"),
		          value: value.engine ?? "",
		          overridden: overridden("engine"),
		          disabled,
		          parse: (text) => text.trim().length > 0 ? text.trim() : void 0,
		          onCommit: (next) => set("engine", next),
		          onReset: () => set("engine", void 0)
		        }
		      ),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        SelectField,
		        {
		          id: "web-search-openrouter-context",
		          label: tr("contextSizeLabel"),
		          hint: tr("contextSizeHint"),
		          value: value.searchContextSize ?? "medium",
		          options: CONTEXT_SIZES.map((size) => ({ value: size, label: size })),
		          overridden: overridden("searchContextSize"),
		          disabled,
		          onCommit: (next) => set("searchContextSize", next),
		          onReset: () => set("searchContextSize", void 0)
		        }
		      )
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      Field,
		      {
		        id: "web-search-openrouter-allow",
		        label: tr("filterLabel"),
		        hint: tr("filterHint"),
		        value: formatDomains(value.allowedDomains),
		        overridden: overridden("allowedDomains"),
		        disabled,
		        parse: parseDomains,
		        onCommit: (next) => set("allowedDomains", next),
		        onReset: () => set("allowedDomains", void 0)
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		      Field,
		      {
		        id: "web-search-openrouter-block",
		        label: tr("excludeLabel"),
		        hint: tr("excludeHint"),
		        value: formatDomains(value.excludedDomains),
		        overridden: overridden("excludedDomains"),
		        disabled,
		        parse: parseDomains,
		        onCommit: (next) => set("excludedDomains", next),
		        onReset: () => set("excludedDomains", void 0)
		      }
		    ),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { ...labelStyle, fontWeight: 400, marginBottom: 12 }, children: [
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
		        "input",
		        {
		          type: "checkbox",
		          checked: value.includeAnswer === true,
		          disabled,
		          onChange: (e) => set("includeAnswer", e.target.checked ? true : void 0)
		        }
		      ),
		      " ",
		      tr("includeAnswerLabel"),
		      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: hintStyle, children: tr("includeAnswerHint") })
		    ] }),
		    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestPanel, { disabled })
		  ] });
		}

		// src/shared/config.mjs
		var SETTINGS_NAMESPACE = "web-search-openrouter";
		var PLUGIN_NAME = "web-search-openrouter";
		var PACKAGE_NAME = "dsh-web-search-gateway";
		var ROW_CONFIG_KEY = `${PACKAGE_NAME}#${PLUGIN_NAME}`;
		var PROTOCOLS2 = Object.freeze([
		  Object.freeze({ id: "openai", path: "/responses" }),
		  Object.freeze({ id: "openrouter", path: "/responses" }),
		  Object.freeze({ id: "plugin", path: "/responses", deprecated: true })
		]);
		var PROTOCOL_IDS = Object.freeze(PROTOCOLS2.map((protocol) => protocol.id));

		// src/client/index.tsx
		var name = "dsh-web-search-gateway";
		var inject = ["slots", "locale"];
		function wireLocale(ctx) {
		  const locale = ctx.locale;
		  if (!locale) return;
		  try {
		    ctx.effect(() => locale.register(SETTINGS_NAMESPACE, "en", en));
		    ctx.effect(() => locale.register(SETTINGS_NAMESPACE, "zh", zh));
		    ctx.effect(() => locale.register(SETTINGS_NAMESPACE, "ru", ru));
		    const hasRu = (locale.getSnapshot?.().locales ?? []).some((entry) => entry.id === "ru");
		    if (!hasRu) ctx.effect(() => locale.addLanguage({ id: "ru", label: "Русский", fallback: "en" }));
		    const translate = locale.bind(SETTINGS_NAMESPACE);
		    bindTranslator((key, params) => translate(key, params));
		    ctx.effect(() => locale.subscribe(() => notifyLocale()));
		  } catch {
		  }
		}
		function registerRowConfig(ctx) {
		  ctx.inject(["configForms"], (c) => {
		    const card = (props) => props?.view === "summary" ? React.createElement("span", null, tr("summary")) : React.createElement(WebSearchSettingsCard, { scope: c.configForms.get(SETTINGS_NAMESPACE), heading: false });
		    const register = () => {
		      try {
		        c.slots.inject(
		          "plugins.bundle.config",
		          () => c.slots.register({ name: "plugins.bundle.config", key: PACKAGE_NAME, locale: SETTINGS_NAMESPACE }, card)
		        );
		      } catch {
		      }
		      try {
		        c.slots.inject(
		          "plugins.row.config",
		          () => c.slots.register({ name: "plugins.row.config", key: ROW_CONFIG_KEY, locale: SETTINGS_NAMESPACE }, card)
		        );
		      } catch {
		      }
		    };
		    try {
		      if (typeof c.configForms?.whileServed === "function") {
		        c.effect(() => c.configForms.whileServed([SETTINGS_NAMESPACE], register), "web-search-openrouter: settings page");
		      } else {
		        register();
		      }
		    } catch {
		    }
		  });
		}
		function registerSettingsItem(ctx) {
		  ctx.inject(["settingsScope"], (c) => {
		    try {
		      const scope = c.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
		      c.slots.inject(
		        "settings.plugin.item",
		        () => c.slots.register(
		          { name: "settings.plugin.item", key: SETTINGS_NAMESPACE, id: "web-search-openrouter", order: 20 },
		          () => React.createElement(WebSearchSettingsCard, { scope })
		        )
		      );
		    } catch {
		    }
		  });
		}
		function apply(ctx) {
		  wireLocale(ctx);
		  registerRowConfig(ctx);
		  registerSettingsItem(ctx);
		}

		return module.exports;
	}
});

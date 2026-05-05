import { customElement as M } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as T } from "@umbraco-cms/backoffice/lit-element";
import { UMB_MODAL_MANAGER_CONTEXT as N } from "@umbraco-cms/backoffice/modal";
import { UMBRACO_AI_LOG_ANALYSIS_MODAL as O } from "./log-analysis-modal-token.js";
var R = Object.getOwnPropertyDescriptor, A = (e) => {
  throw TypeError(e);
}, D = (e, t, n, c) => {
  for (var a = c > 1 ? void 0 : c ? R(t, n) : t, o = e.length - 1, i; o >= 0; o--)
    (i = e[o]) && (a = i(a) || a);
  return a;
}, E = (e, t, n) => t.has(e) || A("Cannot " + n), r = (e, t, n) => (E(e, t, "read from private field"), n ? n.call(e) : t.get(e)), p = (e, t, n) => t.has(e) ? A("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, n), w = (e, t, n, c) => (E(e, t, "write to private field"), t.set(e, n), n), u = (e, t, n) => (E(e, t, "access private method"), n), v, m, f, s, l, L, x, y, S, C, k;
const q = /* @__PURE__ */ new Set(["Fatal", "Error", "Warning"]), _ = "umbraco-ai-log-viewer-search-enhancer", h = "umbraco-ai-diagnostics-analyze-button", g = "umbraco-ai-diagnostics-action", I = "AI Analysis";
function U(e, t) {
  const n = [], c = e instanceof Document ? e.body : e, a = (o) => {
    o.querySelectorAll(t).forEach((i) => {
      n.push(i);
    }), o.querySelectorAll("*").forEach((i) => {
      i.shadowRoot && a(i.shadowRoot);
    });
  };
  return a(c), n;
}
let b = class extends T {
  constructor() {
    super(), p(this, l), p(this, v), p(this, m), p(this, f, 0), p(this, s, () => {
      window.clearTimeout(r(this, f)), w(this, f, window.setTimeout(() => u(this, l, L).call(this), 100));
    }), this.consumeContext(N, (e) => {
      w(this, v, e), r(this, s).call(this);
    });
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("changestate", r(this, s)), window.addEventListener("popstate", r(this, s)), w(this, m, new MutationObserver(() => r(this, s).call(this))), r(this, m).observe(document.body, { childList: !0, subtree: !0 }), r(this, s).call(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("changestate", r(this, s)), window.removeEventListener("popstate", r(this, s)), r(this, m)?.disconnect(), window.clearTimeout(r(this, f));
  }
};
v = /* @__PURE__ */ new WeakMap();
m = /* @__PURE__ */ new WeakMap();
f = /* @__PURE__ */ new WeakMap();
s = /* @__PURE__ */ new WeakMap();
l = /* @__PURE__ */ new WeakSet();
L = function() {
  if (!u(this, l, x).call(this))
    return;
  const e = U(document, "umb-log-viewer-message");
  for (const t of e)
    u(this, l, y).call(this, t);
};
x = function() {
  const e = window.location.pathname;
  return e.includes("/section/settings/workspace/logviewer/view/search") ? !0 : e.includes("logviewer") && e.includes("search");
};
y = function(e) {
  if (!e.level || !q.has(e.level))
    return;
  const t = e.shadowRoot, n = t?.querySelector("summary");
  if (!t || !n || n.querySelector(`.${g}`))
    return;
  const c = document.createElement("style");
  c.textContent = `
            .${g} {
                box-sizing: border-box;
                display: flex;
                align-items: center;
                flex: 0 0 auto;
                padding: 10px 20px;
            }

            .${h} {
                appearance: none;
                -webkit-appearance: none;
                box-sizing: border-box;
                margin: 0;
                flex: 0 0 auto;
                cursor: pointer;
                white-space: nowrap;
                font-family: inherit;
                font-size: var(--uui-size-4, 13px);
                font-weight: 600;
                line-height: 1.2;
                padding: 9px 16px;
                border-radius: var(--uui-border-radius, 3px);
                border: 1px solid var(--uui-color-interactive, #3544b1);
                background-color: var(--uui-color-interactive, #3544b1);
                color: var(--uui-color-interactive-contrast, #ffffff);
                box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
            }

            .${h}:hover {
                background-color: var(--uui-color-interactive-emphasis, #2b378f);
                border-color: var(--uui-color-interactive-emphasis, #2b378f);
            }

            .${h}:focus-visible {
                outline: 2px solid var(--uui-color-interactive, #3544b1);
                outline-offset: 2px;
            }

            .${h}:active {
                transform: translateY(1px);
            }
        `;
  const a = document.createElement("div");
  a.className = g;
  const o = document.createElement("button");
  o.type = "button", o.className = h, o.textContent = I;
  const i = (d) => {
    d.preventDefault(), d.stopPropagation();
  };
  o.addEventListener("mousedown", i, !0), o.addEventListener("click", (d) => {
    d.preventDefault(), d.stopPropagation(), u(this, l, S).call(this, e);
  }), a.append(o), t.append(c), n.append(a);
};
S = function(e) {
  r(this, v)?.open(this, O, {
    data: {
      logEntry: u(this, l, C).call(this, e)
    },
    modal: {
      size: "large"
    }
  });
};
C = function(e) {
  const t = u(this, l, k).call(this, e.properties ?? []);
  return {
    timestamp: e.timestamp ?? "",
    level: e.level ?? "",
    message: e.renderedMessage ?? e.messageTemplate ?? "",
    exception: e.exception ?? null,
    logger: t.SourceContext ?? null,
    properties: t
  };
};
k = function(e) {
  return e.reduce((t, n) => (n.name && (t[n.name] = n.value ?? null), t), {});
};
b = D([
  M(_)
], b);
function W() {
  if (document.querySelector(_))
    return;
  const e = document.createElement(_), t = () => {
    const n = document.querySelector("umb-app");
    return n && e.parentNode !== n ? (n.append(e), !0) : (e.isConnected || document.body.append(e), !!document.querySelector("umb-app"));
  };
  if (!t()) {
    const n = new MutationObserver(() => {
      t() && n.disconnect();
    });
    n.observe(document.documentElement, { childList: !0, subtree: !0 });
  }
}
W();
const G = b;
export {
  G as default
};
//# sourceMappingURL=log-viewer-search-enhancer.js.map

import { css as L, property as w, state as c, customElement as P, html as t, unsafeHTML as x } from "@umbraco-cms/backoffice/external/lit";
import { analysisMarkdownContentStyles as U, renderAnalysisMarkdown as b } from "./analysis-markdown.js";
import { UmbLitElement as M } from "@umbraco-cms/backoffice/lit-element";
import { UmbracoAIDiagnosticsRepository as S } from "./repository.js";
var D = Object.defineProperty, O = Object.getOwnPropertyDescriptor, $ = (e) => {
  throw TypeError(e);
}, u = (e, i, r, o) => {
  for (var s = o > 1 ? void 0 : o ? O(i, r) : i, g = e.length - 1, m; g >= 0; g--)
    (m = e[g]) && (s = (o ? m(i, r, s) : m(s)) || s);
  return o && s && D(i, r, s), s;
}, _ = (e, i, r) => i.has(e) || $("Cannot " + r), n = (e, i, r) => (_(e, i, "read from private field"), r ? r.call(e) : i.get(e)), y = (e, i, r) => i.has(e) ? $("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(e) : i.set(e, r), W = (e, i, r, o) => (_(e, i, "write to private field"), i.set(e, r), r), d = (e, i, r) => (_(e, i, "access private method"), r), T = (e, i, r, o) => ({
  set _(s) {
    W(e, i, s);
  },
  get _() {
    return n(e, i, o);
  }
}), f, p, a, z, v, E, k, h, A, I, C;
function q(e) {
  const i = e?.profiles ?? [];
  if (i.length === 0)
    return "";
  const r = e?.defaultProfileAlias?.trim();
  if (r && i.some((s) => s.alias === r))
    return r;
  const o = i.find((s) => s.isDefault);
  return o ? o.alias : i[0].alias;
}
let l = class extends M {
  constructor() {
    super(...arguments), y(this, a), this._loading = !1, this._error = "", this._analysisItem = null, this._profileAlias = "", this._profiles = [], this._profilesError = "", y(this, f, new S(this)), y(this, p, 0);
  }
  async firstUpdated(e) {
    super.firstUpdated(e);
    const i = await d(this, a, z).call(this);
    this._profileAlias = q(i), await d(this, a, v).call(this);
  }
  render() {
    return t`
            <umb-body-layout headline="AI Log Analysis">
                <div class="content">
                    ${d(this, a, I).call(this)}
                    ${d(this, a, A).call(this)}
                    ${this._loading ? t`
                        <uui-box>
                            <div class="loading">
                                <uui-loader></uui-loader>
                                <p>Analyzing this log entry...</p>
                            </div>
                        </uui-box>
                    ` : null}
                    ${this._error ? t`<uui-box headline="Error" color="danger"><p>${this._error}</p></uui-box>` : null}
                    ${d(this, a, C).call(this)}
                </div>
                <uui-button slot="actions" look="secondary" label="Close" @click=${d(this, a, k)}>Close</uui-button>
            </umb-body-layout>
        `;
  }
};
f = /* @__PURE__ */ new WeakMap();
p = /* @__PURE__ */ new WeakMap();
a = /* @__PURE__ */ new WeakSet();
z = async function() {
  this._profilesError = "";
  const e = await n(this, f).getChatProfiles();
  if (e.error) {
    this._profilesError = e.error, this._profiles = [];
    return;
  }
  return this._profiles = e.data?.profiles ?? [], e.data;
};
v = async function() {
  const e = n(this, a, h);
  if (!e) {
    this._error = "No log entry was provided for analysis.";
    return;
  }
  const i = ++T(this, p)._;
  this._loading = !0, this._error = "";
  try {
    const r = await n(this, f).analyzeLogEntry(e, this._profileAlias);
    if (i !== n(this, p))
      return;
    if (!r?.data?.analysisItem) {
      this._error = "The log entry could not be analyzed.", this._analysisItem = null;
      return;
    }
    this._analysisItem = r.data.analysisItem;
  } catch (r) {
    i === n(this, p) && (this._error = `Error: ${r}`, this._analysisItem = null);
  } finally {
    i === n(this, p) && (this._loading = !1);
  }
};
E = function(e) {
  this._profileAlias = e.target.value, d(this, a, v).call(this);
};
k = function() {
  this.modalContext?.submit();
};
h = function() {
  return this.modalContext?.data?.logEntry ?? this.data?.logEntry;
};
A = function() {
  return n(this, a, h) ? t`
            <uui-box headline="Chat profile">
                <div class="profile-row">
                    <label class="profile-label" for="ai-log-profile-select">Profile</label>
                    <select
                        id="ai-log-profile-select"
                        class="profile-select"
                        .value=${this._profileAlias}
                        @change=${d(this, a, E)}
                        ?disabled=${this._profiles.length === 0}
                    >
                        ${this._profiles.map(
    (i) => t`
                                <option value=${i.alias}>${i.name?.trim() || i.alias}</option>
                            `
  )}
                    </select>
                </div>
                ${this._profilesError ? t`<p class="profiles-error" title=${this._profilesError}>Could not load profile list.</p>` : null}
            </uui-box>
        ` : null;
};
I = function() {
  const e = n(this, a, h);
  return e ? t`
            <uui-box headline="Original log entry">
                <dl>
                    <dt>Level</dt>
                    <dd>${e.level}</dd>
                    <dt>Timestamp</dt>
                    <dd>${e.timestamp ? new Date(e.timestamp).toLocaleString() : "Unknown"}</dd>
                    ${e.logger ? t`<dt>Logger</dt><dd>${e.logger}</dd>` : null}
                </dl>
                <pre>${e.message || "No message"}</pre>
                ${e.exception ? t`<details><summary>Exception</summary><pre>${e.exception}</pre></details>` : null}
            </uui-box>
        ` : null;
};
C = function() {
  return this._analysisItem ? t`
            <uui-box headline="AI analysis">
                <div class="inline">
                    <uui-badge color="danger">${this._analysisItem.logEntry?.level ?? "Unknown"}</uui-badge>
                    <uui-badge color="warning">${this._analysisItem.severityAssessment ?? "Unknown severity"}</uui-badge>
                </div>

                ${this._analysisItem.likelyCause ? t`
                    <section>
                        <h4>Likely cause</h4>
                        <div class="markdown-content">
                            ${x(b(this._analysisItem.likelyCause))}
                        </div>
                    </section>
                ` : null}

                ${this._analysisItem.suggestedFixes?.length ? t`
                    <section>
                        <h4>Suggested fixes</h4>
                        <ul class="suggested-fixes-list">
                            ${this._analysisItem.suggestedFixes.map(
    (e) => t`
                                    <li>
                                        <div class="markdown-content">${x(b(e))}</div>
                                    </li>
                                `
  )}
                        </ul>
                    </section>
                ` : null}

                ${this._analysisItem.referenceLinks?.length ? t`
                    <section>
                        <h4>Reference links</h4>
                        <ul>
                            ${this._analysisItem.referenceLinks.map((e) => t`
                                <li><a href=${e} target="_blank" rel="noopener noreferrer">${e}</a></li>
                            `)}
                        </ul>
                    </section>
                ` : null}
            </uui-box>
        ` : null;
};
l.styles = [
  U,
  L`
            :host {
                box-sizing: border-box;
                display: block;
                max-inline-size: min(72rem, calc(100vw - var(--uui-size-layout-1, 24px)));
                margin-inline: auto;
                max-block-size: min(92vh, 960px);
            }

            .content {
                display: flex;
                flex-direction: column;
                gap: var(--uui-size-space-4);
                padding: var(--uui-size-space-5);
                overflow: auto;
            }

            .inline {
                display: flex;
                gap: var(--uui-size-space-2);
                align-items: center;
                flex-wrap: wrap;
            }

            .loading {
                display: flex;
                align-items: center;
                gap: var(--uui-size-space-3);
            }

            .profile-row {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: var(--uui-size-space-3);
            }

            .profile-label {
                font-weight: 700;
                font-size: 0.875rem;
            }

            .profile-select {
                flex: 1 1 200px;
                min-width: min(280px, 100%);
                height: 36px;
                padding: 0 var(--uui-size-space-3);
                border: 1px solid var(--uui-color-border);
                border-radius: var(--uui-border-radius);
                background-color: var(--uui-color-surface);
                color: var(--uui-color-text);
                font-family: inherit;
                font-size: 0.875rem;
            }

            .profiles-error {
                margin: var(--uui-size-space-2) 0 0;
                font-size: 0.8125rem;
                color: var(--uui-color-danger);
            }

            dl {
                display: grid;
                grid-template-columns: 120px 1fr;
                gap: var(--uui-size-space-2);
                margin: 0 0 var(--uui-size-space-3);
            }

            dt {
                font-weight: 700;
            }

            dd {
                margin: 0;
            }

            pre {
                white-space: pre-wrap;
                word-break: break-word;
                background: var(--uui-color-surface-alt);
                border-radius: var(--uui-border-radius);
                padding: var(--uui-size-space-3);
            }

            section {
                margin-top: var(--uui-size-space-4);
            }

            section h4 {
                margin: 0 0 var(--uui-size-space-2);
                font-weight: 700;
            }

            .suggested-fixes-list {
                margin: var(--uui-size-space-2) 0 0;
                padding-left: var(--uui-size-space-5);
            }

            .suggested-fixes-list li {
                margin-bottom: var(--uui-size-space-3);
            }
        `
];
u([
  w({ attribute: !1 })
], l.prototype, "modalContext", 2);
u([
  w({ attribute: !1 })
], l.prototype, "data", 2);
u([
  c()
], l.prototype, "_loading", 2);
u([
  c()
], l.prototype, "_error", 2);
u([
  c()
], l.prototype, "_analysisItem", 2);
u([
  c()
], l.prototype, "_profileAlias", 2);
u([
  c()
], l.prototype, "_profiles", 2);
u([
  c()
], l.prototype, "_profilesError", 2);
l = u([
  P("umbraco-ai-log-analysis-modal")
], l);
const H = l;
export {
  l as UmbracoAILogAnalysisModalElement,
  H as default
};
//# sourceMappingURL=log-analysis-modal.element.js.map

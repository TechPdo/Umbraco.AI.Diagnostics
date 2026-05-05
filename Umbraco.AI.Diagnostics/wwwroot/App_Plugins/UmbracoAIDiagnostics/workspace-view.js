import { UmbElementMixin as R } from "@umbraco-cms/backoffice/element-api";
import { LitElement as L, html as t, unsafeHTML as v, css as P, state as l, customElement as W } from "@umbraco-cms/backoffice/external/lit";
import { renderAnalysisMarkdown as _, analysisMarkdownContentStyles as F } from "./analysis-markdown.js";
import { UmbracoAIDiagnosticsRepository as D } from "./repository.js";
var S = Object.defineProperty, I = Object.getOwnPropertyDescriptor, y = (e) => {
  throw TypeError(e);
}, s = (e, i, r, u) => {
  for (var a = u > 1 ? void 0 : u ? I(i, r) : i, g = e.length - 1, f; g >= 0; g--)
    (f = e[g]) && (a = (u ? f(i, r, a) : f(a)) || a);
  return u && a && S(i, r, a), a;
}, x = (e, i, r) => i.has(e) || y("Cannot " + r), p = (e, i, r) => (x(e, i, "read from private field"), i.get(e)), m = (e, i, r) => i.has(e) ? y("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(e) : i.set(e, r), b = (e, i, r, u) => (x(e, i, "write to private field"), i.set(e, r), r), c = (e, i, r) => (x(e, i, "access private method"), r), d, h, n, k, w, $, z, C, A, E;
function U(e) {
  const i = e?.profiles ?? [];
  if (i.length === 0)
    return "";
  const r = e?.defaultProfileAlias?.trim();
  if (r && i.some((a) => a.alias === r))
    return r;
  const u = i.find((a) => a.isDefault);
  return u ? u.alias : i[0].alias;
}
let o = class extends R(L) {
  constructor() {
    super(), m(this, n), this._loading = !1, this._error = "", this._report = null, this._fatalChecked = !0, this._errorChecked = !0, this._warningChecked = !0, this._timeRange = "1hour", this._profileAlias = "", this._profiles = [], this._profilesError = "", m(this, d), m(this, h, !1), b(this, d, new D(this));
  }
  connectedCallback() {
    super.connectedCallback(), p(this, h) || (b(this, h, !0), c(this, n, k).call(this));
  }
  renderFilters() {
    return t`
      <uui-box headline="Analysis Filters">
        <div class="filters-container">
          <div class="label-group">
            <label>Log Type:</label>
          </div>
          
          <div class="checkboxes-group">
            <uui-checkbox
              label="Fatal"
              .checked=${this._fatalChecked}
              @change=${c(this, n, $)}
            ></uui-checkbox>
            
            <uui-checkbox
              label="Error"
              .checked=${this._errorChecked}
              @change=${c(this, n, z)}
            ></uui-checkbox>
            
            <uui-checkbox
              label="Warning"
              .checked=${this._warningChecked}
              @change=${c(this, n, C)}
            ></uui-checkbox>
          </div>

          <div class="label-group">
            <label>Time Range:</label>
          </div>

          <div class="dropdown-group">
            <select
              class="time-range-select"
              .value=${this._timeRange}
              @change=${c(this, n, A)}
            >
              <option value="1hour" ?selected=${this._timeRange === "1hour"}>Last 1 hour</option>
              <option value="2hours" ?selected=${this._timeRange === "2hours"}>Last 2 hours</option>
              <option value="24hours" ?selected=${this._timeRange === "24hours"}>Last 24 hours</option>
              <option value="7days" ?selected=${this._timeRange === "7days"}>Last 7 days</option>
              <option value="1month" ?selected=${this._timeRange === "1month"}>Last month</option>
            </select>
          </div>

          <div class="label-group">
            <label>Chat profile:</label>
          </div>

          <div class="dropdown-group profile-dropdown-group">
            <select
              class="time-range-select"
              .value=${this._profileAlias}
              @change=${c(this, n, E)}
              ?disabled=${this._profiles.length === 0}
            >
              ${this._profiles.map(
      (e) => t`
                  <option value=${e.alias}>${e.name?.trim() || e.alias}</option>
                `
    )}
            </select>
          </div>

          ${this._profilesError ? t`<span class="profiles-error" title=${this._profilesError}>Profile list unavailable</span>` : ""}

          <div class="button-group">
            <uui-button
              look="primary"
              label="Analyze"
              @click=${c(this, n, w)}
              ?disabled=${this._loading}
            >
              <uui-icon name="wand"></uui-icon>
              Analyze
            </uui-button>
          </div>
        </div>
      </uui-box>
    `;
  }
  renderResults() {
    return this._report ? t`
      <uui-box headline="Analysis Results">
        <div class="stack">
          <div class="inline">
            <uui-tag>Total logs: ${this._report.totalLogsAnalyzed || 0}</uui-tag>
            <uui-tag>Unique issues: ${this._report.uniqueLogsCount || 0}</uui-tag>
            <uui-tag>Range: ${this._report.timeRange || this._timeRange}</uui-tag>
          </div>
          
          ${this._report.aiSummary ? t`
            <uui-box headline="AI Summary">
              <div class="ai-summary markdown-content">${v(_(this._report.aiSummary))}</div>
            </uui-box>
          ` : ""}
          
          ${this._report.logAnalysisItems?.length ? t`
            <div class="logs">
              ${this._report.logAnalysisItems.map((e) => t`
                <uui-box>
                  <div class="inline">
                    <uui-badge color="danger">${e.logEntry?.level ?? e.logEntry?.Level ?? "Unknown"}</uui-badge>
                    <uui-tag>${e.occurrenceCount || 1} occurrences</uui-tag>
                    <uui-badge color="danger">${e.severityAssessment || "Unknown"}</uui-badge>
                  </div>
                  <p>
                    <strong>${e.logEntry?.timestamp ? new Date(e.logEntry.timestamp).toLocaleString() : "No timestamp"}</strong>
                  </p>
                  <pre>${e.logEntry?.message || "No message"}</pre>
                  
                  ${e.likelyCause ? t`
                    <div class="markdown-content">
                      <strong>Likely cause:</strong>
                      <div>${v(_(e.likelyCause))}</div>
                    </div>
                  ` : ""}
                  
                  ${e.suggestedFixes?.length ? t`
                    <div class="suggested-fixes markdown-content">
                      <strong>Suggested fixes:</strong>
                      <div>
                        ${e.suggestedFixes.map((i) => t`
                          <div class="fix-item">${v(_(i))}</div>
                        `)}
                      </div>
                    </div>
                  ` : ""}
                </uui-box>
              `)}
            </div>
          ` : t`
            <p class="no-logs">No log entries found for the selected criteria.</p>
          `}
        </div>
      </uui-box>
    ` : null;
  }
  render() {
    return t`
      <div class="container">
        ${this.renderFilters()}
        
        ${this._loading ? t`
          <uui-box>
            <div class="loading-container">
              <uui-loader></uui-loader>
              <p>Analyzing logs...</p>
            </div>
          </uui-box>
        ` : ""}
        
        ${this._error ? t`
          <uui-box headline="Error" color="danger">
            <p>${this._error}</p>
          </uui-box>
        ` : ""}
        
        ${this.renderResults()}
      </div>
    `;
  }
};
d = /* @__PURE__ */ new WeakMap();
h = /* @__PURE__ */ new WeakMap();
n = /* @__PURE__ */ new WeakSet();
k = async function() {
  if (!p(this, d))
    return;
  this._profilesError = "";
  const e = await p(this, d).getChatProfiles();
  if (e.error) {
    this._profilesError = e.error, this._profiles = [], this._profileAlias = "";
    return;
  }
  this._profiles = e.data?.profiles ?? [], this._profileAlias = U(e.data);
};
w = async function() {
  if (this._loading = !0, this._error = "", this._report = null, !p(this, d)) {
    this._error = "Repository not initialized", this._loading = !1;
    return;
  }
  try {
    const e = [];
    if (this._fatalChecked && e.push("Fatal"), this._errorChecked && e.push("Error"), this._warningChecked && e.push("Warning"), e.length === 0) {
      this._error = "Please select at least one log level", this._loading = !1;
      return;
    }
    const i = await p(this, d).analyzeWithFilters(
      e,
      this._timeRange,
      this._profileAlias
    );
    i ? this._report = i.data : this._error = "Failed to load AI diagnostics";
  } catch (e) {
    this._error = `Error: ${e}`, console.error("Error analyzing logs:", e);
  }
  this._loading = !1;
};
$ = function(e) {
  const i = e.target;
  this._fatalChecked = i.checked;
};
z = function(e) {
  const i = e.target;
  this._errorChecked = i.checked;
};
C = function(e) {
  const i = e.target;
  this._warningChecked = i.checked;
};
A = function(e) {
  const i = e.target;
  this._timeRange = i.value, console.log("Time range changed to:", this._timeRange);
};
E = function(e) {
  const i = e.target;
  this._profileAlias = i.value;
};
o.styles = [
  F,
  P`
    :host {
      display: block;
      padding: var(--uui-size-space-5);
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-space-5);
    }

    .filters-container {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--uui-size-space-3);
      padding: var(--uui-size-space-4);
    }

    .label-group {
      display: flex;
      align-items: center;
    }

    .label-group label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--uui-color-text);
      white-space: nowrap;
    }

    .checkboxes-group {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--uui-size-space-4);
      margin-right: var(--uui-size-space-6);
    }

    .dropdown-group {
      display: flex;
      align-items: center;
      width: 180px;
      margin-right: var(--uui-size-space-4);
    }

    .profile-dropdown-group {
      width: min(280px, 42vw);
    }

    .profiles-error {
      font-size: 0.75rem;
      color: var(--uui-color-danger);
      max-width: 140px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dropdown-group uui-select {
      width: 100%;
    }

    .time-range-select {
      width: 100%;
      height: 36px;
      padding: 0 var(--uui-size-space-3);
      border: 1px solid var(--uui-color-border);
      border-radius: var(--uui-border-radius);
      background-color: var(--uui-color-surface);
      color: var(--uui-color-text);
      font-family: inherit;
      font-size: 0.875rem;
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .time-range-select:hover {
      border-color: var(--uui-color-border-emphasis);
    }

    .time-range-select:focus {
      border-color: var(--uui-color-focus);
      box-shadow: 0 0 0 2px rgba(var(--uui-color-focus-rgb), 0.2);
    }

    .time-range-select option {
      padding: var(--uui-size-space-2);
      background-color: var(--uui-color-surface);
      color: var(--uui-color-text);
    }

    .button-group {
      display: flex;
      align-items: center;
    }

    .stack {
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-space-4);
    }

    .inline {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-3);
      flex-wrap: wrap;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--uui-size-space-6);
      gap: var(--uui-size-space-3);
    }

    .ai-summary {
      padding: var(--uui-size-space-3);
      line-height: 1.6;
      color: var(--uui-color-text);
    }

    .logs {
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-space-4);
    }

    .logs uui-box {
      background: var(--uui-color-surface);
    }

    .logs p {
      margin: var(--uui-size-space-2) 0;
      color: var(--uui-color-text);
    }

    .logs pre {
      background: var(--uui-color-surface-alt);
      padding: var(--uui-size-space-3);
      border-radius: var(--uui-border-radius);
      overflow-x: auto;
      margin: var(--uui-size-space-3) 0;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.4;
      color: var(--uui-color-text);
    }

    .suggested-fixes {
      margin-top: var(--uui-size-space-3);
    }

    .suggested-fixes ul {
      margin: var(--uui-size-space-2) 0;
      padding-left: var(--uui-size-space-5);
    }

    .suggested-fixes li {
      margin-bottom: var(--uui-size-space-2);
      line-height: 1.5;
      color: var(--uui-color-text);
    }

    .no-logs {
      text-align: center;
      padding: var(--uui-size-space-6);
      color: var(--uui-color-text-alt);
      font-style: italic;
    }

    uui-loader {
      font-size: 2em;
    }

    strong {
      font-weight: 600;
      color: var(--uui-color-text-alt);
    }
    .inline > uui-badge {
        margin-right: 0px;
        position: inherit;
    }
    uui-badge {
      text-transform: uppercase;
      font-weight: 600;
    }

    .fix-item {
      margin-bottom: var(--uui-size-space-2);
    }
  `
];
s([
  l()
], o.prototype, "_loading", 2);
s([
  l()
], o.prototype, "_error", 2);
s([
  l()
], o.prototype, "_report", 2);
s([
  l()
], o.prototype, "_fatalChecked", 2);
s([
  l()
], o.prototype, "_errorChecked", 2);
s([
  l()
], o.prototype, "_warningChecked", 2);
s([
  l()
], o.prototype, "_timeRange", 2);
s([
  l()
], o.prototype, "_profileAlias", 2);
s([
  l()
], o.prototype, "_profiles", 2);
s([
  l()
], o.prototype, "_profilesError", 2);
o = s([
  W("umbraco-ai-diagnostics-workspace-view")
], o);
const V = o;
export {
  o as UmbracoAIDiagnosticsWorkspaceViewElement,
  V as default
};
//# sourceMappingURL=workspace-view.js.map

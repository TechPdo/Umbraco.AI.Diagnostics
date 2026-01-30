import { UmbElementMixin as R } from "@umbraco-cms/backoffice/element-api";
import { LitElement as E, html as o, unsafeHTML as v, css as A, state as p, customElement as L } from "@umbraco-cms/backoffice/external/lit";
import { UmbracoAIDiagnosticsRepository as I } from "./repository.js";
var W = Object.defineProperty, M = Object.getOwnPropertyDescriptor, b = (r) => {
  throw TypeError(r);
}, c = (r, e, t, u) => {
  for (var l = u > 1 ? void 0 : u ? M(e, t) : e, a = r.length - 1, s; a >= 0; a--)
    (s = r[a]) && (l = (u ? s(e, t, l) : s(l)) || l);
  return u && l && W(e, t, l), l;
}, f = (r, e, t) => e.has(r) || b("Cannot " + t), k = (r, e, t) => (f(r, e, "read from private field"), e.get(r)), $ = (r, e, t) => e.has(r) ? b("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(r) : e.set(r, t), S = (r, e, t, u) => (f(r, e, "write to private field"), e.set(r, t), t), h = (r, e, t) => (f(r, e, "access private method"), t), m, d, x, w, y, z, C;
let n = class extends R(E) {
  constructor() {
    super(), $(this, d), this._loading = !1, this._error = "", this._report = null, this._criticalChecked = !0, this._errorChecked = !0, this._warningChecked = !0, this._timeRange = "1hour", $(this, m), S(this, m, new I(this));
  }
  // Add the markdown rendering function
  renderMarkdown(r) {
    if (!r) return "";
    let e = r;
    e = e.replace(/```(\w+)?\r?\n([\s\S]*?)```/g, (a, s, g) => {
      const i = g.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<pre><code class="language-${s || "plaintext"}">${i.trim()}</code></pre>`;
    }), e = e.replace(/`([^`]+)`/g, (a, s) => `<code>${s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>`), e = e.replace(/\*\*([^\*]+?)\*\*/g, "<strong>$1</strong>"), e = e.replace(/__([^_]+?)__/g, "<strong>$1</strong>"), e = e.replace(/\*([^\*]+?)\*/g, "<em>$1</em>"), e = e.replace(/_([^_]+?)_/g, "<em>$1</em>"), e = e.replace(/~~(.+?)~~/g, "<del>$1</del>"), e = e.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>"), e = e.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>"), e = e.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>"), e = e.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>"), e = e.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>"), e = e.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>"), e = e.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'), e = e.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />'), e = e.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>"), e = e.replace(/^---$/gm, "<hr>"), e = e.replace(/^\*\*\*$/gm, "<hr>");
    const t = /(?:^\*\s+.+$\n?)+/gm;
    e = e.replace(t, (a) => `<ul>${a.split(`
`).filter((i) => i.trim()).map((i) => `<li>${i.replace(/^\*\s+/, "")}</li>`).join("")}</ul>`);
    const u = /(?:^-\s+.+$\n?)+/gm;
    e = e.replace(u, (a) => `<ul>${a.split(`
`).filter((i) => i.trim()).map((i) => `<li>${i.replace(/^-\s+/, "")}</li>`).join("")}</ul>`);
    const l = /(?:^\d+\.\s+.+$\n?)+/gm;
    return e = e.replace(l, (a) => `<ol>${a.split(`
`).filter((i) => i.trim()).map((i) => `<li>${i.replace(/^\d+\.\s+/, "")}</li>`).join("")}</ol>`), e = e.replace(/\n\n+/g, "</p><p>"), e = e.replace(/\n/g, "<br>"), e.match(/^<(h[1-6]|ul|ol|pre|blockquote|hr)/) || (e = `<p>${e}</p>`), e = e.replace(/<p>(<h[1-6]>)/g, "$1"), e = e.replace(/(<\/h[1-6]>)<\/p>/g, "$1"), e = e.replace(/<p>(<ul>)/g, "$1"), e = e.replace(/(<\/ul>)<\/p>/g, "$1"), e = e.replace(/<p>(<ol>)/g, "$1"), e = e.replace(/(<\/ol>)<\/p>/g, "$1"), e = e.replace(/<p>(<pre>)/g, "$1"), e = e.replace(/(<\/pre>)<\/p>/g, "$1"), e = e.replace(/<p>(<blockquote>)/g, "$1"), e = e.replace(/(<\/blockquote>)<\/p>/g, "$1"), e = e.replace(/<p>(<hr>)<\/p>/g, "$1"), e = e.replace(/<p><\/p>/g, ""), e;
  }
  renderFilters() {
    return o`
      <uui-box headline="Analysis Filters">
        <div class="filters-container">
          <div class="label-group">
            <label>Log Type:</label>
          </div>
          
          <div class="checkboxes-group">
            <uui-checkbox
              label="Critical"
              .checked=${this._criticalChecked}
              @change=${h(this, d, w)}
            ></uui-checkbox>
            
            <uui-checkbox
              label="Error"
              .checked=${this._errorChecked}
              @change=${h(this, d, y)}
            ></uui-checkbox>
            
            <uui-checkbox
              label="Warning"
              .checked=${this._warningChecked}
              @change=${h(this, d, z)}
            ></uui-checkbox>
          </div>

          <div class="label-group">
            <label>Time Range:</label>
          </div>

          <div class="dropdown-group">
            <select
              class="time-range-select"
              .value=${this._timeRange}
              @change=${h(this, d, C)}
            >
              <option value="1hour" ?selected=${this._timeRange === "1hour"}>Last 1 hour</option>
              <option value="2hours" ?selected=${this._timeRange === "2hours"}>Last 2 hours</option>
              <option value="24hours" ?selected=${this._timeRange === "24hours"}>Last 24 hours</option>
              <option value="7days" ?selected=${this._timeRange === "7days"}>Last 7 days</option>
              <option value="1month" ?selected=${this._timeRange === "1month"}>Last month</option>
            </select>
          </div>

          <div class="button-group">
            <uui-button
              look="primary"
              label="Analyze"
              @click=${h(this, d, x)}
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
    return this._report ? o`
      <uui-box headline="Analysis Results">
        <div class="stack">
          <div class="inline">
            <uui-tag>Total logs: ${this._report.totalLogsAnalyzed || 0}</uui-tag>
            <uui-tag>Unique issues: ${this._report.uniqueLogsCount || 0}</uui-tag>
            <uui-tag>Range: ${this._report.timeRange || this._timeRange}</uui-tag>
          </div>
          
          ${this._report.aiSummary ? o`
            <uui-box headline="AI Summary">
              <div class="ai-summary markdown-content">${v(this.renderMarkdown(this._report.aiSummary))}</div>
            </uui-box>
          ` : ""}
          
          ${this._report.logAnalysisItems?.length ? o`
            <div class="logs">
              ${this._report.logAnalysisItems.map((r) => o`
                <uui-box>
                  <div class="inline">
                    <uui-badge color="danger">${r.logEntry?.level || "Unknown"}</uui-badge>
                    <uui-tag>${r.occurrenceCount || 1} occurrences</uui-tag>
                  </div>
                  <p>
                    <strong>${r.logEntry?.timestamp ? new Date(r.logEntry.timestamp).toLocaleString() : "No timestamp"}</strong>
                  </p>
                  <pre>${r.logEntry?.message || "No message"}</pre>
                  
                  ${r.likelyCause ? o`
                    <div class="markdown-content">
                      <strong>Likely cause:</strong>
                      <div>${v(this.renderMarkdown(r.likelyCause))}</div>
                    </div>
                  ` : ""}
                  
                  ${r.suggestedFixes?.length ? o`
                    <div class="suggested-fixes markdown-content">
                      <strong>Suggested fixes:</strong>
                      <div>
                        ${r.suggestedFixes.map((e) => o`
                          <div class="fix-item">${v(this.renderMarkdown(e))}</div>
                        `)}
                      </div>
                    </div>
                  ` : ""}
                </uui-box>
              `)}
            </div>
          ` : o`
            <p class="no-logs">No log entries found for the selected criteria.</p>
          `}
        </div>
      </uui-box>
    ` : null;
  }
  render() {
    return o`
      <div class="container">
        ${this.renderFilters()}
        
        ${this._loading ? o`
          <uui-box>
            <div class="loading-container">
              <uui-loader></uui-loader>
              <p>Analyzing logs...</p>
            </div>
          </uui-box>
        ` : ""}
        
        ${this._error ? o`
          <uui-box headline="Error" color="danger">
            <p>${this._error}</p>
          </uui-box>
        ` : ""}
        
        ${this.renderResults()}
      </div>
    `;
  }
};
m = /* @__PURE__ */ new WeakMap();
d = /* @__PURE__ */ new WeakSet();
x = async function() {
  if (this._loading = !0, this._error = "", this._report = null, !k(this, m)) {
    this._error = "Repository not initialized", this._loading = !1;
    return;
  }
  try {
    const r = [];
    if (this._criticalChecked && r.push("Critical"), this._errorChecked && r.push("Error"), this._warningChecked && r.push("Warning"), r.length === 0) {
      this._error = "Please select at least one log level", this._loading = !1;
      return;
    }
    const e = await k(this, m).analyzeWithFilters(r, this._timeRange);
    e ? this._report = e.data : this._error = "Failed to load AI diagnostics";
  } catch (r) {
    this._error = `Error: ${r}`, console.error("Error analyzing logs:", r);
  }
  this._loading = !1;
};
w = function(r) {
  const e = r.target;
  this._criticalChecked = e.checked;
};
y = function(r) {
  const e = r.target;
  this._errorChecked = e.checked;
};
z = function(r) {
  const e = r.target;
  this._warningChecked = e.checked;
};
C = function(r) {
  const e = r.target;
  this._timeRange = e.value, console.log("Time range changed to:", this._timeRange);
};
n.styles = A`
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

    uui-badge {
      text-transform: uppercase;
      font-weight: 600;
    }

    /* Markdown content styles */
    .markdown-content {
      line-height: 1.6;
    }

    .markdown-content p {
      margin: var(--uui-size-space-2) 0;
    }

    .markdown-content strong {
      font-weight: 600;
    }

    .markdown-content em {
      font-style: italic;
    }

    .markdown-content code {
      background: var(--uui-color-surface-alt);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    .markdown-content pre {
      background: var(--uui-color-surface-alt);
      padding: var(--uui-size-space-3);
      border-radius: var(--uui-border-radius);
      overflow-x: auto;
      margin: var(--uui-size-space-3) 0;
    }

    .markdown-content pre code {
      background: none;
      padding: 0;
    }

    .markdown-content ul,
    .markdown-content ol {
      margin: var(--uui-size-space-2) 0;
      padding-left: var(--uui-size-space-5);
    }

    .markdown-content li {
      margin-bottom: var(--uui-size-space-1);
    }

    .markdown-content h1,
    .markdown-content h2,
    .markdown-content h3,
    .markdown-content h4,
    .markdown-content h5,
    .markdown-content h6 {
      margin: var(--uui-size-space-3) 0 var(--uui-size-space-2) 0;
      font-weight: 600;
    }

    .markdown-content h1 { font-size: 1.5em; }
    .markdown-content h2 { font-size: 1.3em; }
    .markdown-content h3 { font-size: 1.1em; }

    .markdown-content blockquote {
      border-left: 3px solid var(--uui-color-border);
      padding-left: var(--uui-size-space-3);
      margin: var(--uui-size-space-3) 0;
      color: var(--uui-color-text-alt);
    }

    .markdown-content hr {
      border: none;
      border-top: 1px solid var(--uui-color-border);
      margin: var(--uui-size-space-4) 0;
    }

    .markdown-content a {
      color: var(--uui-color-interactive);
      text-decoration: none;
    }

    .markdown-content a:hover {
      text-decoration: underline;
    }

    .fix-item {
      margin-bottom: var(--uui-size-space-2);
    }
  `;
c([
  p()
], n.prototype, "_loading", 2);
c([
  p()
], n.prototype, "_error", 2);
c([
  p()
], n.prototype, "_report", 2);
c([
  p()
], n.prototype, "_criticalChecked", 2);
c([
  p()
], n.prototype, "_errorChecked", 2);
c([
  p()
], n.prototype, "_warningChecked", 2);
c([
  p()
], n.prototype, "_timeRange", 2);
n = c([
  L("umbraco-ai-diagnostics-workspace-view")
], n);
const T = n;
export {
  n as UmbracoAIDiagnosticsWorkspaceViewElement,
  T as default
};
//# sourceMappingURL=workspace-view.js.map

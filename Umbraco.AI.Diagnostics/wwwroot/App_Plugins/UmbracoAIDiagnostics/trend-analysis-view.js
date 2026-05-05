import { UmbElementMixin as k } from "@umbraco-cms/backoffice/element-api";
import { LitElement as $, html as o, css as C, state as c, customElement as z } from "@umbraco-cms/backoffice/external/lit";
import { UmbracoAIDiagnosticsRepository as L } from "./repository.js";
var E = Object.defineProperty, T = Object.getOwnPropertyDescriptor, m = (e) => {
  throw TypeError(e);
}, n = (e, t, r, i) => {
  for (var a = i > 1 ? void 0 : i ? T(t, r) : t, l = e.length - 1, h; l >= 0; l--)
    (h = e[l]) && (a = (i ? h(t, r, a) : h(a)) || a);
  return i && a && E(t, r, a), a;
}, g = (e, t, r) => t.has(e) || m("Cannot " + r), A = (e, t, r) => (g(e, t, "read from private field"), r ? r.call(e) : t.get(e)), v = (e, t, r) => t.has(e) ? m("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, r), R = (e, t, r, i) => (g(e, t, "write to private field"), t.set(e, r), r), d = (e, t, r) => (g(e, t, "access private method"), r), p, u, _, f, x, b, y;
function D(e) {
  if (!e.length)
    return "";
  const t = Math.max(...e.map((a) => a.total), 1), r = 100, i = 40;
  if (e.length === 1) {
    const a = i - e[0].total / t * i;
    return `0,${a} ${r},${a}`;
  }
  return e.map((a, l) => {
    const h = l / (e.length - 1) * r, w = i - a.total / t * i;
    return `${h},${w}`;
  }).join(" ");
}
let s = class extends k($) {
  constructor() {
    super(), v(this, u), this._loading = !1, this._error = "", this._report = null, this._fatalChecked = !0, this._errorChecked = !0, this._warningChecked = !0, this._timeRange = "1hour", v(this, p), R(this, p, new L(this));
  }
  render() {
    const e = this._report?.buckets ?? [], t = this._report ? D(e) : "", r = this._report?.trendDirection ?? "stable";
    return o`
            <div class="wrap">
                <uui-box headline="Trend filters">
                    <div class="filters">
                        <div class="checks">
                            <uui-checkbox label="Fatal" .checked=${this._fatalChecked} @change=${d(this, u, f)}></uui-checkbox>
                            <uui-checkbox label="Error" .checked=${this._errorChecked} @change=${d(this, u, x)}></uui-checkbox>
                            <uui-checkbox label="Warning" .checked=${this._warningChecked} @change=${d(this, u, b)}></uui-checkbox>
                        </div>
                        <select class="sel" .value=${this._timeRange} @change=${d(this, u, y)}>
                            <option value="1hour">Last 1 hour</option>
                            <option value="2hours">Last 2 hours</option>
                            <option value="24hours">Last 24 hours</option>
                            <option value="7days">Last 7 days</option>
                            <option value="1month">Last month</option>
                        </select>
                        <uui-button look="primary" @click=${d(this, u, _)} ?disabled=${this._loading}>Load trends</uui-button>
                    </div>
                </uui-box>

                ${this._loading ? o`<uui-box><uui-loader></uui-loader> Loading…</uui-box>` : null}
                ${this._error ? o`<uui-box headline="Error" color="danger"><p>${this._error}</p></uui-box>` : null}

                ${this._report ? o`
                          <uui-box headline="Trend summary">
                              <div class="summary-row">
                                  <uui-tag>Total entries: ${this._report.grandTotal ?? 0}</uui-tag>
                                  <uui-tag>Range: ${this._report.timeRange ?? this._timeRange}</uui-tag>
                                  ${r === "up" ? o`<uui-tag color="danger">↑ Increasing</uui-tag>` : r === "down" ? o`<uui-tag color="positive">↓ Decreasing</uui-tag>` : o`<uui-tag>→ Steady</uui-tag>`}
                              </div>
                              <p class="summary-text">${this._report.trendSummary ?? ""}</p>
                              <p class="hint">
                                  Compares total log volume in the first half of the timeline vs the second half
                                  (same levels and range as Log Viewer).
                              </p>
                          </uui-box>

                          <uui-box headline="Volume over time">
                              <div class="chart-wrap">
                                  <svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none">
                                      <polyline
                                          fill="none"
                                          stroke="var(--uui-color-interactive, #3544b1)"
                                          stroke-width="1.2"
                                          vector-effect="non-scaling-stroke"
                                          points=${t}
                                      />
                                  </svg>
                              </div>
                              <div class="bar-row">
                                  ${e.map(
      (i) => o`
                                          <div class="bar-col" title="${i.label}: ${i.total}">
                                              <div
                                                  class="bar"
                                                  style="height:${Math.max(4, i.total / (Math.max(...e.map((a) => a.total), 1) || 1) * 100)}%"
                                              ></div>
                                              <span class="tick">${i.label}</span>
                                          </div>
                                      `
    )}
                              </div>
                          </uui-box>

                          <uui-box headline="Per-bucket totals">
                              ${e.length ? o`
                                        <table class="tbl">
                                            <thead>
                                                <tr>
                                                    <th>Bucket</th>
                                                    <th>Total</th>
                                                    ${Object.keys(e[0]?.countsByLevel ?? {}).map(
      (i) => o`<th>${i}</th>`
    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${e.map(
      (i) => o`
                                                        <tr>
                                                            <td>${i.label}</td>
                                                            <td>${i.total}</td>
                                                            ${Object.keys(e[0]?.countsByLevel ?? {}).map(
        (a) => {
          const l = i.countsByLevel?.[a] ?? 0;
          return o`<td>${l}</td>`;
        }
      )}
                                                        </tr>
                                                    `
    )}
                                            </tbody>
                                        </table>
                                    ` : o`<p>No buckets in this range.</p>`}
                          </uui-box>
                      ` : null}
            </div>
        `;
  }
};
p = /* @__PURE__ */ new WeakMap();
u = /* @__PURE__ */ new WeakSet();
_ = async function() {
  this._loading = !0, this._error = "", this._report = null;
  const e = [];
  if (this._fatalChecked && e.push("Fatal"), this._errorChecked && e.push("Error"), this._warningChecked && e.push("Warning"), !e.length) {
    this._error = "Please select at least one log level", this._loading = !1;
    return;
  }
  try {
    const t = await A(this, p)?.getLogTrends(e, this._timeRange);
    t?.error ? this._error = t.error : t?.data ? this._report = t.data : this._error = "No data returned from the log trends API.";
  } catch (t) {
    this._error = `Error: ${t}`;
  }
  this._loading = !1;
};
f = function(e) {
  this._fatalChecked = e.target.checked;
};
x = function(e) {
  this._errorChecked = e.target.checked;
};
b = function(e) {
  this._warningChecked = e.target.checked;
};
y = function(e) {
  this._timeRange = e.target.value;
};
s.styles = C`
        :host {
            display: block;
            padding: var(--uui-size-space-5);
        }
        .wrap {
            display: flex;
            flex-direction: column;
            gap: var(--uui-size-space-5);
        }
        .filters {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: var(--uui-size-space-4);
        }
        .checks {
            display: flex;
            gap: var(--uui-size-space-4);
        }
        .sel {
            min-width: 180px;
            height: 36px;
            border-radius: var(--uui-border-radius);
            border: 1px solid var(--uui-color-border);
            padding: 0 var(--uui-size-space-3);
            background: var(--uui-color-surface);
        }
        .summary-row {
            display: flex;
            flex-wrap: wrap;
            gap: var(--uui-size-space-3);
            margin-bottom: var(--uui-size-space-3);
        }
        .summary-text {
            font-size: 1rem;
            margin: 0 0 var(--uui-size-space-2);
        }
        .hint {
            margin: 0;
            font-size: 0.85rem;
            color: var(--uui-color-text-alt, #666);
        }
        .chart-wrap {
            width: 100%;
            height: 120px;
            margin-bottom: var(--uui-size-space-4);
        }
        .spark {
            width: 100%;
            height: 100%;
        }
        .bar-row {
            display: flex;
            align-items: flex-end;
            gap: 4px;
            height: 120px;
            border-bottom: 1px solid var(--uui-color-border);
            padding-bottom: 2px;
        }
        .bar-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100%;
            min-width: 0;
        }
        .bar {
            width: 100%;
            margin-top: auto;
            background: var(--uui-color-interactive, #3544b1);
            border-radius: 2px 2px 0 0;
            min-height: 2px;
        }
        .tick {
            font-size: 10px;
            color: var(--uui-color-text-alt, #666);
            margin-top: 4px;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
        }
        .tbl {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }
        .tbl th,
        .tbl td {
            text-align: left;
            padding: var(--uui-size-space-2);
            border-bottom: 1px solid var(--uui-color-border);
        }
    `;
n([
  c()
], s.prototype, "_loading", 2);
n([
  c()
], s.prototype, "_error", 2);
n([
  c()
], s.prototype, "_report", 2);
n([
  c()
], s.prototype, "_fatalChecked", 2);
n([
  c()
], s.prototype, "_errorChecked", 2);
n([
  c()
], s.prototype, "_warningChecked", 2);
n([
  c()
], s.prototype, "_timeRange", 2);
s = n([
  z("umbraco-ai-diagnostics-trend-analysis-view")
], s);
const O = s;
export {
  s as UmbracoAIDiagnosticsTrendAnalysisViewElement,
  O as default
};
//# sourceMappingURL=trend-analysis-view.js.map

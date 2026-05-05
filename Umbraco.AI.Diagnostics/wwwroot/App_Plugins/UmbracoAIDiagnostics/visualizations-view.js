import { UmbElementMixin as L } from "@umbraco-cms/backoffice/element-api";
import { LitElement as E, html as c, css as O, state as h, customElement as V } from "@umbraco-cms/backoffice/external/lit";
import { UmbracoAIDiagnosticsRepository as W } from "./repository.js";
var A = Object.defineProperty, D = Object.getOwnPropertyDescriptor, b = (e) => {
  throw TypeError(e);
}, u = (e, t, i, s) => {
  for (var n = s > 1 ? void 0 : s ? D(t, i) : t, r = e.length - 1, a; r >= 0; r--)
    (a = e[r]) && (n = (s ? a(t, i, n) : a(n)) || n);
  return s && n && A(t, i, n), n;
}, m = (e, t, i) => t.has(e) || b("Cannot " + i), F = (e, t, i) => (m(e, t, "read from private field"), i ? i.call(e) : t.get(e)), x = (e, t, i) => t.has(e) ? b("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), P = (e, t, i, s) => (m(e, t, "write to private field"), t.set(e, i), i), g = (e, t, i) => (m(e, t, "access private method"), i), _, p, k, w, y, $, z;
function f(e) {
  const t = e.toLowerCase();
  return t === "fatal" ? "#9b1c31" : t === "error" ? "#c0392b" : t === "warning" ? "#c9a227" : "#5c6bc0";
}
function R(e) {
  if (!e || !Object.keys(e).length)
    return "conic-gradient(var(--uui-color-surface-alt, #e4e4e7) 0% 100%)";
  const t = Object.entries(e).filter(([, r]) => r > 0).sort((r, a) => a[1] - r[1]), i = t.reduce((r, [, a]) => r + a, 0);
  if (i === 0)
    return "conic-gradient(var(--uui-color-surface-alt, #e4e4e7) 0% 100%)";
  let s = 0;
  return `conic-gradient(${t.map(([r, a]) => {
    const l = a / i * 100, d = f(r), v = s;
    return s += l, `${d} ${v.toFixed(2)}% ${s.toFixed(2)}%`;
  }).join(", ")})`;
}
let o = class extends L(E) {
  constructor() {
    super(), x(this, p), this._loading = !1, this._error = "", this._report = null, this._fatalChecked = !0, this._errorChecked = !0, this._warningChecked = !0, this._timeRange = "24hours", x(this, _), P(this, _, new W(this));
  }
  render() {
    const e = this._report, t = e?.totalsByLevel ?? {}, i = e?.analyzedLogLevels?.length ? e.analyzedLogLevels : Object.keys(t), s = R(t), n = e?.buckets ?? [], r = e?.grandTotal ?? 0;
    return c`
            <div class="wrap">
                <uui-box headline="Visualization filters">
                    <div class="filters">
                        <div class="checks">
                            <uui-checkbox label="Fatal" .checked=${this._fatalChecked} @change=${g(this, p, w)}></uui-checkbox>
                            <uui-checkbox label="Error" .checked=${this._errorChecked} @change=${g(this, p, y)}></uui-checkbox>
                            <uui-checkbox label="Warning" .checked=${this._warningChecked} @change=${g(this, p, $)}></uui-checkbox>
                        </div>
                        <select class="sel" .value=${this._timeRange} @change=${g(this, p, z)}>
                            <option value="1hour">Last 1 hour</option>
                            <option value="2hours">Last 2 hours</option>
                            <option value="24hours">Last 24 hours</option>
                            <option value="7days">Last 7 days</option>
                            <option value="1month">Last month</option>
                        </select>
                        <uui-button look="primary" @click=${g(this, p, k)} ?disabled=${this._loading}>Load charts</uui-button>
                    </div>
                </uui-box>

                ${this._loading ? c`<uui-box><uui-loader></uui-loader> Loading…</uui-box>` : null}
                ${this._error ? c`<uui-box headline="Error" color="danger"><p>${this._error}</p></uui-box>` : null}

                ${e ? c`
                          <div class="grid2">
                              <uui-box headline="Share by level">
                                  <div class="pie-wrap">
                                      <div class="pie" style="background:${s}"></div>
                                  </div>
                                  <ul class="legend">
                                      ${i.map((a) => {
      const l = t[a] ?? 0;
      return c`<li><span class="sw" style="background:${f(a)}"></span> ${a}: ${l}</li>`;
    })}
                                  </ul>
                              </uui-box>

                              <uui-box headline="Totals">
                                  <p class="lead">Grand total: <strong>${r}</strong></p>
                                  <div class="hbar-list">
                                      ${i.map((a) => {
      const l = t[a] ?? 0, d = r > 0 ? l / r * 100 : 0;
      return c`
                                              <div class="hrow">
                                                  <span class="lab">${a}</span>
                                                  <div class="htrack">
                                                      <div class="hfill" style="width:${d}%;background:${f(a)}"></div>
                                                  </div>
                                                  <span class="num">${l}</span>
                                              </div>
                                          `;
    })}
                                  </div>
                              </uui-box>
                          </div>

                          <uui-box headline="Level mix per time bucket">
                              <p class="sub">
                                  Each row is one bucket; segments are Fatal / Error / Warning counts (same palette as
                                  the donut).
                              </p>
                              <div class="stack-list">
                                  ${n.map((a) => {
      const l = a.total || 1;
      return c`
                                          <div class="stack-row">
                                              <span class="stack-lab">${a.label}</span>
                                              <div class="stack-track">
                                                  ${i.map((d) => {
        const v = a.countsByLevel?.[d] ?? 0, C = v / l * 100;
        return c`
                                                          <div
                                                              class="seg"
                                                              style="width:${C}%;background:${f(d)}"
                                                              title="${d}: ${v}"
                                                          ></div>
                                                      `;
      })}
                                              </div>
                                              <span class="stack-tot">${a.total}</span>
                                          </div>
                                      `;
    })}
                              </div>
                          </uui-box>
                      ` : null}
            </div>
        `;
  }
};
_ = /* @__PURE__ */ new WeakMap();
p = /* @__PURE__ */ new WeakSet();
k = async function() {
  this._loading = !0, this._error = "", this._report = null;
  const e = [];
  if (this._fatalChecked && e.push("Fatal"), this._errorChecked && e.push("Error"), this._warningChecked && e.push("Warning"), !e.length) {
    this._error = "Please select at least one log level", this._loading = !1;
    return;
  }
  try {
    const t = await F(this, _)?.getLogTrends(e, this._timeRange);
    t?.error ? this._error = t.error : t?.data ? this._report = t.data : this._error = "No data returned from the log trends API.";
  } catch (t) {
    this._error = `Error: ${t}`;
  }
  this._loading = !1;
};
w = function(e) {
  this._fatalChecked = e.target.checked;
};
y = function(e) {
  this._errorChecked = e.target.checked;
};
$ = function(e) {
  this._warningChecked = e.target.checked;
};
z = function(e) {
  this._timeRange = e.target.value;
};
o.styles = O`
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
        .grid2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--uui-size-space-5);
        }
        @media (max-width: 900px) {
            .grid2 {
                grid-template-columns: 1fr;
            }
        }
        .pie-wrap {
            display: flex;
            justify-content: center;
            padding: var(--uui-size-space-4);
        }
        .pie {
            width: 180px;
            height: 180px;
            border-radius: 50%;
        }
        .legend {
            list-style: none;
            padding: 0 var(--uui-size-space-4) var(--uui-size-space-4);
            margin: 0;
        }
        .legend li {
            display: flex;
            align-items: center;
            gap: var(--uui-size-space-2);
            margin-bottom: var(--uui-size-space-2);
        }
        .sw {
            width: 12px;
            height: 12px;
            border-radius: 2px;
        }
        .lead {
            margin-top: 0;
        }
        .hbar-list {
            display: flex;
            flex-direction: column;
            gap: var(--uui-size-space-3);
        }
        .hrow {
            display: grid;
            grid-template-columns: 72px 1fr 48px;
            align-items: center;
            gap: var(--uui-size-space-3);
        }
        .lab {
            font-size: 0.875rem;
        }
        .htrack {
            height: 12px;
            background: var(--uui-color-surface-alt, #eee);
            border-radius: 6px;
            overflow: hidden;
        }
        .hfill {
            height: 100%;
            border-radius: 6px;
        }
        .num {
            text-align: right;
            font-size: 0.875rem;
        }
        .sub {
            margin-top: 0;
            font-size: 0.85rem;
            color: var(--uui-color-text-alt, #666);
        }
        .stack-list {
            display: flex;
            flex-direction: column;
            gap: var(--uui-size-space-2);
        }
        .stack-row {
            display: grid;
            grid-template-columns: 88px 1fr 40px;
            align-items: center;
            gap: var(--uui-size-space-3);
        }
        .stack-lab {
            font-size: 0.8rem;
            color: var(--uui-color-text-alt, #666);
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .stack-track {
            display: flex;
            height: 14px;
            border-radius: 4px;
            overflow: hidden;
            background: var(--uui-color-surface-alt, #eee);
        }
        .seg {
            height: 100%;
            min-width: 0;
        }
        .stack-tot {
            text-align: right;
            font-size: 0.8rem;
        }
    `;
u([
  h()
], o.prototype, "_loading", 2);
u([
  h()
], o.prototype, "_error", 2);
u([
  h()
], o.prototype, "_report", 2);
u([
  h()
], o.prototype, "_fatalChecked", 2);
u([
  h()
], o.prototype, "_errorChecked", 2);
u([
  h()
], o.prototype, "_warningChecked", 2);
u([
  h()
], o.prototype, "_timeRange", 2);
o = u([
  V("umbraco-ai-diagnostics-visualizations-view")
], o);
const U = o;
export {
  o as UmbracoAIDiagnosticsVisualizationsViewElement,
  U as default
};
//# sourceMappingURL=visualizations-view.js.map

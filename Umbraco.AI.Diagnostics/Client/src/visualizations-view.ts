import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { LitElement, html, css, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbracoAIDiagnosticsRepository } from './repository';

type TrendBucket = {
    label: string;
    total: number;
    countsByLevel?: Record<string, number>;
};

type TrendReport = {
    timeRange?: string;
    grandTotal?: number;
    analyzedLogLevels?: string[];
    totalsByLevel?: Record<string, number>;
    buckets?: TrendBucket[];
};

function levelColor(level: string): string {
    const l = level.toLowerCase();
    if (l === 'fatal') return '#9b1c31';
    if (l === 'error') return '#c0392b';
    if (l === 'warning') return '#c9a227';
    return '#5c6bc0';
}

function buildConicGradient(totals: Record<string, number> | undefined): string {
    if (!totals || !Object.keys(totals).length) {
        return 'conic-gradient(var(--uui-color-surface-alt, #e4e4e7) 0% 100%)';
    }

    const entries = Object.entries(totals)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);
    const sum = entries.reduce((a, [, v]) => a + v, 0);
    if (sum === 0) {
        return 'conic-gradient(var(--uui-color-surface-alt, #e4e4e7) 0% 100%)';
    }

    let acc = 0;
    const stops = entries.map(([lvl, n]) => {
        const pct = (n / sum) * 100;
        const c = levelColor(lvl);
        const start = acc;
        acc += pct;
        return `${c} ${start.toFixed(2)}% ${acc.toFixed(2)}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
}

@customElement('umbraco-ai-diagnostics-visualizations-view')
export class UmbracoAIDiagnosticsVisualizationsViewElement extends UmbElementMixin(LitElement) {
    @state()
    private _loading = false;

    @state()
    private _error = '';

    @state()
    private _report: TrendReport | null = null;

    @state()
    private _fatalChecked = true;

    @state()
    private _errorChecked = true;

    @state()
    private _warningChecked = true;

    @state()
    private _timeRange = '24hours';

    #repository?: UmbracoAIDiagnosticsRepository;

    constructor() {
        super();
        this.#repository = new UmbracoAIDiagnosticsRepository(this);
    }

    async #load() {
        this._loading = true;
        this._error = '';
        this._report = null;

        const logLevels: string[] = [];
        if (this._fatalChecked) logLevels.push('Fatal');
        if (this._errorChecked) logLevels.push('Error');
        if (this._warningChecked) logLevels.push('Warning');

        if (!logLevels.length) {
            this._error = 'Please select at least one log level';
            this._loading = false;
            return;
        }

        try {
            const result = await this.#repository?.getLogTrends(logLevels, this._timeRange);
            if (result?.error) {
                this._error = result.error;
            } else if (result?.data) {
                this._report = result.data as TrendReport;
            } else {
                this._error = 'No data returned from the log trends API.';
            }
        } catch (e) {
            this._error = `Error: ${e}`;
        }

        this._loading = false;
    }

    #onFatal(e: Event) {
        this._fatalChecked = (e.target as HTMLInputElement).checked;
    }

    #onError(e: Event) {
        this._errorChecked = (e.target as HTMLInputElement).checked;
    }

    #onWarning(e: Event) {
        this._warningChecked = (e.target as HTMLInputElement).checked;
    }

    #onTime(e: Event) {
        this._timeRange = (e.target as HTMLSelectElement).value;
    }

    override render() {
        const r = this._report;
        const totals = r?.totalsByLevel ?? {};
        const levels = r?.analyzedLogLevels?.length ? r.analyzedLogLevels : Object.keys(totals);
        const pieStyle = buildConicGradient(totals);
        const buckets = r?.buckets ?? [];
        const grandTotal = r?.grandTotal ?? 0;

        return html`
            <div class="wrap">
                <uui-box headline="Visualization filters">
                    <div class="filters">
                        <div class="checks">
                            <uui-checkbox label="Fatal" .checked=${this._fatalChecked} @change=${this.#onFatal}></uui-checkbox>
                            <uui-checkbox label="Error" .checked=${this._errorChecked} @change=${this.#onError}></uui-checkbox>
                            <uui-checkbox label="Warning" .checked=${this._warningChecked} @change=${this.#onWarning}></uui-checkbox>
                        </div>
                        <select class="sel" .value=${this._timeRange} @change=${this.#onTime}>
                            <option value="1hour">Last 1 hour</option>
                            <option value="2hours">Last 2 hours</option>
                            <option value="24hours">Last 24 hours</option>
                            <option value="7days">Last 7 days</option>
                            <option value="1month">Last month</option>
                        </select>
                        <uui-button look="primary" @click=${this.#load} ?disabled=${this._loading}>Load charts</uui-button>
                    </div>
                </uui-box>

                ${this._loading ? html`<uui-box><uui-loader></uui-loader> Loading…</uui-box>` : null}
                ${this._error ? html`<uui-box headline="Error" color="danger"><p>${this._error}</p></uui-box>` : null}

                ${r
                    ? html`
                          <div class="grid2">
                              <uui-box headline="Share by level">
                                  <div class="pie-wrap">
                                      <div class="pie" style="background:${pieStyle}"></div>
                                  </div>
                                  <ul class="legend">
                                      ${levels.map((lvl) => {
                                          const n = totals[lvl] ?? 0;
                                          return html`<li><span class="sw" style="background:${levelColor(lvl)}"></span> ${lvl}: ${n}</li>`;
                                      })}
                                  </ul>
                              </uui-box>

                              <uui-box headline="Totals">
                                  <p class="lead">Grand total: <strong>${grandTotal}</strong></p>
                                  <div class="hbar-list">
                                      ${levels.map((lvl) => {
                                          const n = totals[lvl] ?? 0;
                                          const pct = grandTotal > 0 ? (n / grandTotal) * 100 : 0;
                                          return html`
                                              <div class="hrow">
                                                  <span class="lab">${lvl}</span>
                                                  <div class="htrack">
                                                      <div class="hfill" style="width:${pct}%;background:${levelColor(lvl)}"></div>
                                                  </div>
                                                  <span class="num">${n}</span>
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
                                  ${buckets.map((b) => {
                                      const t = b.total || 1;
                                      return html`
                                          <div class="stack-row">
                                              <span class="stack-lab">${b.label}</span>
                                              <div class="stack-track">
                                                  ${levels.map((lvl) => {
                                                      const c = b.countsByLevel?.[lvl] ?? 0;
                                                      const w = (c / t) * 100;
                                                      return html`
                                                          <div
                                                              class="seg"
                                                              style="width:${w}%;background:${levelColor(lvl)}"
                                                              title="${lvl}: ${c}"
                                                          ></div>
                                                      `;
                                                  })}
                                              </div>
                                              <span class="stack-tot">${b.total}</span>
                                          </div>
                                      `;
                                  })}
                              </div>
                          </uui-box>
                      `
                    : null}
            </div>
        `;
    }

    static styles = css`
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
}

export default UmbracoAIDiagnosticsVisualizationsViewElement;

declare global {
    interface HTMLElementTagNameMap {
        'umbraco-ai-diagnostics-visualizations-view': UmbracoAIDiagnosticsVisualizationsViewElement;
    }
}

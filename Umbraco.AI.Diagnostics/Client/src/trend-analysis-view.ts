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
    trendDirection?: string;
    trendSummary?: string;
    buckets?: TrendBucket[];
};

function buildSparklinePoints(buckets: TrendBucket[]): string {
    if (!buckets.length) {
        return '';
    }

    const max = Math.max(...buckets.map((b) => b.total), 1);
    const w = 100;
    const h = 40;
    if (buckets.length === 1) {
        const y = h - (buckets[0].total / max) * h;
        return `0,${y} ${w},${y}`;
    }

    return buckets
        .map((b, i) => {
            const x = (i / (buckets.length - 1)) * w;
            const y = h - (b.total / max) * h;
            return `${x},${y}`;
        })
        .join(' ');
}

@customElement('umbraco-ai-diagnostics-trend-analysis-view')
export class UmbracoAIDiagnosticsTrendAnalysisViewElement extends UmbElementMixin(LitElement) {
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
    private _timeRange = '1hour';

    #repository?: UmbracoAIDiagnosticsRepository;

    constructor() {
        super();
        this.#repository = new UmbracoAIDiagnosticsRepository(this);
    }

    async #loadTrends() {
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
        const buckets = this._report?.buckets ?? [];
        const points = this._report ? buildSparklinePoints(buckets) : '';
        const trendDir = this._report?.trendDirection ?? 'stable';

        return html`
            <div class="wrap">
                <uui-box headline="Trend filters">
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
                        <uui-button look="primary" @click=${this.#loadTrends} ?disabled=${this._loading}>Load trends</uui-button>
                    </div>
                </uui-box>

                ${this._loading
                    ? html`<uui-box><uui-loader></uui-loader> Loading…</uui-box>`
                    : null}
                ${this._error ? html`<uui-box headline="Error" color="danger"><p>${this._error}</p></uui-box>` : null}

                ${this._report
                    ? html`
                          <uui-box headline="Trend summary">
                              <div class="summary-row">
                                  <uui-tag>Total entries: ${this._report.grandTotal ?? 0}</uui-tag>
                                  <uui-tag>Range: ${this._report.timeRange ?? this._timeRange}</uui-tag>
                                  ${trendDir === 'up'
                                      ? html`<uui-tag color="danger">↑ Increasing</uui-tag>`
                                      : trendDir === 'down'
                                        ? html`<uui-tag color="positive">↓ Decreasing</uui-tag>`
                                        : html`<uui-tag>→ Steady</uui-tag>`}
                              </div>
                              <p class="summary-text">${this._report.trendSummary ?? ''}</p>
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
                                          points=${points}
                                      />
                                  </svg>
                              </div>
                              <div class="bar-row">
                                  ${buckets.map(
                                      (b) => html`
                                          <div class="bar-col" title="${b.label}: ${b.total}">
                                              <div
                                                  class="bar"
                                                  style="height:${Math.max(4, (b.total / (Math.max(...buckets.map((x) => x.total), 1) || 1)) * 100)}%"
                                              ></div>
                                              <span class="tick">${b.label}</span>
                                          </div>
                                      `,
                                  )}
                              </div>
                          </uui-box>

                          <uui-box headline="Per-bucket totals">
                              ${buckets.length
                                  ? html`
                                        <table class="tbl">
                                            <thead>
                                                <tr>
                                                    <th>Bucket</th>
                                                    <th>Total</th>
                                                    ${Object.keys(buckets[0]?.countsByLevel ?? {}).map(
                                                        (lvl) => html`<th>${lvl}</th>`,
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${buckets.map(
                                                    (b) => html`
                                                        <tr>
                                                            <td>${b.label}</td>
                                                            <td>${b.total}</td>
                                                            ${Object.keys(buckets[0]?.countsByLevel ?? {}).map(
                                                                (lvl) => {
                                                                    const v = b.countsByLevel?.[lvl] ?? 0;
                                                                    return html`<td>${v}</td>`;
                                                                },
                                                            )}
                                                        </tr>
                                                    `,
                                                )}
                                            </tbody>
                                        </table>
                                    `
                                  : html`<p>No buckets in this range.</p>`}
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
}

export default UmbracoAIDiagnosticsTrendAnalysisViewElement;

declare global {
    interface HTMLElementTagNameMap {
        'umbraco-ai-diagnostics-trend-analysis-view': UmbracoAIDiagnosticsTrendAnalysisViewElement;
    }
}

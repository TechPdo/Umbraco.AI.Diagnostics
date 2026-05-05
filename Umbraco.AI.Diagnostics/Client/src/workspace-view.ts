import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { LitElement, html, css, customElement, state, unsafeHTML } from '@umbraco-cms/backoffice/external/lit';
import { analysisMarkdownContentStyles, renderAnalysisMarkdown } from './analysis-markdown';
import type { ChatProfileOptionDto, ChatProfilesResponse } from './repository';
import { UmbracoAIDiagnosticsRepository } from './repository';

function pickDefaultChatProfileAlias(data: ChatProfilesResponse | undefined): string {
    const profiles = data?.profiles ?? [];
    if (profiles.length === 0) {
        return '';
    }
    const explicit = data?.defaultProfileAlias?.trim();
    if (explicit && profiles.some((p) => p.alias === explicit)) {
        return explicit;
    }
    const marked = profiles.find((p) => p.isDefault);
    if (marked) {
        return marked.alias;
    }
    return profiles[0]!.alias;
}

@customElement('umbraco-ai-diagnostics-workspace-view')
export class UmbracoAIDiagnosticsWorkspaceViewElement extends UmbElementMixin(LitElement) {

    @state()
    private _loading: boolean = false;

    @state()
    private _error: string = '';

    @state()
    private _report: any = null;

    @state()
    private _fatalChecked: boolean = true;

    @state()
    private _errorChecked: boolean = true;

    @state()
    private _warningChecked: boolean = true;

    @state()
    private _timeRange: string = '1hour';

    /** Selected chat profile alias (site default is chosen automatically when profiles load). */
    @state()
    private _profileAlias: string = '';

    @state()
    private _profiles: ChatProfileOptionDto[] = [];

    @state()
    private _profilesError: string = '';

    #repository?: UmbracoAIDiagnosticsRepository;

    #chatProfilesLoaded = false;

    constructor() {
        super();
        this.#repository = new UmbracoAIDiagnosticsRepository(this);
    }

    override connectedCallback(): void {
        super.connectedCallback();
        if (!this.#chatProfilesLoaded) {
            this.#chatProfilesLoaded = true;
            void this.#loadChatProfiles();
        }
    }

    async #loadChatProfiles() {
        if (!this.#repository) {
            return;
        }

        this._profilesError = '';
        const result = await this.#repository.getChatProfiles();
        if (result.error) {
            this._profilesError = result.error;
            this._profiles = [];
            this._profileAlias = '';
            return;
        }

        this._profiles = result.data?.profiles ?? [];
        this._profileAlias = pickDefaultChatProfileAlias(result.data);
    }

    async #handleAnalyze() {
        this._loading = true;
        this._error = '';
        this._report = null;

        if (!this.#repository) {
            this._error = 'Repository not initialized';
            this._loading = false;
            return;
        }

        try {
            // Collect selected log levels
            const logLevels: string[] = [];
            if (this._fatalChecked) logLevels.push('Fatal');
            if (this._errorChecked) logLevels.push('Error');
            if (this._warningChecked) logLevels.push('Warning');

            if (logLevels.length === 0) {
                this._error = 'Please select at least one log level';
                this._loading = false;
                return;
            }

            // Call the repository method with filters
            const result = await this.#repository.analyzeWithFilters(
                logLevels,
                this._timeRange,
                this._profileAlias,
            );

            if (result) {
                this._report = result.data;
            } else {
                this._error = 'Failed to load AI diagnostics';
            }
        } catch (error) {
            this._error = `Error: ${error}`;
            console.error('Error analyzing logs:', error);
        }

        this._loading = false;
    }

    #handleFatalChange(e: Event) {
        const checkbox = e.target as HTMLInputElement;
        this._fatalChecked = checkbox.checked;
    }

    #handleErrorChange(e: Event) {
        const checkbox = e.target as HTMLInputElement;
        this._errorChecked = checkbox.checked;
    }

    #handleWarningChange(e: Event) {
        const checkbox = e.target as HTMLInputElement;
        this._warningChecked = checkbox.checked;
    }

    #handleTimeRangeChange(e: Event) {
        const select = e.target as HTMLSelectElement;
        this._timeRange = select.value;
        console.log('Time range changed to:', this._timeRange);
    }

    #handleProfileChange(e: Event) {
        const select = e.target as HTMLSelectElement;
        this._profileAlias = select.value;
    }

    private renderFilters() {
        return html`
      <uui-box headline="Analysis Filters">
        <div class="filters-container">
          <div class="label-group">
            <label>Log Type:</label>
          </div>
          
          <div class="checkboxes-group">
            <uui-checkbox
              label="Fatal"
              .checked=${this._fatalChecked}
              @change=${this.#handleFatalChange}
            ></uui-checkbox>
            
            <uui-checkbox
              label="Error"
              .checked=${this._errorChecked}
              @change=${this.#handleErrorChange}
            ></uui-checkbox>
            
            <uui-checkbox
              label="Warning"
              .checked=${this._warningChecked}
              @change=${this.#handleWarningChange}
            ></uui-checkbox>
          </div>

          <div class="label-group">
            <label>Time Range:</label>
          </div>

          <div class="dropdown-group">
            <select
              class="time-range-select"
              .value=${this._timeRange}
              @change=${this.#handleTimeRangeChange}
            >
              <option value="1hour" ?selected=${this._timeRange === '1hour'}>Last 1 hour</option>
              <option value="2hours" ?selected=${this._timeRange === '2hours'}>Last 2 hours</option>
              <option value="24hours" ?selected=${this._timeRange === '24hours'}>Last 24 hours</option>
              <option value="7days" ?selected=${this._timeRange === '7days'}>Last 7 days</option>
              <option value="1month" ?selected=${this._timeRange === '1month'}>Last month</option>
            </select>
          </div>

          <div class="label-group">
            <label>Chat profile:</label>
          </div>

          <div class="dropdown-group profile-dropdown-group">
            <select
              class="time-range-select"
              .value=${this._profileAlias}
              @change=${this.#handleProfileChange}
              ?disabled=${this._profiles.length === 0}
            >
              ${this._profiles.map(
                (p) => html`
                  <option value=${p.alias}>${p.name?.trim() || p.alias}</option>
                `,
              )}
            </select>
          </div>

          ${this._profilesError
            ? html`<span class="profiles-error" title=${this._profilesError}>Profile list unavailable</span>`
            : ''}

          <div class="button-group">
            <uui-button
              look="primary"
              label="Analyze"
              @click=${this.#handleAnalyze}
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

    private renderResults() {
        if (!this._report) return null;

        return html`
      <uui-box headline="Analysis Results">
        <div class="stack">
          <div class="inline">
            <uui-tag>Total logs: ${this._report.totalLogsAnalyzed || 0}</uui-tag>
            <uui-tag>Unique issues: ${this._report.uniqueLogsCount || 0}</uui-tag>
            <uui-tag>Range: ${this._report.timeRange || this._timeRange}</uui-tag>
          </div>
          
          ${this._report.aiSummary ? html`
            <uui-box headline="AI Summary">
              <div class="ai-summary markdown-content">${unsafeHTML(renderAnalysisMarkdown(this._report.aiSummary))}</div>
            </uui-box>
          ` : ''}
          
          ${this._report.logAnalysisItems?.length ? html`
            <div class="logs">
              ${this._report.logAnalysisItems.map((item: any) => html`
                <uui-box>
                  <div class="inline">
                    <uui-badge color="danger">${item.logEntry?.level ?? item.logEntry?.Level ?? 'Unknown'}</uui-badge>
                    <uui-tag>${item.occurrenceCount || 1} occurrences</uui-tag>
                    <uui-badge color="danger">${item.severityAssessment || 'Unknown'}</uui-badge>
                  </div>
                  <p>
                    <strong>${item.logEntry?.timestamp ? new Date(item.logEntry.timestamp).toLocaleString() : 'No timestamp'}</strong>
                  </p>
                  <pre>${item.logEntry?.message || 'No message'}</pre>
                  
                  ${item.likelyCause ? html`
                    <div class="markdown-content">
                      <strong>Likely cause:</strong>
                      <div>${unsafeHTML(renderAnalysisMarkdown(item.likelyCause))}</div>
                    </div>
                  ` : ''}
                  
                  ${item.suggestedFixes?.length ? html`
                    <div class="suggested-fixes markdown-content">
                      <strong>Suggested fixes:</strong>
                      <div>
                        ${item.suggestedFixes.map((fix: string) => html`
                          <div class="fix-item">${unsafeHTML(renderAnalysisMarkdown(fix))}</div>
                        `)}
                      </div>
                    </div>
                  ` : ''}
                </uui-box>
              `)}
            </div>
          ` : html`
            <p class="no-logs">No log entries found for the selected criteria.</p>
          `}
        </div>
      </uui-box>
    `;
    }

    render() {
        return html`
      <div class="container">
        ${this.renderFilters()}
        
        ${this._loading ? html`
          <uui-box>
            <div class="loading-container">
              <uui-loader></uui-loader>
              <p>Analyzing logs...</p>
            </div>
          </uui-box>
        ` : ''}
        
        ${this._error ? html`
          <uui-box headline="Error" color="danger">
            <p>${this._error}</p>
          </uui-box>
        ` : ''}
        
        ${this.renderResults()}
      </div>
    `;
    }

    static styles = [
        analysisMarkdownContentStyles,
        css`
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
  `,
    ];
}

export default UmbracoAIDiagnosticsWorkspaceViewElement;

declare global {
    interface HTMLElementTagNameMap {
        'umbraco-ai-diagnostics-workspace-view': UmbracoAIDiagnosticsWorkspaceViewElement;
    }
}
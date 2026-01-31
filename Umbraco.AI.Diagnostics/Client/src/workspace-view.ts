import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { LitElement, html, css, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbracoAIDiagnosticsRepository } from './repository';
import { unsafeHTML } from '@umbraco-cms/backoffice/external/lit';

@customElement('umbraco-ai-diagnostics-workspace-view')
export class UmbracoAIDiagnosticsWorkspaceViewElement extends UmbElementMixin(LitElement) {

    @state()
    private _loading: boolean = false;

    @state()
    private _error: string = '';

    @state()
    private _report: any = null;

    @state()
    private _criticalChecked: boolean = true;

    @state()
    private _errorChecked: boolean = true;

    @state()
    private _warningChecked: boolean = true;

    @state()
    private _timeRange: string = '1hour';

    #repository?: UmbracoAIDiagnosticsRepository;

    constructor() {
        super();
        this.#repository = new UmbracoAIDiagnosticsRepository(this);
    }

    // Add the markdown rendering function
    private renderMarkdown(text: string): string {
        if (!text) return '';

        let html = text;

        // Code blocks (must be before inline code)
        html = html.replace(/```(\w+)?\r?\n([\s\S]*?)```/g, (_, lang, code) => {
            // Escape HTML in code blocks only
            const escapedCode = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return `<pre><code class="language-${lang || 'plaintext'}">${escapedCode.trim()}</code></pre>`;
        });

        // Inline code
        html = html.replace(/`([^`]+)`/g, (_, code) => {
            const escapedCode = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return `<code>${escapedCode}</code>`;
        });

        // Bold (must be before italic) - NON-GREEDY matching
        html = html.replace(/\*\*([^\*]+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+?)__/g, '<strong>$1</strong>');

        // Italic - NON-GREEDY matching
        html = html.replace(/\*([^\*]+?)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');

        // Strikethrough
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Headers (must be processed before paragraphs)
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

        // Blockquotes
        html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');
        html = html.replace(/^\*\*\*$/gm, '<hr>');

        // Unordered lists - improved handling
        const unorderedListRegex = /(?:^\*\s+.+$\n?)+/gm;
        html = html.replace(unorderedListRegex, (match) => {
            const items = match.split('\n').filter(line => line.trim());
            const listItems = items.map(item => {
                const content = item.replace(/^\*\s+/, '');
                return `<li>${content}</li>`;
            }).join('');
            return `<ul>${listItems}</ul>`;
        });

        // Also handle lists with dashes
        const dashListRegex = /(?:^-\s+.+$\n?)+/gm;
        html = html.replace(dashListRegex, (match) => {
            const items = match.split('\n').filter(line => line.trim());
            const listItems = items.map(item => {
                const content = item.replace(/^-\s+/, '');
                return `<li>${content}</li>`;
            }).join('');
            return `<ul>${listItems}</ul>`;
        });

        // Ordered lists - improved handling
        const orderedListRegex = /(?:^\d+\.\s+.+$\n?)+/gm;
        html = html.replace(orderedListRegex, (match) => {
            const items = match.split('\n').filter(line => line.trim());
            const listItems = items.map(item => {
                const content = item.replace(/^\d+\.\s+/, '');
                return `<li>${content}</li>`;
            }).join('');
            return `<ol>${listItems}</ol>`;
        });

        // Line breaks and paragraphs (do this last)
        html = html.replace(/\n\n+/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');

        // Wrap content in paragraph if it doesn't start with a block element
        if (!html.match(/^<(h[1-6]|ul|ol|pre|blockquote|hr)/)) {
            html = `<p>${html}</p>`;
        }

        // Clean up - remove p tags around block elements
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ol>)/g, '$1');
        html = html.replace(/(<\/ol>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
        html = html.replace(/<p><\/p>/g, '');

        return html;
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
            if (this._criticalChecked) logLevels.push('Critical');
            if (this._errorChecked) logLevels.push('Error');
            if (this._warningChecked) logLevels.push('Warning');

            if (logLevels.length === 0) {
                this._error = 'Please select at least one log level';
                this._loading = false;
                return;
            }

            // Call the repository method with filters
            const result = await this.#repository.analyzeWithFilters(logLevels, this._timeRange);

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

    #handleCriticalChange(e: Event) {
        const checkbox = e.target as HTMLInputElement;
        this._criticalChecked = checkbox.checked;
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

    private renderFilters() {
        return html`
      <uui-box headline="Analysis Filters">
        <div class="filters-container">
          <div class="label-group">
            <label>Log Type:</label>
          </div>
          
          <div class="checkboxes-group">
            <uui-checkbox
              label="Critical"
              .checked=${this._criticalChecked}
              @change=${this.#handleCriticalChange}
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
              <div class="ai-summary markdown-content">${unsafeHTML(this.renderMarkdown(this._report.aiSummary))}</div>
            </uui-box>
          ` : ''}
          
          ${this._report.logAnalysisItems?.length ? html`
            <div class="logs">
              ${this._report.logAnalysisItems.map((item: any) => html`
                <uui-box>
                  <div class="inline">
                    <uui-badge color="danger">${item.logEntry?.level || 'Unknown'}</uui-badge>
                    <uui-tag>${item.occurrenceCount || 1} occurrences</uui-tag>
                    <uui-badge color="danger">${item.logEntry?.severityAssessment || 'Unknown'}</uui-badge>
                  </div>
                  <p>
                    <strong>${item.logEntry?.timestamp ? new Date(item.logEntry.timestamp).toLocaleString() : 'No timestamp'}</strong>
                  </p>
                  <pre>${item.logEntry?.message || 'No message'}</pre>
                  
                  ${item.likelyCause ? html`
                    <div class="markdown-content">
                      <strong>Likely cause:</strong>
                      <div>${unsafeHTML(this.renderMarkdown(item.likelyCause))}</div>
                    </div>
                  ` : ''}
                  
                  ${item.suggestedFixes?.length ? html`
                    <div class="suggested-fixes markdown-content">
                      <strong>Suggested fixes:</strong>
                      <div>
                        ${item.suggestedFixes.map((fix: string) => html`
                          <div class="fix-item">${unsafeHTML(this.renderMarkdown(fix))}</div>
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

    static styles = css`
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
    .inline > uui-badge {
        margin-right: 0px;
        position: inherit;
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
}

export default UmbracoAIDiagnosticsWorkspaceViewElement;

declare global {
    interface HTMLElementTagNameMap {
        'umbraco-ai-diagnostics-workspace-view': UmbracoAIDiagnosticsWorkspaceViewElement;
    }
}
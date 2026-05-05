import type { LogAnalysisModalData, LogAnalysisModalResult } from './log-analysis-modal-token';
import { css, customElement, html, property, state, unsafeHTML } from '@umbraco-cms/backoffice/external/lit';
import { analysisMarkdownContentStyles, renderAnalysisMarkdown } from './analysis-markdown';
import type { PropertyValues } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import type { UmbModalContext } from '@umbraco-cms/backoffice/modal';
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

@customElement('umbraco-ai-log-analysis-modal')
export class UmbracoAILogAnalysisModalElement extends UmbLitElement {
    @property({ attribute: false })
    public modalContext?: UmbModalContext<LogAnalysisModalData, LogAnalysisModalResult>;

    @property({ attribute: false })
    public data?: LogAnalysisModalData;

    @state()
    private _loading = false;

    @state()
    private _error = '';

    @state()
    private _analysisItem: any = null;

    @state()
    private _profileAlias = '';

    @state()
    private _profiles: ChatProfileOptionDto[] = [];

    @state()
    private _profilesError = '';

    #repository = new UmbracoAIDiagnosticsRepository(this);
    #analyzeSeq = 0;

    protected override async firstUpdated(changedProperties: PropertyValues) {
        super.firstUpdated(changedProperties);
        const data = await this.#loadChatProfiles();
        this._profileAlias = pickDefaultChatProfileAlias(data);
        await this.#analyze();
    }

    async #loadChatProfiles(): Promise<ChatProfilesResponse | undefined> {
        this._profilesError = '';
        const result = await this.#repository.getChatProfiles();
        if (result.error) {
            this._profilesError = result.error;
            this._profiles = [];
            return undefined;
        }
        this._profiles = result.data?.profiles ?? [];
        return result.data;
    }

    async #analyze() {
        const logEntry = this.#logEntry;
        if (!logEntry) {
            this._error = 'No log entry was provided for analysis.';
            return;
        }

        const seq = ++this.#analyzeSeq;
        this._loading = true;
        this._error = '';

        try {
            const result = await this.#repository.analyzeLogEntry(logEntry, this._profileAlias);
            if (seq !== this.#analyzeSeq) {
                return;
            }

            if (!result?.data?.analysisItem) {
                this._error = 'The log entry could not be analyzed.';
                this._analysisItem = null;
                return;
            }

            this._analysisItem = result.data.analysisItem;
        } catch (error) {
            if (seq === this.#analyzeSeq) {
                this._error = `Error: ${error}`;
                this._analysisItem = null;
            }
        } finally {
            if (seq === this.#analyzeSeq) {
                this._loading = false;
            }
        }
    }

    #handleProfileChange(e: Event) {
        this._profileAlias = (e.target as HTMLSelectElement).value;
        void this.#analyze();
    }

    #close() {
        this.modalContext?.submit();
    }

    get #logEntry() {
        return this.modalContext?.data?.logEntry ?? this.data?.logEntry;
    }

    #renderProfilePicker() {
        const logEntry = this.#logEntry;
        if (!logEntry) {
            return null;
        }

        return html`
            <uui-box headline="Chat profile">
                <div class="profile-row">
                    <label class="profile-label" for="ai-log-profile-select">Profile</label>
                    <select
                        id="ai-log-profile-select"
                        class="profile-select"
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
                    ? html`<p class="profiles-error" title=${this._profilesError}>Could not load profile list.</p>`
                    : null}
            </uui-box>
        `;
    }

    #renderOriginalLog() {
        const logEntry = this.#logEntry;
        if (!logEntry) {
            return null;
        }

        return html`
            <uui-box headline="Original log entry">
                <dl>
                    <dt>Level</dt>
                    <dd>${logEntry.level}</dd>
                    <dt>Timestamp</dt>
                    <dd>${logEntry.timestamp ? new Date(logEntry.timestamp).toLocaleString() : 'Unknown'}</dd>
                    ${logEntry.logger ? html`<dt>Logger</dt><dd>${logEntry.logger}</dd>` : null}
                </dl>
                <pre>${logEntry.message || 'No message'}</pre>
                ${logEntry.exception ? html`<details><summary>Exception</summary><pre>${logEntry.exception}</pre></details>` : null}
            </uui-box>
        `;
    }

    #renderAnalysis() {
        if (!this._analysisItem) {
            return null;
        }

        return html`
            <uui-box headline="AI analysis">
                <div class="inline">
                    <uui-badge color="danger">${this._analysisItem.logEntry?.level ?? 'Unknown'}</uui-badge>
                    <uui-badge color="warning">${this._analysisItem.severityAssessment ?? 'Unknown severity'}</uui-badge>
                </div>

                ${this._analysisItem.likelyCause ? html`
                    <section>
                        <h4>Likely cause</h4>
                        <div class="markdown-content">
                            ${unsafeHTML(renderAnalysisMarkdown(this._analysisItem.likelyCause))}
                        </div>
                    </section>
                ` : null}

                ${this._analysisItem.suggestedFixes?.length ? html`
                    <section>
                        <h4>Suggested fixes</h4>
                        <ul class="suggested-fixes-list">
                            ${this._analysisItem.suggestedFixes.map(
                                (fix: string) => html`
                                    <li>
                                        <div class="markdown-content">${unsafeHTML(renderAnalysisMarkdown(fix))}</div>
                                    </li>
                                `,
                            )}
                        </ul>
                    </section>
                ` : null}

                ${this._analysisItem.referenceLinks?.length ? html`
                    <section>
                        <h4>Reference links</h4>
                        <ul>
                            ${this._analysisItem.referenceLinks.map((link: string) => html`
                                <li><a href=${link} target="_blank" rel="noopener noreferrer">${link}</a></li>
                            `)}
                        </ul>
                    </section>
                ` : null}
            </uui-box>
        `;
    }

    override render() {
        return html`
            <umb-body-layout headline="AI Log Analysis">
                <div class="content">
                    ${this.#renderOriginalLog()}
                    ${this.#renderProfilePicker()}
                    ${this._loading ? html`
                        <uui-box>
                            <div class="loading">
                                <uui-loader></uui-loader>
                                <p>Analyzing this log entry...</p>
                            </div>
                        </uui-box>
                    ` : null}
                    ${this._error ? html`<uui-box headline="Error" color="danger"><p>${this._error}</p></uui-box>` : null}
                    ${this.#renderAnalysis()}
                </div>
                <uui-button slot="actions" look="secondary" label="Close" @click=${this.#close}>Close</uui-button>
            </umb-body-layout>
        `;
    }

    static override styles = [
        analysisMarkdownContentStyles,
        css`
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
        `,
    ];
}

export default UmbracoAILogAnalysisModalElement;

declare global {
    interface HTMLElementTagNameMap {
        'umbraco-ai-log-analysis-modal': UmbracoAILogAnalysisModalElement;
    }
}

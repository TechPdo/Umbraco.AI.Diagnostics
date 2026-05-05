import { customElement } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { UMBRACO_AI_LOG_ANALYSIS_MODAL, type AIDiagnosticsLogEntry } from './log-analysis-modal-token';

type LogViewerProperty = {
    name: string;
    value?: string | null;
};

type LogViewerMessageElement = HTMLElement & {
    timestamp?: string;
    level?: string;
    messageTemplate?: string | null;
    renderedMessage?: string | null;
    properties?: LogViewerProperty[];
    exception?: string | null;
};

const ANALYZABLE_LEVELS = new Set(['Fatal', 'Error', 'Warning']);
const ENHANCER_TAG = 'umbraco-ai-log-viewer-search-enhancer';
const ANALYZE_BUTTON_CLASS = 'umbraco-ai-diagnostics-analyze-button';
const ACTION_CLASS = 'umbraco-ai-diagnostics-action';
const ACTION_LABEL = 'AI Analysis';

/**
 * Finds elements matching selector across open shadow roots (Lit hosts log rows inside shadow trees).
 */
function queryAllDeep(root: Document | Element | ShadowRoot, selector: string): HTMLElement[] {
    const results: HTMLElement[] = [];
    const container = root instanceof Document ? root.body : root;

    const walk = (node: Element | ShadowRoot) => {
        node.querySelectorAll(selector).forEach((el) => {
            results.push(el as HTMLElement);
        });
        node.querySelectorAll('*').forEach((el) => {
            if (el.shadowRoot) {
                walk(el.shadowRoot);
            }
        });
    };

    walk(container);
    return results;
}

@customElement(ENHANCER_TAG)
class UmbracoAILogViewerSearchEnhancerElement extends UmbLitElement {
    #modalManager?: typeof UMB_MODAL_MANAGER_CONTEXT.TYPE;
    #observer?: MutationObserver;
    #scheduled = 0;

    constructor() {
        super();

        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (instance) => {
            this.#modalManager = instance;
            this.#scheduleEnhance();
        });
    }

    connectedCallback() {
        super.connectedCallback();

        window.addEventListener('changestate', this.#scheduleEnhance);
        window.addEventListener('popstate', this.#scheduleEnhance);

        this.#observer = new MutationObserver(() => this.#scheduleEnhance());
        this.#observer.observe(document.body, { childList: true, subtree: true });

        this.#scheduleEnhance();
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        window.removeEventListener('changestate', this.#scheduleEnhance);
        window.removeEventListener('popstate', this.#scheduleEnhance);
        this.#observer?.disconnect();
        window.clearTimeout(this.#scheduled);
    }

    #scheduleEnhance = () => {
        window.clearTimeout(this.#scheduled);
        this.#scheduled = window.setTimeout(() => this.#enhanceRows(), 100);
    };

    #enhanceRows() {
        if (!this.#isLogViewerSearchRoute()) {
            return;
        }

        const rows = queryAllDeep(document, 'umb-log-viewer-message') as LogViewerMessageElement[];
        for (const row of rows) {
            this.#enhanceRow(row);
        }
    }

    #isLogViewerSearchRoute() {
        const path = window.location.pathname;
        if (path.includes('/section/settings/workspace/logviewer/view/search')) {
            return true;
        }

        return path.includes('logviewer') && path.includes('search');
    }

    #enhanceRow(row: LogViewerMessageElement) {
        if (!row.level || !ANALYZABLE_LEVELS.has(row.level)) {
            return;
        }

        const shadow = row.shadowRoot;
        const summary = shadow?.querySelector('summary');
        if (!shadow || !summary || summary.querySelector(`.${ACTION_CLASS}`)) {
            return;
        }

        const style = document.createElement('style');
        style.textContent = `
            .${ACTION_CLASS} {
                box-sizing: border-box;
                display: flex;
                align-items: center;
                flex: 0 0 auto;
                padding: 10px 20px;
            }

            .${ANALYZE_BUTTON_CLASS} {
                appearance: none;
                -webkit-appearance: none;
                box-sizing: border-box;
                margin: 0;
                flex: 0 0 auto;
                cursor: pointer;
                white-space: nowrap;
                font-family: inherit;
                font-size: var(--uui-size-4, 13px);
                font-weight: 600;
                line-height: 1.2;
                padding: 9px 16px;
                border-radius: var(--uui-border-radius, 3px);
                border: 1px solid var(--uui-color-interactive, #3544b1);
                background-color: var(--uui-color-interactive, #3544b1);
                color: var(--uui-color-interactive-contrast, #ffffff);
                box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
            }

            .${ANALYZE_BUTTON_CLASS}:hover {
                background-color: var(--uui-color-interactive-emphasis, #2b378f);
                border-color: var(--uui-color-interactive-emphasis, #2b378f);
            }

            .${ANALYZE_BUTTON_CLASS}:focus-visible {
                outline: 2px solid var(--uui-color-interactive, #3544b1);
                outline-offset: 2px;
            }

            .${ANALYZE_BUTTON_CLASS}:active {
                transform: translateY(1px);
            }
        `;

        const action = document.createElement('div');
        action.className = ACTION_CLASS;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = ANALYZE_BUTTON_CLASS;
        button.textContent = ACTION_LABEL;

        const stopSummaryToggle = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
        };

        /* Capture mousedown so <details><summary> does not steal focus/toggle */
        button.addEventListener('mousedown', stopSummaryToggle, true);
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.#openAnalysis(row);
        });

        action.append(button);
        shadow.append(style);
        summary.append(action);
    }

    #openAnalysis(row: LogViewerMessageElement) {
        this.#modalManager?.open(this, UMBRACO_AI_LOG_ANALYSIS_MODAL, {
            data: {
                logEntry: this.#toDiagnosticsLogEntry(row),
            },
            modal: {
                size: 'large',
            },
        });
    }

    #toDiagnosticsLogEntry(row: LogViewerMessageElement): AIDiagnosticsLogEntry {
        const properties = this.#propertiesToRecord(row.properties ?? []);

        return {
            timestamp: row.timestamp ?? '',
            level: row.level ?? '',
            message: row.renderedMessage ?? row.messageTemplate ?? '',
            exception: row.exception ?? null,
            logger: properties.SourceContext ?? null,
            properties,
        };
    }

    #propertiesToRecord(properties: LogViewerProperty[]) {
        return properties.reduce<Record<string, string | null>>((acc, property) => {
            if (property.name) {
                acc[property.name] = property.value ?? null;
            }

            return acc;
        }, {});
    }
}

function mountLogViewerSearchEnhancer() {
    if (document.querySelector(ENHANCER_TAG)) {
        return;
    }

    const el = document.createElement(ENHANCER_TAG);
    const attach = () => {
        const app = document.querySelector('umb-app');
        if (app && el.parentNode !== app) {
            app.append(el);
            return true;
        }

        if (!el.isConnected) {
            document.body.append(el);
        }

        return !!document.querySelector('umb-app');
    };

    if (!attach()) {
        const mo = new MutationObserver(() => {
            if (attach()) {
                mo.disconnect();
            }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
    }
}

mountLogViewerSearchEnhancer();

export default UmbracoAILogViewerSearchEnhancerElement;

declare global {
    interface HTMLElementTagNameMap {
        'umbraco-ai-log-viewer-search-enhancer': UmbracoAILogViewerSearchEnhancerElement;
    }
}

import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { LitElement, html, customElement, css } from '@umbraco-cms/backoffice/external/lit';

@customElement('umbraco-ai-diagnostics-tree')
export class UmbracoAIDiagnosticsTreeElement extends UmbElementMixin(LitElement) {

    private _handleClick() {
        // Navigate to the workspace
        const url = '/section/settings/workspace/umbraco-ai-diagnostics-item/view/umbracoai-diagnostics';
        history.pushState(null, '', url);

        // Dispatch a custom event to notify Umbraco router
        window.dispatchEvent(new CustomEvent('umb:navigate', {
            detail: { url }
        }));
    }

    render() {
        return html`
      <uui-menu-item
        label="AI Diagnostics"
        @click=${this._handleClick}
      >
        <uui-icon slot="icon" name="wand"></uui-icon>
      </uui-menu-item>
    `;
    }

    static styles = css`
    :host {
      display: block;
    }
  `;
}

export default UmbracoAIDiagnosticsTreeElement;

declare global {
    interface HTMLElementTagNameMap {
        'umbraco-ai-diagnostics-tree': UmbracoAIDiagnosticsTreeElement;
    }
}
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { LitElement, html, customElement } from '@umbraco-cms/backoffice/external/lit';

@customElement('umbraco-ai-diagnostics-workspace')
export class UmbracoAIDiagnosticsWorkspaceElement extends UmbElementMixin(LitElement) {

    render() {
        return html`
      <umb-workspace-editor
        alias="UmbracoAIDiagnostics.Workspace"
        .headline=${'AI Diagnostics'}
      >
      </umb-workspace-editor>
    `;
    }
}

export default UmbracoAIDiagnosticsWorkspaceElement;

declare global {
    interface HTMLElementTagNameMap {
        'umbraco-ai-diagnostics-workspace': UmbracoAIDiagnosticsWorkspaceElement;
    }
}
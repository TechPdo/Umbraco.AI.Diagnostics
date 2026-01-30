import { UmbElementMixin as r } from "@umbraco-cms/backoffice/element-api";
import { LitElement as l, html as m, css as u, customElement as d } from "@umbraco-cms/backoffice/external/lit";
var b = Object.getOwnPropertyDescriptor, g = (e, n, c, a) => {
  for (var t = a > 1 ? void 0 : a ? b(n, c) : n, s = e.length - 1, o; s >= 0; s--)
    (o = e[s]) && (t = o(t) || t);
  return t;
};
let i = class extends r(l) {
  _handleClick() {
    const e = "/section/settings/workspace/umbraco-ai-diagnostics-item/view/umbracoai-diagnostics";
    history.pushState(null, "", e), window.dispatchEvent(new CustomEvent("umb:navigate", {
      detail: { url: e }
    }));
  }
  render() {
    return m`
      <uui-menu-item
        label="AI Diagnostics"
        @click=${this._handleClick}
      >
        <uui-icon slot="icon" name="wand"></uui-icon>
      </uui-menu-item>
    `;
  }
};
i.styles = u`
    :host {
      display: block;
    }
  `;
i = g([
  d("umbraco-ai-diagnostics-tree")
], i);
const v = i;
export {
  i as UmbracoAIDiagnosticsTreeElement,
  v as default
};
//# sourceMappingURL=tree.js.map

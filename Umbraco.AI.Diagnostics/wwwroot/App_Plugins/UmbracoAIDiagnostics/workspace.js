import { UmbElementMixin as m } from "@umbraco-cms/backoffice/element-api";
import { LitElement as n, html as l, customElement as p } from "@umbraco-cms/backoffice/external/lit";
var b = Object.getOwnPropertyDescriptor, u = (a, o, i, s) => {
  for (var e = s > 1 ? void 0 : s ? b(o, i) : o, r = a.length - 1, c; r >= 0; r--)
    (c = a[r]) && (e = c(e) || e);
  return e;
};
let t = class extends m(n) {
  render() {
    return l`
      <umb-workspace-editor
        alias="UmbracoAIDiagnostics.Workspace"
        .headline=${"Umbraco AI Diagnostics"}
      >
      </umb-workspace-editor>
    `;
  }
};
t = u([
  p("umbraco-ai-diagnostics-workspace")
], t);
const f = t;
export {
  t as UmbracoAIDiagnosticsWorkspaceElement,
  f as default
};
//# sourceMappingURL=workspace.js.map

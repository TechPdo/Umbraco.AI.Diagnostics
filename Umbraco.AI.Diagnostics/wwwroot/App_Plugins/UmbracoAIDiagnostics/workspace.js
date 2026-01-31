import { UmbElementMixin as n } from "@umbraco-cms/backoffice/element-api";
import { LitElement as m, html as l, customElement as p } from "@umbraco-cms/backoffice/external/lit";
var u = Object.getOwnPropertyDescriptor, b = (s, a, i, o) => {
  for (var e = o > 1 ? void 0 : o ? u(a, i) : a, r = s.length - 1, c; r >= 0; r--)
    (c = s[r]) && (e = c(e) || e);
  return e;
};
let t = class extends n(m) {
  render() {
    return l`
      <umb-workspace-editor
        alias="UmbracoAIDiagnostics.Workspace"
        .headline=${"AI Diagnostics"}
      >
      </umb-workspace-editor>
    `;
  }
};
t = b([
  p("umbraco-ai-diagnostics-workspace")
], t);
const f = t;
export {
  t as UmbracoAIDiagnosticsWorkspaceElement,
  f as default
};
//# sourceMappingURL=workspace.js.map

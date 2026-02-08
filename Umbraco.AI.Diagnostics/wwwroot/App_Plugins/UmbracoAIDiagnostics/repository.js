import { UmbControllerBase as r } from "@umbraco-cms/backoffice/class-api";
import { UmbContextToken as i } from "@umbraco-cms/backoffice/context-api";
import { UMB_AUTH_CONTEXT as c } from "@umbraco-cms/backoffice/auth";
const l = "UmbracoAIDiagnostics.Repository";
class A extends r {
  async analyzeWithFilters(e, a) {
    try {
      const s = await (await this.getContext(c))?.getLatestToken(), t = await fetch("/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${s}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          logLevels: e,
          timeRange: a
        })
      });
      if (!t.ok) {
        console.error("Failed to analyze logs:", t.status, t.statusText);
        const n = await t.text();
        console.error("Response body:", n);
        return;
      }
      return { data: await t.json() };
    } catch (o) {
      console.error("Error analyzing logs:", o);
      return;
    }
  }
}
const C = new i(
  l
);
export {
  l as UMBRACO_AI_DIAGNOSTICS_REPOSITORY_ALIAS,
  C as UMBRACO_AI_DIAGNOSTICS_REPOSITORY_CONTEXT,
  A as UmbracoAIDiagnosticsRepository,
  A as default
};
//# sourceMappingURL=repository.js.map

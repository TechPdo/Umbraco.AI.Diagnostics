import { UmbControllerBase as e } from "@umbraco-cms/backoffice/class-api";
import { UmbContextToken as r } from "@umbraco-cms/backoffice/context-api";
const n = "UmbracoAIDiagnostics.Repository";
class y extends e {
  async analyzeWithFilters(t, s) {
    try {
      const o = await fetch("/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          logLevels: t,
          timeRange: s
        })
      });
      if (!o.ok) {
        console.error("Failed to analyze logs:", o.status, o.statusText);
        const a = await o.text();
        console.error("Response body:", a);
        return;
      }
      return { data: await o.json() };
    } catch (o) {
      console.error("Error analyzing logs:", o);
      return;
    }
  }
}
const m = new r(
  n
);
export {
  n as UMBRACO_AI_DIAGNOSTICS_REPOSITORY_ALIAS,
  m as UMBRACO_AI_DIAGNOSTICS_REPOSITORY_CONTEXT,
  y as UmbracoAIDiagnosticsRepository,
  y as default
};
//# sourceMappingURL=repository.js.map

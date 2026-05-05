import { UmbControllerBase as l } from "@umbraco-cms/backoffice/class-api";
import { UmbContextToken as d } from "@umbraco-cms/backoffice/context-api";
import { UMB_AUTH_CONTEXT as c } from "@umbraco-cms/backoffice/auth";
const u = "UmbracoAIDiagnostics.Repository";
class y extends l {
  async analyzeWithFilters(a, s, r) {
    try {
      const t = await (await this.getContext(c))?.getLatestToken(), e = await fetch("/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/analyze", {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          logLevels: a,
          timeRange: s,
          umbracoAiProfileAlias: r
        })
      });
      if (!e.ok) {
        console.error("Failed to analyze logs:", e.status, e.statusText);
        const i = await e.text();
        console.error("Response body:", i);
        return;
      }
      return { data: await e.json() };
    } catch (o) {
      console.error("Error analyzing logs:", o);
      return;
    }
  }
  async getChatProfiles() {
    try {
      const s = await (await this.getContext(c))?.getLatestToken(), r = await fetch("/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/chat-profiles", {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${s}`,
          Accept: "application/json"
        }
      }), o = await r.text();
      if (!r.ok) {
        let t = `${r.status} ${r.statusText}`;
        try {
          const e = JSON.parse(o);
          e?.error && (t = e.error);
        } catch {
          o?.trim() && (t = o.trim().slice(0, 500));
        }
        return { error: t };
      }
      try {
        return { data: o ? JSON.parse(o) : { profiles: [], defaultProfileAlias: null } };
      } catch {
        return { error: "Invalid JSON from chat-profiles." };
      }
    } catch (a) {
      return { error: a instanceof Error ? a.message : String(a) };
    }
  }
  /**
   * @returns `{ data }` on success, `{ error }` when the API responds with an error body or network failure.
   */
  async getLogTrends(a, s) {
    try {
      const o = await (await this.getContext(c))?.getLatestToken(), t = await fetch("/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/log-trends", {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${o}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          logLevels: a,
          timeRange: s
        })
      }), e = await t.text();
      if (!t.ok) {
        let n = `${t.status} ${t.statusText}`;
        try {
          const i = JSON.parse(e);
          i?.error && (n = i.error);
        } catch {
          e?.trim() && (n = e.trim().slice(0, 500));
        }
        return console.error("Failed to load log trends:", n), { error: n };
      }
      try {
        return { data: e ? JSON.parse(e) : {} };
      } catch (n) {
        return console.error("Invalid JSON from log-trends:", n, e?.slice(0, 200)), { error: "The server returned an invalid response for log trends." };
      }
    } catch (r) {
      return console.error("Error loading log trends:", r), { error: r instanceof Error ? r.message : String(r) };
    }
  }
  async analyzeLogEntry(a, s) {
    try {
      const o = await (await this.getContext(c))?.getLatestToken(), t = await fetch("/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/analyze-log-entry", {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${o}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          logEntry: a,
          umbracoAiProfileAlias: s
        })
      });
      if (!t.ok) {
        console.error("Failed to analyze log entry:", t.status, t.statusText);
        const n = await t.text();
        console.error("Response body:", n);
        return;
      }
      return { data: await t.json() };
    } catch (r) {
      console.error("Error analyzing log entry:", r);
      return;
    }
  }
}
const m = new d(
  u
);
export {
  u as UMBRACO_AI_DIAGNOSTICS_REPOSITORY_ALIAS,
  m as UMBRACO_AI_DIAGNOSTICS_REPOSITORY_CONTEXT,
  y as UmbracoAIDiagnosticsRepository,
  y as default
};
//# sourceMappingURL=repository.js.map

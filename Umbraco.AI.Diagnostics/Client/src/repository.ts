import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';

export const UMBRACO_AI_DIAGNOSTICS_REPOSITORY_ALIAS = 'UmbracoAIDiagnostics.Repository';

export interface AnalysisRequest {
    logLevels: string[];
    timeRange: string;
    /** Empty string = Umbraco.AI site default chat profile; omit for legacy appsettings-only behavior. */
    umbracoAiProfileAlias?: string;
}

export interface ChatProfileOptionDto {
    alias: string;
    name: string;
    isDefault: boolean;
}

export interface ChatProfilesResponse {
    profiles: ChatProfileOptionDto[];
    defaultProfileAlias: string | null;
}

export interface SingleLogAnalysisRequest {
    logEntry: unknown;
    /** Empty string = Umbraco.AI site default; omit for legacy appsettings-only behaviour. */
    umbracoAiProfileAlias?: string;
}

export class UmbracoAIDiagnosticsRepository extends UmbControllerBase {

    async analyzeWithFilters(
        logLevels: string[],
        timeRange: string,
        umbracoAiProfileAlias: string,
    ): Promise<{ data: any } | undefined> {
        try {
            const authContext = await this.getContext(UMB_AUTH_CONTEXT);
            const token = await authContext?.getLatestToken();
            // POST endpoint with filters
            const response = await fetch('/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/analyze', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logLevels: logLevels,
                    timeRange: timeRange,
                    umbracoAiProfileAlias,
                } satisfies AnalysisRequest)
            });

            if (!response.ok) {
                console.error('Failed to analyze logs:', response.status, response.statusText);
                const text = await response.text();
                console.error('Response body:', text);
                return undefined;
            }

            const json = await response.json();
            return { data: json };

        } catch (error) {
            console.error('Error analyzing logs:', error);
            return undefined;
        }
    }

    async getChatProfiles(): Promise<{ data?: ChatProfilesResponse; error?: string }> {
        try {
            const authContext = await this.getContext(UMB_AUTH_CONTEXT);
            const token = await authContext?.getLatestToken();
            const response = await fetch('/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/chat-profiles', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            const text = await response.text();
            if (!response.ok) {
                let message = `${response.status} ${response.statusText}`;
                try {
                    const errJson = JSON.parse(text) as { error?: string };
                    if (errJson?.error) {
                        message = errJson.error;
                    }
                } catch {
                    if (text?.trim()) {
                        message = text.trim().slice(0, 500);
                    }
                }

                return { error: message };
            }

            try {
                return { data: text ? (JSON.parse(text) as ChatProfilesResponse) : { profiles: [], defaultProfileAlias: null } };
            } catch {
                return { error: 'Invalid JSON from chat-profiles.' };
            }
        } catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * @returns `{ data }` on success, `{ error }` when the API responds with an error body or network failure.
     */
    async getLogTrends(
        logLevels: string[],
        timeRange: string,
    ): Promise<{ data?: any; error?: string }> {
        try {
            const authContext = await this.getContext(UMB_AUTH_CONTEXT);
            const token = await authContext?.getLatestToken();
            const response = await fetch('/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/log-trends', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logLevels,
                    timeRange,
                }),
            });

            const text = await response.text();

            if (!response.ok) {
                let message = `${response.status} ${response.statusText}`;
                try {
                    const errJson = JSON.parse(text) as { error?: string };
                    if (errJson?.error) {
                        message = errJson.error;
                    }
                } catch {
                    if (text?.trim()) {
                        message = text.trim().slice(0, 500);
                    }
                }

                console.error('Failed to load log trends:', message);
                return { error: message };
            }

            try {
                return { data: text ? JSON.parse(text) : {} };
            } catch (parseErr) {
                console.error('Invalid JSON from log-trends:', parseErr, text?.slice(0, 200));
                return { error: 'The server returned an invalid response for log trends.' };
            }
        } catch (error) {
            console.error('Error loading log trends:', error);
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }

    async analyzeLogEntry(
        logEntry: unknown,
        umbracoAiProfileAlias: string,
    ): Promise<{ data: any } | undefined> {
        try {
            const authContext = await this.getContext(UMB_AUTH_CONTEXT);
            const token = await authContext?.getLatestToken();
            const response = await fetch('/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/analyze-log-entry', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logEntry,
                    umbracoAiProfileAlias,
                } satisfies SingleLogAnalysisRequest)
            });

            if (!response.ok) {
                console.error('Failed to analyze log entry:', response.status, response.statusText);
                const text = await response.text();
                console.error('Response body:', text);
                return undefined;
            }

            const json = await response.json();
            return { data: json };

        } catch (error) {
            console.error('Error analyzing log entry:', error);
            return undefined;
        }
    }
}

export const UMBRACO_AI_DIAGNOSTICS_REPOSITORY_CONTEXT = new UmbContextToken<UmbracoAIDiagnosticsRepository>(
    UMBRACO_AI_DIAGNOSTICS_REPOSITORY_ALIAS
);

export default UmbracoAIDiagnosticsRepository;
import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';

export const UMBRACO_AI_DIAGNOSTICS_REPOSITORY_ALIAS = 'UmbracoAIDiagnostics.Repository';

export interface AnalysisRequest {
    logLevels: string[];
    timeRange: string;
}

export class UmbracoAIDiagnosticsRepository extends UmbControllerBase {

    async analyzeWithFilters(logLevels: string[], timeRange: string): Promise<{ data: any } | undefined> {
        try {
            // POST endpoint with filters
            const response = await fetch('/umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logLevels: logLevels,
                    timeRange: timeRange
                })
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
}

export const UMBRACO_AI_DIAGNOSTICS_REPOSITORY_CONTEXT = new UmbContextToken<UmbracoAIDiagnosticsRepository>(
    UMBRACO_AI_DIAGNOSTICS_REPOSITORY_ALIAS
);

export default UmbracoAIDiagnosticsRepository;
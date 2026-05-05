import { UmbModalToken } from '@umbraco-cms/backoffice/modal';

export interface AIDiagnosticsLogEntry {
    timestamp: string;
    level: string;
    message?: string | null;
    exception?: string | null;
    logger?: string | null;
    properties?: Record<string, string | null>;
}

export interface LogAnalysisModalData {
    logEntry: AIDiagnosticsLogEntry;
}

export interface LogAnalysisModalResult {
    completed: boolean;
}

export const UMBRACO_AI_LOG_ANALYSIS_MODAL_ALIAS = 'UmbracoAIDiagnostics.Modal.LogAnalysis';

export const UMBRACO_AI_LOG_ANALYSIS_MODAL = new UmbModalToken<
    LogAnalysisModalData,
    LogAnalysisModalResult
>(UMBRACO_AI_LOG_ANALYSIS_MODAL_ALIAS, {
    modal: {
        size: 'large',
    },
});

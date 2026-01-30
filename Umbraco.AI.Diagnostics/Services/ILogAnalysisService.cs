using Umbraco.AI.Diagnostics.Models;

namespace Umbraco.AI.Diagnostics.Services;

/// <summary>
/// Service interface for analyzing Umbraco log files.
/// </summary>
public interface ILogAnalysisService
{
    /// <summary>
    /// Analyzes logs based on the specified criteria and generates a comprehensive report.
    /// </summary>
    /// <param name="logLevels">The log levels to analyze (e.g., Error, Critical, Warning).</param>
    /// <param name="timeRange">The time range filter for logs (e.g., "1hour", "24hours", "7days").</param>
    /// <param name="cancellationToken">Cancellation token for the async operation.</param>
    /// <returns>An analysis report containing diagnostics information.</returns>
    Task<AnalysisReport> AnalyzeLogsAsync(
        List<string> logLevels,
        string timeRange,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves log entries from the Umbraco log files based on filters.
    /// </summary>
    /// <param name="logLevels">The log levels to retrieve.</param>
    /// <param name="timeRange">The time range filter.</param>
    /// <param name="cancellationToken">Cancellation token for the async operation.</param>
    /// <returns>A list of log entries matching the criteria.</returns>
    Task<List<LogEntry>> GetLogEntriesAsync(
        List<string> logLevels,
        string timeRange,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes duplicate log entries based on their content.
    /// </summary>
    /// <param name="logs">The list of log entries to deduplicate.</param>
    /// <returns>A deduplicated list of log entries with occurrence counts.</returns>
    Dictionary<string, (LogEntry Log, int Count)> DeduplicateLogs(List<LogEntry> logs);
}
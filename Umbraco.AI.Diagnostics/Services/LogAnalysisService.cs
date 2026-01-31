using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Serilog.Core;
using System;
using System.Globalization;
using System.Text;
using System.Text.Json;
using Umbraco.AI.Diagnostics.AI;
using Umbraco.AI.Diagnostics.Models;
using Umbraco.Cms.Core.Services;

namespace Umbraco.AI.Diagnostics.Services;

/// <summary>
/// Service for analyzing Umbraco log files with AI-powered diagnostics.
/// </summary>
public class LogAnalysisService : ILogAnalysisService
{
    private readonly IAIClient _aiClient;
    private readonly DiagnosticsOptions _options;
    private readonly ILogger<LogAnalysisService> _logger;
    private readonly IWebHostEnvironment _env;
    private readonly ILogViewerService _logViewerService;

    /// <summary>
    /// Initializes a new instance of the <see cref="LogAnalysisService"/> class.
    /// </summary>
    /// <param name="aiClient">AI client for generating summaries.</param>
    /// <param name="options">Diagnostics configuration options.</param>
    /// <param name="logger">Logger instance.</param>
    public LogAnalysisService(
        IAIClient aiClient,
        IOptions<DiagnosticsOptions> options,
        ILogger<LogAnalysisService> logger,
        ILogViewerService logViewerService,
        IWebHostEnvironment env)
    {
        _aiClient = aiClient;
        _options = options.Value;
        _logger = logger;
        _env = env;
        _logViewerService = logViewerService;
    }

    /// <inheritdoc/>
    public async Task<AnalysisReport> AnalyzeLogsAsync(
        List<string> logLevels,
        string timeRange,
        CancellationToken cancellationToken = default)
    {
        var report = new AnalysisReport
        {
            AnalysisTimestamp = DateTime.UtcNow,
            AnalyzedLogLevels = logLevels,
            TimeRange = timeRange,
            AIEnabled = _options.EnableAI
        };

        try
        {
            // Get log entries
            var logs = await GetLogEntriesAsync(logLevels, timeRange, cancellationToken);
            report.TotalLogsAnalyzed = logs.Count;

            if (logs.Count == 0)
            {
                _logger.LogInformation("No logs found matching criteria");
                return report;
            }

            // Deduplicate logs
            var deduplicated = DeduplicateLogs(logs);
            report.UniqueLogsCount = deduplicated.Count;

            // Process in batches if needed
            var batches = CreateBatches(deduplicated, _options.MaxBatchSize);

            foreach (var batch in batches)
            {
                await ProcessBatchAsync(batch, report, cancellationToken);
            }

            _logger.LogInformation(
                "Completed analysis: {Total} total logs, {Unique} unique, {Items} analysis items",
                report.TotalLogsAnalyzed,
                report.UniqueLogsCount,
                report.LogAnalysisItems.Count);

            return report;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during log analysis");
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<List<LogEntry>> GetLogEntriesAsync(
        List<string> logLevels,
        string timeRange,
        CancellationToken cancellationToken = default)
    {
        var logs = new List<LogEntry>();
        var cutoffTime = GetCutoffTime(timeRange);

        try
        {
            var systemLogs = await _logViewerService.GetPagedLogsAsync(cutoffTime, DateTime.Now, 0, 10000, Cms.Core.Direction.Descending, null, logLevels.ToArray());
            if(systemLogs.Result != null)
            {
                foreach (var log in systemLogs.Result.Items)
                {
                    var logEntry = new LogEntry
                    {
                        Timestamp = log.Timestamp.ToLocalTime().DateTime,
                        Level = log.Level.ToString(),
                        Message = log.RenderedMessage,
                        Exception = log.Exception,
                        Properties = log.Properties != null && log.Properties.Any() ? new Dictionary<string, string?>(log.Properties) : null
                    };
                    logs.Add(logEntry);
                }
            }
            _logger.LogInformation("Retrieved {Count} log entries on {datetime} files", logs.Count, DateTime.UtcNow);
            return logs;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving log entries");
            return logs;
        }
    }

    /// <inheritdoc/>
    public Dictionary<string, (LogEntry Log, int Count)> DeduplicateLogs(List<LogEntry> logs)
    {
        var grouped = new Dictionary<string, (LogEntry Log, int Count)>();

        foreach (var log in logs)
        {
            var key = log.GetDeduplicationKey();

            if (grouped.ContainsKey(key))
            {
                grouped[key] = (grouped[key].Log, grouped[key].Count + 1);
            }
            else
            {
                grouped[key] = (log, 1);
            }
        }

        _logger.LogInformation("Deduplicated {Original} logs to {Unique} unique entries", logs.Count, grouped.Count);
        return grouped;
    }

    private async Task ProcessBatchAsync(
        Dictionary<string, (LogEntry Log, int Count)> batch,
        AnalysisReport report,
        CancellationToken cancellationToken)
    {
        if (!_options.EnableAI || !_aiClient.IsConfigured())
        {
            // Add logs without AI analysis
            foreach (var kvp in batch)
            {
                report.LogAnalysisItems.Add(new LogAnalysisItem
                {
                    LogEntry = kvp.Value.Log,
                    OccurrenceCount = kvp.Value.Count
                });
            }
            return;
        }

        // Prepare input for AI
        var logDataBuilder = new StringBuilder();
        logDataBuilder.AppendLine("=== LOG ENTRIES FOR ANALYSIS ===");

        foreach (var kvp in batch)
        {
            logDataBuilder.AppendLine($"[Occurrences: {kvp.Value.Count}]");
            logDataBuilder.AppendLine(kvp.Value.Log.ToAnalysisString());
            logDataBuilder.AppendLine();
        }

        // Get AI analysis
        var aiResponse = await _aiClient.GenerateSummaryAsync(
            logDataBuilder.ToString(),
            cancellationToken);

        // Parse AI response
        ParseAIResponse(aiResponse, batch, report);
    }

    private void ParseAIResponse(
        string aiResponse,
        Dictionary<string, (LogEntry Log, int Count)> batch,
        AnalysisReport report)
    {
        try
        {
            var jsonDoc = JsonDocument.Parse(aiResponse);
            var root = jsonDoc.RootElement;

            // Extract overall summary if present
            if (root.TryGetProperty("overallSummary", out var summaryElement))
            {
                report.AISummary = summaryElement.GetString();
            }

            // Extract individual items
            if (root.TryGetProperty("items", out var itemsElement) && itemsElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in itemsElement.EnumerateArray())
                {
                    var analysisItem = new LogAnalysisItem();

                    // Find matching log entry
                    var logMessage = item.GetProperty("logMessage").GetString();
                    var matchingLog = batch.Values.FirstOrDefault(l =>
                        l.Log.Message.Contains(logMessage ?? "", StringComparison.OrdinalIgnoreCase));

                    var logDate = item.GetProperty("logDate").GetString();

                    analysisItem.LogEntry = matchingLog.Log ?? new LogEntry { Message = logMessage ?? "", Timestamp = !string.IsNullOrEmpty(logDate) ? DateTime.Parse(logDate) : DateTime.MinValue };
                    analysisItem.OccurrenceCount = matchingLog.Count;

                    if (item.TryGetProperty("likelyCause", out var cause))
                        analysisItem.LikelyCause = cause.GetString();

                    if (item.TryGetProperty("suggestedFixes", out var fixes) && fixes.ValueKind == JsonValueKind.Array)
                        analysisItem.SuggestedFixes = fixes.EnumerateArray()
                            .Select(f => f.GetString() ?? "")
                            .Where(f => !string.IsNullOrEmpty(f))
                            .ToList();

                    if (item.TryGetProperty("referenceLinks", out var links) && links.ValueKind == JsonValueKind.Array)
                        analysisItem.ReferenceLinks = links.EnumerateArray()
                            .Select(l => l.GetString() ?? "")
                            .Where(l => !string.IsNullOrEmpty(l))
                            .ToList();

                    if (item.TryGetProperty("severityAssessment", out var severity))
                        analysisItem.SeverityAssessment = severity.GetString();

                    report.LogAnalysisItems.Add(analysisItem);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing AI response. Raw response: {Response}", aiResponse);

            foreach (var kvp in batch)
            {
                report.LogAnalysisItems.Add(new LogAnalysisItem
                {
                    LogEntry = kvp.Value.Log,
                    OccurrenceCount = kvp.Value.Count
                });
            }
        }
    }

    private DateTime GetCutoffTime(string timeRange)
    {
        var now = DateTime.UtcNow;

        return timeRange.ToLowerInvariant() switch
        {
            "1hour" => now.AddHours(-1),
            "2hours" => now.AddHours(-2),
            "24hours" => now.AddHours(-24),
            "7days" => now.AddDays(-7),
            "1month" => now.AddMonths(-1),
            _ => now.AddHours(-1) // default to 1 hour
        };
    }

    private List<Dictionary<string, (LogEntry Log, int Count)>> CreateBatches(
        Dictionary<string, (LogEntry Log, int Count)> logs,
        int batchSize)
    {
        var batches = new List<Dictionary<string, (LogEntry Log, int Count)>>();
        var currentBatch = new Dictionary<string, (LogEntry Log, int Count)>();

        foreach (var kvp in logs)
        {
            currentBatch[kvp.Key] = kvp.Value;

            if (currentBatch.Count >= batchSize)
            {
                batches.Add(currentBatch);
                currentBatch = new Dictionary<string, (LogEntry Log, int Count)>();
            }
        }

        if (currentBatch.Count > 0)
        {
            batches.Add(currentBatch);
        }

        return batches;
    }
}
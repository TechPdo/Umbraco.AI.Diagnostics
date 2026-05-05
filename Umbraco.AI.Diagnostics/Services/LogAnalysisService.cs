using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
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
        string? umbracoAiProfileAlias = null,
        CancellationToken cancellationToken = default)
    {
        var viewerLogLevels = NormalizeLogLevelsForUmbracoViewer(logLevels);
        var report = new AnalysisReport
        {
            AnalysisTimestamp = DateTime.UtcNow,
            AnalyzedLogLevels = viewerLogLevels,
            TimeRange = timeRange,
            AIEnabled = _options.EnableAI
        };

        try
        {
            // Get log entries
            var logs = await GetLogEntriesAsync(viewerLogLevels, timeRange, cancellationToken);
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
                await ProcessBatchAsync(batch, report, umbracoAiProfileAlias, cancellationToken);
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
    public async Task<SingleLogAnalysisResponse> AnalyzeSingleLogEntryAsync(
        LogEntry logEntry,
        string? umbracoAiProfileAlias = null,
        CancellationToken cancellationToken = default)
    {
        var response = new SingleLogAnalysisResponse
        {
            AIEnabled = _options.EnableAI,
            AnalysisItem = new LogAnalysisItem
            {
                LogEntry = logEntry,
                OccurrenceCount = 1
            }
        };

        if (!_options.EnableAI)
        {
            return response;
        }

        try
        {
            var batch = new Dictionary<string, (LogEntry Log, int Count)>
            {
                [logEntry.GetDeduplicationKey()] = (logEntry, 1)
            };

            var aiResponse = await _aiClient.GenerateSummaryAsync(
                BuildSingleLogAnalysisInput(logEntry),
                umbracoAiProfileAlias,
                cancellationToken);

            var report = new AnalysisReport();
            ParseAIResponse(aiResponse, batch, report);

            response.AnalysisItem = report.LogAnalysisItems.FirstOrDefault()
                ?? TryParseSingleObjectAnalysis(aiResponse, logEntry)
                ?? BuildSingleLogAnalysisFallback(logEntry, aiResponse);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during single log analysis");
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
            var viewerLevels = NormalizeLogLevelsForUmbracoViewer(logLevels).ToArray();
            var systemLogs = await _logViewerService.GetPagedLogsAsync(cutoffTime, DateTime.Now, 0, 10000, Cms.Core.Direction.Descending, null, viewerLevels);
            if(systemLogs.Result != null)
            {
                foreach (var log in systemLogs.Result.Items)
                {
                    var logEntry = new LogEntry
                    {
                        Timestamp = log.Timestamp.ToLocalTime().DateTime,
                        Level = ResolveDisplayLogLevel(log),
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
    public async Task<LogTrendReport> GetLogTrendsAsync(
        List<string> logLevels,
        string timeRange,
        CancellationToken cancellationToken = default)
    {
        var range = string.IsNullOrWhiteSpace(timeRange) ? "1hour" : timeRange;
        var viewerLevels = NormalizeLogLevelsForUmbracoViewer(logLevels)
            .Select(NormalizeLogLevelName)
            .Where(static l => !string.IsNullOrWhiteSpace(l))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (viewerLevels.Count == 0)
        {
            return new LogTrendReport
            {
                TimeRange = range,
                TrendSummary = "No valid log levels were provided.",
            };
        }

        var report = new LogTrendReport
        {
            TimeRange = range,
            AnalyzedLogLevels = viewerLevels,
        };

        var logs = await GetLogEntriesAsync(viewerLevels, range, cancellationToken);
        var cutoffUtc = GetCutoffTime(range);
        var endUtc = DateTime.UtcNow;
        var (bucketCount, step) = GetTrendBucketPlan(range);

        var buckets = new List<LogTrendBucket>();
        for (var i = 0; i < bucketCount; i++)
        {
            var start = cutoffUtc.AddTicks(step.Ticks * i);
            var end = i == bucketCount - 1 ? endUtc : start.Add(step);
            var counts = viewerLevels.ToDictionary(static l => l, static _ => 0);

            buckets.Add(new LogTrendBucket
            {
                BucketStartUtc = start,
                BucketEndUtc = end,
                Label = FormatTrendBucketLabel(range, start),
                CountsByLevel = counts,
            });
        }

        foreach (var log in logs)
        {
            var utc = ToUtcForTrending(log.Timestamp);
            if (utc < cutoffUtc || utc > endUtc)
            {
                continue;
            }

            var ticksFromStart = utc.Ticks - cutoffUtc.Ticks;
            var idx = (int)(ticksFromStart / step.Ticks);
            if (idx < 0)
            {
                idx = 0;
            }

            if (idx >= bucketCount)
            {
                idx = bucketCount - 1;
            }

            var bucket = buckets[idx];
            var level = NormalizeLogLevelName(log.Level ?? string.Empty);
            if (!bucket.CountsByLevel.ContainsKey(level))
            {
                bucket.CountsByLevel[level] = 0;
            }

            bucket.CountsByLevel[level]++;
            bucket.Total++;
        }

        report.Buckets = buckets;
        report.GrandTotal = logs.Count;
        report.TotalsByLevel = viewerLevels.ToDictionary(static l => l, static _ => 0);

        foreach (var log in logs)
        {
            var level = NormalizeLogLevelName(log.Level ?? string.Empty);
            if (report.TotalsByLevel.ContainsKey(level))
            {
                report.TotalsByLevel[level]++;
            }
            else
            {
                report.TotalsByLevel[level] = 1;
            }
        }

        ApplyTrendSemantics(report);
        return report;
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

    private static string BuildSingleLogAnalysisInput(LogEntry logEntry)
    {
        var builder = new StringBuilder();
        builder.AppendLine("=== SINGLE LOG ENTRY FOR ANALYSIS ===");
        builder.AppendLine("[Occurrences: 1]");
        builder.AppendLine(logEntry.ToAnalysisString());

        if (logEntry.Properties is { Count: > 0 })
        {
            builder.AppendLine();
            builder.AppendLine("Properties:");
            foreach (var property in logEntry.Properties)
            {
                builder.AppendLine($"{property.Key}: {property.Value}");
            }
        }

        builder.AppendLine();
        builder.AppendLine("Analyze only this one log entry. Return exactly one item in the JSON items array.");
        builder.AppendLine("Copy the log level from the bracketed level in the log line into items[0].logLevel.");

        return builder.ToString();
    }

    private static LogAnalysisItem BuildSingleLogAnalysisFallback(LogEntry logEntry, string aiResponse)
    {
        var item = new LogAnalysisItem
        {
            LogEntry = logEntry,
            OccurrenceCount = 1,
            LikelyCause = "AI analysis did not return an item for this log entry."
        };

        try
        {
            using var jsonDoc = JsonDocument.Parse(aiResponse);
            if (jsonDoc.RootElement.TryGetProperty("error", out var error) && error.ValueKind == JsonValueKind.String)
            {
                item.LikelyCause = error.GetString();
            }
        }
        catch
        {
            // Keep the generic fallback if the response was not JSON.
        }

        return item;
    }

    private static LogAnalysisItem? TryParseSingleObjectAnalysis(string aiResponse, LogEntry logEntry)
    {
        try
        {
            using var jsonDoc = JsonDocument.Parse(aiResponse);
            var root = jsonDoc.RootElement;

            if (root.ValueKind != JsonValueKind.Object || root.TryGetProperty("items", out _))
            {
                return null;
            }

            var hasAnalysis =
                root.TryGetProperty("likelyCause", out _) ||
                root.TryGetProperty("suggestedFixes", out _) ||
                root.TryGetProperty("severityAssessment", out _);

            if (!hasAnalysis)
            {
                return null;
            }

            var item = new LogAnalysisItem
            {
                LogEntry = logEntry,
                OccurrenceCount = 1
            };

            if (root.TryGetProperty("likelyCause", out var cause))
            {
                item.LikelyCause = cause.GetString();
            }

            if (root.TryGetProperty("suggestedFixes", out var fixes) && fixes.ValueKind == JsonValueKind.Array)
            {
                item.SuggestedFixes = fixes.EnumerateArray()
                    .Select(f => f.GetString() ?? string.Empty)
                    .Where(f => !string.IsNullOrEmpty(f))
                    .ToList();
            }

            if (root.TryGetProperty("referenceLinks", out var links) && links.ValueKind == JsonValueKind.Array)
            {
                item.ReferenceLinks = links.EnumerateArray()
                    .Select(l => l.GetString() ?? string.Empty)
                    .Where(l => !string.IsNullOrEmpty(l))
                    .ToList();
            }

            if (root.TryGetProperty("severityAssessment", out var severity))
            {
                item.SeverityAssessment = severity.GetString();
            }

            return item;
        }
        catch
        {
            return null;
        }
    }

    private async Task ProcessBatchAsync(
        Dictionary<string, (LogEntry Log, int Count)> batch,
        AnalysisReport report,
        string? umbracoAiProfileAlias,
        CancellationToken cancellationToken)
    {
        if (!_options.EnableAI)
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
            umbracoAiProfileAlias,
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

                    item.TryGetProperty("logMessage", out var logMessageEl);
                    var logMessage = logMessageEl.ValueKind == JsonValueKind.String ? logMessageEl.GetString() : null;

                    item.TryGetProperty("logDate", out var logDateEl);
                    var logDate = logDateEl.ValueKind == JsonValueKind.String ? logDateEl.GetString() : null;

                    var match = FindBestBatchMatchForAiItem(logMessage, batch);
                    if (match is { } matched)
                    {
                        analysisItem.LogEntry = matched.Log;
                        analysisItem.OccurrenceCount = matched.Count;
                    }
                    else
                    {
                        var levelFromAi = TryReadLogLevelFromAiItem(item);
                        analysisItem.LogEntry = new LogEntry
                        {
                            Level = string.IsNullOrEmpty(levelFromAi) ? "Unknown" : levelFromAi,
                            Message = logMessage ?? string.Empty,
                            Timestamp = !string.IsNullOrEmpty(logDate) && DateTime.TryParse(logDate, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsed)
                                ? parsed
                                : DateTime.MinValue
                        };
                        analysisItem.OccurrenceCount = 1;
                    }

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

    /// <summary>
    /// Maps an AI <c>items[]</c> entry back to a deduplicated log when the model shortens or reformats <c>logMessage</c>.
    /// </summary>
    private static (LogEntry Log, int Count)? FindBestBatchMatchForAiItem(
        string? logMessage,
        Dictionary<string, (LogEntry Log, int Count)> batch)
    {
        if (batch.Count == 0)
        {
            return null;
        }

        var lm = logMessage?.Trim() ?? string.Empty;
        if (lm.Length == 0)
        {
            return null;
        }

        var lmNorm = CollapseLogWhitespace(lm);

        (LogEntry Log, int Count)? best = null;
        var bestScore = int.MaxValue;

        foreach (var v in batch.Values)
        {
            var log = v.Log;
            var msg = log.Message;
            if (string.IsNullOrEmpty(msg))
            {
                continue;
            }

            int? score = null;

            if (msg.Contains(lm, StringComparison.OrdinalIgnoreCase))
            {
                score = Math.Abs(msg.Length - lm.Length);
            }

            if (lm.Length >= 12 && msg.Length >= 12)
            {
                var prefixLen = Math.Min(200, msg.Length);
                var prefix = msg[..prefixLen];
                if (lm.Contains(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    var loose = Math.Abs(msg.Length - lm.Length) + 200;
                    score = score.HasValue ? Math.Min(score.Value, loose) : loose;
                }
            }

            var msgNorm = CollapseLogWhitespace(msg);
            if (lmNorm.Length > 0 && msgNorm.Contains(lmNorm, StringComparison.OrdinalIgnoreCase))
            {
                var normScore = Math.Abs(msgNorm.Length - lmNorm.Length) + 1;
                score = score.HasValue ? Math.Min(score.Value, normScore) : normScore;
            }

            if (score is int s && s < bestScore)
            {
                bestScore = s;
                best = (log, v.Count);
            }
        }

        return best;
    }

    private static string CollapseLogWhitespace(string s) =>
        Regex.Replace(s.Trim(), @"\s+", " ", RegexOptions.None, TimeSpan.FromMilliseconds(250));

    private static string? TryReadLogLevelFromAiItem(JsonElement item)
    {
        foreach (var name in new[] { "logLevel", "LogLevel", "level" })
        {
            if (!item.TryGetProperty(name, out var el) || el.ValueKind != JsonValueKind.String)
            {
                continue;
            }

            var raw = el.GetString();
            if (string.IsNullOrWhiteSpace(raw))
            {
                continue;
            }

            var normalized = NormalizeLogLevelName(raw.Trim());
            return string.IsNullOrEmpty(normalized) ? null : normalized;
        }

        return null;
    }

    /// <summary>
    /// Umbraco file logs often omit Serilog <c>@l</c> and only include <c>Log4NetLevel</c> (e.g. "INFO ", "WARN ").
    /// <see cref="ILogEntry.Level"/> can then be wrong; prefer structured properties when present.
    /// </summary>
    private static string ResolveDisplayLogLevel(Umbraco.Cms.Core.Logging.Viewer.ILogEntry log)
    {
        if (log.Properties is { Count: > 0 } props)
        {
            if (TryGetPropertyIgnoreCase(props, "@l", out var atL) && !string.IsNullOrWhiteSpace(atL))
            {
                return NormalizeLogLevelName(atL);
            }

            if (TryGetPropertyIgnoreCase(props, "Log4NetLevel", out var l4) && !string.IsNullOrWhiteSpace(l4))
            {
                return MapLog4NetLevelToken(l4);
            }

            if (TryGetPropertyIgnoreCase(props, "Level", out var levelProp) && !string.IsNullOrWhiteSpace(levelProp))
            {
                return NormalizeLogLevelName(levelProp);
            }
        }

        return log.Level.ToString();
    }

    private static bool TryGetPropertyIgnoreCase(
        IReadOnlyDictionary<string, string?> props,
        string key,
        out string value)
    {
        foreach (var kv in props)
        {
            if (string.Equals(kv.Key, key, StringComparison.OrdinalIgnoreCase))
            {
                value = kv.Value ?? string.Empty;
                return true;
            }
        }

        value = string.Empty;
        return false;
    }

    /// <summary>
    /// Maps values from Umbraco JSON logs (Log4NetLevel) to names aligned with <see cref="Umbraco.Cms.Core.Logging.LogLevel"/>.
    /// </summary>
    private static string MapLog4NetLevelToken(string raw)
    {
        var token = raw.Trim().TrimEnd('.').ToUpperInvariant();
        return token switch
        {
            "VERBOSE" or "TRACE" or "VRB" => "Verbose",
            "DEBUG" or "DBG" => "Debug",
            "INFO" or "INFORMATION" => "Information",
            "WARN" or "WARNING" => "Warning",
            "ERROR" or "ERR" => "Error",
            "FATAL" or "FTL" or "CRITICAL" => "Fatal",
            _ => NormalizeLogLevelName(raw)
        };
    }

    private static string NormalizeLogLevelName(string raw)
    {
        var key = raw.Trim();
        if (string.IsNullOrEmpty(key))
        {
            return string.Empty;
        }

        return key.ToUpperInvariant() switch
        {
            "VERBOSE" or "TRACE" => "Verbose",
            "DEBUG" => "Debug",
            "INFORMATION" or "INFO" => "Information",
            "WARNING" or "WARN" => "Warning",
            "ERROR" or "ERR" => "Error",
            "FATAL" or "FTL" or "CRITICAL" => "Fatal",
            _ => char.ToUpperInvariant(key[0]) + key.Substring(1)
        };
    }

    /// <summary>
    /// Maps request/config values to names accepted by <see cref="ILogViewerService"/> (Serilog / Umbraco use <c>Fatal</c>, not <c>Critical</c>).
    /// </summary>
    private static List<string> NormalizeLogLevelsForUmbracoViewer(IEnumerable<string> logLevels) =>
        logLevels
            .Where(static l => !string.IsNullOrWhiteSpace(l))
            .Select(static l =>
            {
                var t = l.Trim();
                return t.Equals("Critical", StringComparison.OrdinalIgnoreCase) ? "Fatal" : t;
            })
            .ToList();

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

    private static (int BucketCount, TimeSpan Step) GetTrendBucketPlan(string timeRange) =>
        timeRange.ToLowerInvariant() switch
        {
            "1hour" => (12, TimeSpan.FromMinutes(5)),
            "2hours" => (12, TimeSpan.FromMinutes(10)),
            "24hours" => (24, TimeSpan.FromHours(1)),
            "7days" => (7, TimeSpan.FromDays(1)),
            "1month" => (30, TimeSpan.FromDays(1)),
            _ => (12, TimeSpan.FromMinutes(5)),
        };

    private static string FormatTrendBucketLabel(string timeRange, DateTime bucketStartUtc) =>
        timeRange.ToLowerInvariant() switch
        {
            "1hour" or "2hours" => bucketStartUtc.ToString("HH:mm", CultureInfo.InvariantCulture),
            "24hours" => bucketStartUtc.ToString("MM/dd HH:mm", CultureInfo.InvariantCulture),
            "7days" or "1month" => bucketStartUtc.ToString("MM/dd", CultureInfo.InvariantCulture),
            _ => bucketStartUtc.ToString("g", CultureInfo.InvariantCulture),
        };

    private static DateTime ToUtcForTrending(DateTime timestamp) =>
        timestamp.Kind switch
        {
            DateTimeKind.Utc => timestamp,
            DateTimeKind.Local => timestamp.ToUniversalTime(),
            _ => DateTime.SpecifyKind(timestamp, DateTimeKind.Local).ToUniversalTime(),
        };

    private static void ApplyTrendSemantics(LogTrendReport report)
    {
        var buckets = report.Buckets;
        if (buckets.Count < 2)
        {
            report.TrendDirection = "stable";
            report.TrendSummary = "Not enough timeline data to compare halves.";
            return;
        }

        var mid = buckets.Count / 2;
        var first = buckets.Take(mid).Sum(static b => b.Total);
        var second = buckets.Skip(mid).Sum(static b => b.Total);

        if (second > first * 1.15 && second > first)
        {
            report.TrendDirection = "up";
            report.TrendSummary =
                $"Activity increased in the second half of the period ({second} vs {first} log entries).";
        }
        else if (first > second * 1.15 && first > second)
        {
            report.TrendDirection = "down";
            report.TrendSummary =
                $"Activity decreased in the second half of the period ({second} vs {first} log entries).";
        }
        else
        {
            report.TrendDirection = "stable";
            report.TrendSummary = first == 0 && second == 0
                ? "No log entries in this period for the selected levels."
                : "Activity is fairly steady across the selected period.";
        }
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
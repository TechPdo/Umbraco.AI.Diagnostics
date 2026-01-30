using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Text;
using System.Text.Json;
using Umbraco.AI.Diagnostics.AI;
using Umbraco.AI.Diagnostics.Models;

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
        IWebHostEnvironment env)
    {
        _aiClient = aiClient;
        _options = options.Value;
        _logger = logger;
        _env = env;
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
            // Get Umbraco log directory
            var logDirectory = Path.Combine(_env.ContentRootPath, "umbraco", "Logs");

            if (!Directory.Exists(logDirectory))
            {
                _logger.LogWarning("Log directory not found: {Directory}", logDirectory);
                return logs;
            }

            // Get all log files in the directory
            var logFiles = Directory.GetFiles(logDirectory, "*.json")
                .OrderByDescending(f => File.GetLastWriteTime(f))
                .ToList();

            foreach (var logFile in logFiles)
            {
                var fileEntries = await ParseLogFileAsync(logFile, logLevels, cutoffTime, cancellationToken);
                logs.AddRange(fileEntries);
            }

            _logger.LogInformation("Retrieved {Count} log entries from {FileCount} files", logs.Count, logFiles.Count);
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

    private async Task<List<LogEntry>> ParseLogFileAsync(string filePath, List<string> logLevels, DateTime cutoffTime, CancellationToken cancellationToken)
    {
        var entries = new List<LogEntry>();
        const int maxRetries = 3;
        for (int attempt = 0; attempt <= maxRetries; attempt++)
        {
            try
            {
                using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                using var sr = new StreamReader(fs, Encoding.UTF8);
                string? line;
                while ((line = await sr.ReadLineAsync().ConfigureAwait(false)) != null)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    var entry = ParseLogLine(line);
                    if (entry != null && logLevels.Contains(entry.Level, StringComparer.OrdinalIgnoreCase) && entry.Timestamp >= cutoffTime)
                        entries.Add(entry);
                }
                return entries;
            }
            catch (IOException) when (attempt < maxRetries)
            {
                await Task.Delay(200, cancellationToken).ConfigureAwait(false);
                continue;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error parsing log file: {FilePath}", filePath);
                return entries;
            }
        }
        return entries;
    }

    private LogEntry? ParseLogLine(string line)
    {
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true,
                ReadCommentHandling = JsonCommentHandling.Skip
            };

            var serilog = JsonSerializer.Deserialize<JsonLog>(line, options);
            if (serilog != null)
            {
                // Determine timestamp
                string? timestampStr = serilog.T ?? serilog.Timestamp ?? serilog.Time;
                if (string.IsNullOrEmpty(timestampStr) || !DateTime.TryParse(timestampStr, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var parsedTimestamp))
                {
                    return null;
                }

                // Message and fields
                var message = serilog.Mt ?? serilog.M ?? serilog.RenderedMessage ?? serilog.Message ?? string.Empty;
                var level = serilog.L ?? serilog.Level ?? serilog.Log4NetLevel ?? string.Empty;
                var exception = serilog.X ?? serilog.Exception;
                var logger = serilog.SourceContext ?? serilog.Logger ?? string.Empty;

                // Collect extension data into string dictionary, excluding common reserved keys
                var reserved = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                {
                    "@t","T","@l","L","@m","@mt","RenderedMessage","Message","Timestamp","Level","Exception","SourceContext","Logger","time","timestamp","level","exception","Log4NetLevel","@x","X"
                };

                var props = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                if (serilog.ExtensionData != null)
                {
                    foreach (var kv in serilog.ExtensionData)
                    {
                        if (reserved.Contains(kv.Key))
                            continue;

                        try
                        {
                            var v = kv.Value;
                            string value = v.ValueKind switch
                            {
                                JsonValueKind.String => v.GetString() ?? "",
                                JsonValueKind.Number => v.GetRawText(),
                                JsonValueKind.True => "true",
                                JsonValueKind.False => "false",
                                JsonValueKind.Null => "",
                                _ => v.GetRawText()
                            };

                            props[kv.Key] = value;
                        }
                        catch
                        {
                           
                        }
                    }
                }

                return new LogEntry
                {
                    Timestamp = parsedTimestamp.ToUniversalTime(),
                    Level = MapLogLevel(level),
                    Message = message,
                    Exception = exception,
                    Logger = logger,
                    Properties = props.Count > 0 ? props : null
                };
            }
        }
        catch (JsonException)
        {
           
        }
        catch
        {
           
        }

        try
        {
            var parts = line.Split(new[] { ' ' }, 4);

            if (parts.Length < 4)
                return null;

            var timestampStr = $"{parts[0]} {parts[1]}";
            var level = parts[2].Trim('[', ']');
            var message = parts[3];

            if (!DateTime.TryParse(timestampStr, out var timestamp))
                return null;

            return new LogEntry
            {
                Timestamp = timestamp,
                Level = MapLogLevel(level),
                Message = message
            };
        }
        catch
        {
            return null;
        }
    }

    private string MapLogLevel(string level)
    {
        return level.ToUpperInvariant() switch
        {
            "ERR" => "Error",
            "FTL" => "Critical",
            "WRN" => "Warning",
            "INF" => "Information",
            "DBG" => "Debug",
            _ => level
        };
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
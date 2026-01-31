namespace Umbraco.AI.Diagnostics.Models;

/// <summary>
/// Represents a single log entry extracted from Umbraco logs.
/// </summary>
public class LogEntry
{
    /// <summary>
    /// Gets or sets the timestamp of the log entry.
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Gets or sets the log level (e.g., Error, Critical, Warning).
    /// </summary>
    public string Level { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the log message content.
    /// </summary>
    public string? Message { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the exception details if available.
    /// </summary>
    public string? Exception { get; set; }

    /// <summary>
    /// Gets or sets the logger name/category.
    /// </summary>
    public string? Logger { get; set; }

    /// <summary>
    /// Gets or sets additional properties from the log entry.
    /// </summary>
    public Dictionary<string, string?>? Properties { get; set; }

    /// <summary>
    /// Generates a hash key for deduplication based on level, message, and exception.
    /// </summary>
    /// <returns>A string hash representing the unique log entry.</returns>
    public string GetDeduplicationKey()
    {
        return $"{Level}|{Message}|{Exception}".GetHashCode().ToString();
    }

    /// <summary>
    /// Creates a simplified string representation for AI analysis.
    /// </summary>
    /// <returns>Formatted log entry string.</returns>
    public string ToAnalysisString()
    {
        var parts = new List<string>
        {
            $"[{Timestamp:yyyy-MM-dd HH:mm:ss}]",
            $"[{Level}]",
            Message
        };

        if (!string.IsNullOrEmpty(Exception))
        {
            parts.Add($"Exception: {Exception}");
        }

        if (!string.IsNullOrEmpty(Logger))
        {
            parts.Add($"Logger: {Logger}");
        }

        return string.Join(" | ", parts);
    }
}
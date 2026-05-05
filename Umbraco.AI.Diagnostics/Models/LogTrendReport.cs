namespace Umbraco.AI.Diagnostics.Models;

/// <summary>
/// One time bucket for trend / chart views (counts by log level in that interval).
/// </summary>
public class LogTrendBucket
{
    public DateTime BucketStartUtc { get; set; }

    public DateTime BucketEndUtc { get; set; }

    /// <summary>Short label for charts (e.g. hour or date).</summary>
    public string Label { get; set; } = string.Empty;

    public Dictionary<string, int> CountsByLevel { get; set; } = new();

    public int Total { get; set; }
}

/// <summary>
/// Aggregated log counts over time for trend analysis and visualizations.
/// </summary>
public class LogTrendReport
{
    public string TimeRange { get; set; } = string.Empty;

    public List<string> AnalyzedLogLevels { get; set; } = new();

    public List<LogTrendBucket> Buckets { get; set; } = new();

    public int GrandTotal { get; set; }

    public Dictionary<string, int> TotalsByLevel { get; set; } = new();

    /// <summary>Simple comparison of activity in the first vs second half of the timeline.</summary>
    public string TrendDirection { get; set; } = "stable";

    /// <summary>Human-readable trend summary for the UI.</summary>
    public string TrendSummary { get; set; } = string.Empty;
}

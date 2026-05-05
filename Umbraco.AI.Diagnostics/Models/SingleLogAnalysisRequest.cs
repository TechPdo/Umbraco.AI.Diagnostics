namespace Umbraco.AI.Diagnostics.Models;

/// <summary>
/// Request to analyze one selected log entry from the Umbraco log viewer.
/// </summary>
public class SingleLogAnalysisRequest
{
    /// <summary>
    /// Gets or sets the log entry selected in the log viewer.
    /// </summary>
    public LogEntry LogEntry { get; set; } = new();

    /// <summary>
    /// Optional Umbraco.AI chat profile alias (same semantics as <see cref="AnalysisRequest.UmbracoAiProfileAlias"/>).
    /// </summary>
    public string? UmbracoAiProfileAlias { get; set; }
}

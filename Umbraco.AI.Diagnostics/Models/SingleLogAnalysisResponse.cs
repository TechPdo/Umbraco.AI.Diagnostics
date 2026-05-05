namespace Umbraco.AI.Diagnostics.Models;

/// <summary>
/// Response for analyzing one selected log entry.
/// </summary>
public class SingleLogAnalysisResponse
{
    /// <summary>
    /// Gets or sets when this analysis was generated.
    /// </summary>
    public DateTime AnalysisTimestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets whether AI was enabled for this analysis.
    /// </summary>
    public bool AIEnabled { get; set; }

    /// <summary>
    /// Gets or sets the analysis for the selected log entry.
    /// </summary>
    public LogAnalysisItem AnalysisItem { get; set; } = new();
}

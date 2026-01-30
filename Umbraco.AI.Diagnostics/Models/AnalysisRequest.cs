namespace Umbraco.AI.Diagnostics.Models
{
    /// <summary>
    /// Request model for log analysis.
    /// </summary>
    public class AnalysisRequest
    {
        /// <summary>
        /// Gets or sets the log levels to analyze.
        /// </summary>
        public List<string> LogLevels { get; set; } = new() { "Error", "Critical", "Warning" };

        /// <summary>
        /// Gets or sets the time range for log filtering.
        /// </summary>
        public string TimeRange { get; set; } = "1hour";
    }
}

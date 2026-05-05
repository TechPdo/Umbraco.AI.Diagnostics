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
        public List<string> LogLevels { get; set; } = new() { "Error", "Fatal", "Warning" };

        /// <summary>
        /// Gets or sets the time range for log filtering.
        /// </summary>
        public string TimeRange { get; set; } = "1hour";

        /// <summary>
        /// Optional Umbraco.AI chat profile alias from the diagnostics UI.
        /// When <c>null</c> (JSON omitted), <see cref="DiagnosticsOptions.UmbracoAiProfileAlias"/> from configuration is used (backward compatible).
        /// When an empty string, the site's default chat profile from Umbraco.AI settings is used.
        /// Otherwise the given alias is used.
        /// </summary>
        public string? UmbracoAiProfileAlias { get; set; }
    }
}

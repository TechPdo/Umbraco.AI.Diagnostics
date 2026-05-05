namespace Umbraco.AI.Diagnostics.Models;

/// <summary>
/// Configuration options for the AI Diagnostics system.
/// </summary>
public class DiagnosticsOptions
{
    /// <summary>
    /// Configuration section name in appsettings.json.
    /// </summary>
    public const string SectionName = "AI:Diagnostics";

    /// <summary>
    /// Gets or sets the log levels to analyze (Umbraco / Serilog names: Verbose, Debug, Information, Warning, Error, Fatal).
    /// Default: Error, Fatal. The value <c>Critical</c> in config is accepted and mapped to <c>Fatal</c> when querying the log viewer.
    /// </summary>
    public List<string> LogLevels { get; set; } = new() { "Error", "Fatal" };

    /// <summary>
    /// Gets or sets the maximum number of logs to process in a single batch.
    /// Default: 100.
    /// </summary>
    public int MaxBatchSize { get; set; } = 100;

    /// <summary>
    /// Gets or sets whether AI analysis is enabled.
    /// Set to false to disable AI calls (useful for development/cost-saving).
    /// Default: true.
    /// </summary>
    public bool EnableAI { get; set; } = true;

    /// <summary>
    /// Gets or sets optional Umbraco.AI chat profile alias to use for diagnostics.
    /// When null or empty, the site's default chat profile from Umbraco.AI settings is used.
    /// </summary>
    public string? UmbracoAiProfileAlias { get; set; }

    /// <summary>
    /// Gets or sets the path to the standard prompt file.
    /// Default: prompts/analysis-prompt.txt.
    /// </summary>
    public string PromptFilePath { get; set; } = "prompt/analysis-prompt.txt";
}

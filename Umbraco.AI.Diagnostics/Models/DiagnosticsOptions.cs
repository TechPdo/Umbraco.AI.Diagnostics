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
    /// Gets or sets the log levels to analyze (e.g., Error, Critical, Warning).
    /// Default: Error, Critical.
    /// </summary>
    public List<string> LogLevels { get; set; } = new() { "Error", "Critical" };

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
    /// Gets or sets the AI provider to use (AzureOpenAI, OpenAI, Ollama, Gemini).
    /// Default: Gemini.
    /// </summary>
    public string AIProvider { get; set; } = "Gemini";

    /// <summary>
    /// Gets or sets the path to the standard prompt file.
    /// Default: prompts/analysis-prompt.txt.
    /// </summary>
    public string PromptFilePath { get; set; } = "prompt/analysis-prompt.txt";

    /// <summary>
    /// Gets or sets Ollama specific settings.
    /// </summary>
    public OllamaSettings? Ollama { get; set; }

    /// <summary>
    /// Gets or sets Gemini specific settings.
    /// </summary>
    public GeminiSettings? Gemini { get; set; }

    /// <summary>
    /// Gets or sets OpenAI specific settings.
    /// </summary>
    public OpenAISettings? OpenAI { get; set; }
}
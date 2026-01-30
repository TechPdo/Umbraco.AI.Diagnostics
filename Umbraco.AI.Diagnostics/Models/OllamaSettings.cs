namespace Umbraco.AI.Diagnostics.Models;

/// <summary>
/// Ollama configuration settings.
/// </summary>
public class OllamaSettings
{
    /// <summary>
    /// Gets or sets the Ollama endpoint URL.
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the model to use.
    /// Default: llama2.
    /// </summary>
    public string Model { get; set; } = "llama2";
}
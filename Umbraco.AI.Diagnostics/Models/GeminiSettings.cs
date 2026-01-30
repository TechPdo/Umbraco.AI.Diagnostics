namespace Umbraco.AI.Diagnostics.Models;
/// <summary>
/// Google Gemini configuration settings.
/// </summary>
public class GeminiSettings
{
    /// <summary>
    /// Gets or sets the API key for authentication.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the model to use.
    /// Default: gemini-pro.
    /// </summary>
    public string Model { get; set; } = "gemini-pro";
}
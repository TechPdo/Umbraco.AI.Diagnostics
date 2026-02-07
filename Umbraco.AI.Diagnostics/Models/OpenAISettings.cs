namespace Umbraco.AI.Diagnostics.Models;

/// <summary>
/// OpenAI configuration settings.
/// </summary>
public class OpenAISettings
{
    /// <summary>
    /// Gets or sets the API key for authentication.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the model to use (e.g., gpt-4, gpt-3.5-turbo).
    /// Default: gpt-4.
    /// </summary>
    public string Model { get; set; } = "gpt-4";

    /// <summary>
    /// Gets or sets the organization ID (optional).
    /// </summary>
    public string? OrganizationId { get; set; }
}

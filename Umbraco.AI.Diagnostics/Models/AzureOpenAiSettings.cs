namespace Umbraco.AI.Diagnostics.Models;

/// <summary>
/// Azure OpenAI configuration settings.
/// </summary>
public class AzureOpenAiSettings
{
    /// <summary>
    /// Gets or sets the Azure OpenAI endpoint URL.
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the API key for authentication.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the deployment name.
    /// </summary>
    public string DeploymentName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the API version.
    /// Default: 2024-02-01.
    /// </summary>
    public string ApiVersion { get; set; } = "2024-02-01";
}

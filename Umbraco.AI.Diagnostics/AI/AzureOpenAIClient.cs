using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.AI.Diagnostics.Models;

namespace Umbraco.AI.Diagnostics.AI;

/// <summary>
/// Azure OpenAI implementation of the AI client for log analysis.
/// </summary>
public class AzureOpenAIClient : IAIClient
{
    private readonly HttpClient _httpClient;
    private readonly AzureOpenAiSettings _settings;
    private readonly PromptLoader _promptLoader;
    private readonly ILogger<AzureOpenAIClient> _logger;

    /// <inheritdoc/>
    public string ProviderName => "Azure OpenAI";

    /// <summary>
    /// Initializes a new instance of the <see cref="AzureOpenAIClient"/> class.
    /// </summary>
    /// <param name="httpClient">HTTP client for API calls.</param>
    /// <param name="options">Diagnostics options containing Azure OpenAI settings.</param>
    /// <param name="promptLoader">Prompt loader for standard prompts.</param>
    /// <param name="logger">Logger instance.</param>
    public AzureOpenAIClient(
        HttpClient httpClient,
        IOptions<DiagnosticsOptions> options,
        PromptLoader promptLoader,
        ILogger<AzureOpenAIClient> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value.AzureOpenAI ?? new AzureOpenAiSettings();
        _promptLoader = promptLoader;
        _logger = logger;

        ConfigureHttpClient();
    }

    /// <inheritdoc/>
    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(_settings.Endpoint) &&
               !string.IsNullOrWhiteSpace(_settings.ApiKey) &&
               !string.IsNullOrWhiteSpace(_settings.DeploymentName);
    }

    /// <inheritdoc/>
    public async Task<string> GenerateSummaryAsync(string input, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            _logger.LogWarning("Azure OpenAI client is not configured. Missing endpoint, API key, or deployment name.");
            return JsonSerializer.Serialize(new { error = "Azure OpenAI client not configured" });
        }

        try
        {
            var prompt = await _promptLoader.FormatPromptAsync(input);

            var requestBody = new
            {
                messages = new[]
                {
                    new { role = "system", content = "You are an expert .NET and Umbraco diagnostics assistant. Respond only with valid JSON." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.3,
                response_format = new { type = "json_object" }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            var endpoint = $"{_settings.Endpoint.TrimEnd('/')}/openai/deployments/{_settings.DeploymentName}/chat/completions?api-version={_settings.ApiVersion}";

            var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);

            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

            var messageContent = result
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "{}";

            _logger.LogInformation("Successfully generated summary using Azure OpenAI deployment {DeploymentName}", _settings.DeploymentName);
            return messageContent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Azure OpenAI API");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    private void ConfigureHttpClient()
    {
        _httpClient.DefaultRequestHeaders.Add("api-key", _settings.ApiKey);
    }
}
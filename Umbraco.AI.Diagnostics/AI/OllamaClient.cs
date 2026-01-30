using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.AI.Diagnostics.Models;

namespace Umbraco.AI.Diagnostics.AI;

/// <summary>
/// Ollama implementation of the AI client for log analysis.
/// </summary>
public class OllamaClient : IAIClient
{
    private readonly HttpClient _httpClient;
    private readonly OllamaSettings _settings;
    private readonly PromptLoader _promptLoader;
    private readonly ILogger<OllamaClient> _logger;

    /// <inheritdoc/>
    public string ProviderName => "Ollama";

    /// <summary>
    /// Initializes a new instance of the <see cref="OllamaClient"/> class.
    /// </summary>
    /// <param name="httpClient">HTTP client for API calls.</param>
    /// <param name="options">Diagnostics options containing Ollama settings.</param>
    /// <param name="promptLoader">Prompt loader for standard prompts.</param>
    /// <param name="logger">Logger instance.</param>
    public OllamaClient(
        HttpClient httpClient,
        IOptions<DiagnosticsOptions> options,
        PromptLoader promptLoader,
        ILogger<OllamaClient> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value.Ollama ?? new OllamaSettings();
        _promptLoader = promptLoader;
        _logger = logger;
    }

    /// <inheritdoc/>
    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(_settings.Endpoint) &&
               !string.IsNullOrWhiteSpace(_settings.Model);
    }

    /// <inheritdoc/>
    public async Task<string> GenerateSummaryAsync(string input, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            _logger.LogWarning("Ollama client is not configured. Missing endpoint or model.");
            return JsonSerializer.Serialize(new { error = "Ollama client not configured" });
        }

        try
        {
            var prompt = await _promptLoader.FormatPromptAsync(input);

            var requestBody = new
            {
                model = _settings.Model,
                prompt = $"You are an expert .NET and Umbraco diagnostics assistant. Respond only with valid JSON.\n\n{prompt}",
                stream = false,
                format = "json"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            var endpoint = $"{_settings.Endpoint.TrimEnd('/')}/api/generate";

            var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);

            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

            var generatedResponse = result.GetProperty("response").GetString() ?? "{}";

            _logger.LogInformation("Successfully generated summary using Ollama model {Model}", _settings.Model);
            return generatedResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Ollama API");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
}
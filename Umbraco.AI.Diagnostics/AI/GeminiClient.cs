using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;
using Umbraco.AI.Diagnostics.Models;
using Umbraco.Cms.Core.Models;
using static System.Net.WebRequestMethods;
using static Umbraco.Cms.Core.Constants.Conventions;

namespace Umbraco.AI.Diagnostics.AI;

/// <summary>
/// Google Gemini implementation of the AI client for log analysis.
/// </summary>
public class GeminiClient : IAIClient
{
    private readonly HttpClient _httpClient;
    private readonly GeminiSettings _settings;
    private readonly PromptLoader _promptLoader;
    private readonly ILogger<GeminiClient> _logger;

    /// <inheritdoc/>
    public string ProviderName => "Google Gemini";

    /// <summary>
    /// Initializes a new instance of the <see cref="GeminiClient"/> class.
    /// </summary>
    /// <param name="httpClient">HTTP client for API calls.</param>
    /// <param name="options">Diagnostics options containing Gemini settings.</param>
    /// <param name="promptLoader">Prompt loader for standard prompts.</param>
    /// <param name="logger">Logger instance.</param>
    public GeminiClient(
        HttpClient httpClient,
        IOptions<DiagnosticsOptions> options,
        PromptLoader promptLoader,
        ILogger<GeminiClient> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value.Gemini ?? new GeminiSettings();
        _promptLoader = promptLoader;
        _logger = logger;
    }

    /// <inheritdoc/>
    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(_settings.ApiKey) &&
               !string.IsNullOrWhiteSpace(_settings.Model);
    }

    /// <inheritdoc/>
    public async Task<string> GenerateSummaryAsync(string input, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            _logger.LogWarning("Gemini client is not configured. Missing API key or model.");
            return JsonSerializer.Serialize(new { error = "Gemini client not configured" });
        }

        try
        {
            var prompt = await _promptLoader.FormatPromptAsync(input);

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = "You are an expert .NET and Umbraco diagnostics assistant. Respond only with valid JSON." }
                        }
                    },
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            string endpoint = $"https://generativelanguage.googleapis.com/v1/models/{_settings.Model}:generateContent?key={_settings.ApiKey}";

            var response = await _httpClient.PostAsync(endpoint, content, cancellationToken);


            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

            var generatedText = result
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? "{}";

            _logger.LogInformation("Successfully generated summary using Gemini model {Model}", _settings.Model);
            return generatedText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Gemini API");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }
}
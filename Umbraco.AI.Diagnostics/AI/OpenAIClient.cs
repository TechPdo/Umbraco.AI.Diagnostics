using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.AI.Diagnostics.Models;

namespace Umbraco.AI.Diagnostics.AI;

/// <summary>
/// OpenAI implementation of the AI client for log analysis.
/// </summary>
public class OpenAIClient : IAIClient
{
    private readonly HttpClient _httpClient;
    private readonly OpenAISettings _settings;
    private readonly PromptLoader _promptLoader;
    private readonly ILogger<OpenAIClient> _logger;

    /// <inheritdoc/>
    public string ProviderName => "OpenAI";

    /// <summary>
    /// Initializes a new instance of the <see cref="OpenAIClient"/> class.
    /// </summary>
    /// <param name="httpClient">HTTP client for API calls.</param>
    /// <param name="options">Diagnostics options containing OpenAI settings.</param>
    /// <param name="promptLoader">Prompt loader for standard prompts.</param>
    /// <param name="logger">Logger instance.</param>
    public OpenAIClient(
        HttpClient httpClient,
        IOptions<DiagnosticsOptions> options,
        PromptLoader promptLoader,
        ILogger<OpenAIClient> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value.OpenAI ?? new OpenAISettings();
        _promptLoader = promptLoader;
        _logger = logger;

        ConfigureHttpClient();
    }

    /// <inheritdoc/>
    public bool IsConfigured()
    {
        return !string.IsNullOrWhiteSpace(_settings.ApiKey);
    }

    /// <inheritdoc/>
    public async Task<string> GenerateSummaryAsync(string input, CancellationToken cancellationToken = default)
    {
        if (!IsConfigured())
        {
            _logger.LogWarning("OpenAI client is not configured. Missing API key.");
            return JsonSerializer.Serialize(new { error = "OpenAI client not configured" });
        }

        try
        {
            var prompt = await _promptLoader.FormatPromptAsync(input);

            var requestBody = new
            {
                model = _settings.Model,
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

            var response = await _httpClient.PostAsync(
                "https://api.openai.com/v1/chat/completions",
                content,
                cancellationToken);

            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

            var messageContent = result
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "{}";

            _logger.LogInformation("Successfully generated summary using OpenAI model {Model}", _settings.Model);
            return messageContent;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling OpenAI API");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    private void ConfigureHttpClient()
    {
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _settings.ApiKey);

        if (!string.IsNullOrWhiteSpace(_settings.OrganizationId))
        {
            _httpClient.DefaultRequestHeaders.Add("OpenAI-Organization", _settings.OrganizationId);
        }
    }
}
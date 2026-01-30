namespace Umbraco.AI.Diagnostics.AI;

/// <summary>
/// Abstraction for AI client implementations to generate diagnostic summaries.
/// </summary>
public interface IAIClient
{
    /// <summary>
    /// Generates an AI-assisted summary and analysis for the provided log input.
    /// </summary>
    /// <param name="input">The formatted log data to analyze.</param>
    /// <param name="cancellationToken">Cancellation token for the async operation.</param>
    /// <returns>A JSON string containing the AI analysis.</returns>
    Task<string> GenerateSummaryAsync(string input, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the name of the AI provider (e.g., "OpenAI", "Azure OpenAI", "Ollama", "Gemini").
    /// </summary>
    string ProviderName { get; }

    /// <summary>
    /// Checks if the AI client is properly configured and ready to use.
    /// </summary>
    /// <returns>True if configured and ready; otherwise false.</returns>
    bool IsConfigured();
}
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
    /// <param name="umbracoAiProfileAlias">
    /// When <c>null</c>, use <c>AI:Diagnostics:UmbracoAiProfileAlias</c> from configuration (if set), otherwise the Umbraco.AI default chat profile.
    /// When empty, force the Umbraco.AI default chat profile.
    /// When non-empty, use that chat profile alias.
    /// </param>
    /// <param name="cancellationToken">Cancellation token for the async operation.</param>
    /// <returns>A JSON string containing the AI analysis.</returns>
    Task<string> GenerateSummaryAsync(
        string input,
        string? umbracoAiProfileAlias = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the name of the AI provider (e.g., "Umbraco.AI").
    /// </summary>
    string ProviderName { get; }
}
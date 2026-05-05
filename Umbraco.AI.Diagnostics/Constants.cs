namespace Umbraco.AI.Diagnostics;

/// <summary>Shared defaults for diagnostics chat behaviour (sample seed + runtime fallback).</summary>
public static class Constants
{
    public const string ApiName = "umbracoaidiagnostics";

    /// <summary>
    /// Default Umbraco.AI chat profile <see cref="Umbraco.AI.Core.Profiles.AIChatProfileSettings.SystemPromptTemplate"/> for log analysis
    /// (seeded profiles and client fallback when the profile template is empty).
    /// </summary>
    public const string DefaultDiagnosticsSystemPromptTemplate =
        "You are an expert .NET and Umbraco diagnostics assistant. Respond only with valid JSON as specified in the user message.";
}

using System.Text.Json;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.AI.Core.Chat;
using Umbraco.AI.Core.Profiles;
using Umbraco.AI.Core.Settings;
using Umbraco.AI.Diagnostics.Models;
using static Umbraco.AI.Diagnostics.Constants;

namespace Umbraco.AI.Diagnostics.AI;

/// <summary>
/// Uses official Umbraco.AI chat services to generate JSON diagnostics from log batches.
/// </summary>
public sealed class UmbracoAIDiagnosticsChatClient : IAIClient
{
    private const string DiagnosticsChatAlias = "umbraco-ai-diagnostics-log-analysis";

    private readonly IAIChatService _chatService;
    private readonly IAISettingsService _settingsService;
    private readonly IAIProfileService _profileService;
    private readonly PromptLoader _promptLoader;
    private readonly DiagnosticsOptions _options;
    private readonly ILogger<UmbracoAIDiagnosticsChatClient> _logger;

    public UmbracoAIDiagnosticsChatClient(
        IAIChatService chatService,
        IAISettingsService settingsService,
        IAIProfileService profileService,
        PromptLoader promptLoader,
        IOptions<DiagnosticsOptions> options,
        ILogger<UmbracoAIDiagnosticsChatClient> logger)
    {
        _chatService = chatService;
        _settingsService = settingsService;
        _profileService = profileService;
        _promptLoader = promptLoader;
        _options = options.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    public string ProviderName => "Umbraco.AI";

    /// <inheritdoc />
    public async Task<string> GenerateSummaryAsync(
        string input,
        string? umbracoAiProfileAlias = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var (useExplicitProfile, explicitAliasOrNull) = ResolveProfileSelection(umbracoAiProfileAlias);
            var settings = await _settingsService.GetSettingsAsync(cancellationToken).ConfigureAwait(false);

            if (!useExplicitProfile && !settings.DefaultChatProfileId.HasValue)
            {
                _logger.LogWarning(
                    "Umbraco.AI has no default chat profile and no explicit chat profile alias was selected.");
                return JsonSerializer.Serialize(new
                {
                    error =
                        "Umbraco.AI is not ready for chat: configure a default chat profile in the AI section, or pick a chat profile in AI Diagnostics."
                });
            }

            AIProfile? profile;
            if (useExplicitProfile)
            {
                profile = await _profileService
                    .GetProfileByAliasAsync(explicitAliasOrNull!, cancellationToken)
                    .ConfigureAwait(false);
                if (profile is null)
                {
                    _logger.LogWarning(
                        "Umbraco.AI chat profile with alias {Alias} was not found.",
                        explicitAliasOrNull);
                    return JsonSerializer.Serialize(new
                    {
                        error =
                            $"Umbraco.AI chat profile '{explicitAliasOrNull}' was not found. Pick another profile or fix the alias in Umbraco AI settings."
                    });
                }
            }
            else
            {
                profile = await _profileService
                    .GetProfileAsync(settings.DefaultChatProfileId!.Value, cancellationToken)
                    .ConfigureAwait(false);
                if (profile is null)
                {
                    _logger.LogWarning(
                        "Umbraco.AI default chat profile {ProfileId} could not be loaded.",
                        settings.DefaultChatProfileId);
                    return JsonSerializer.Serialize(new
                    {
                        error = "Umbraco.AI default chat profile could not be loaded."
                    });
                }
            }

            var chatSettings = profile.Settings as AIChatProfileSettings;
            var chatOptionsFromProfile = BuildChatOptionsFromProfile(chatSettings);
            var systemPrompt = DefaultDiagnosticsSystemPromptTemplate;
            if (chatSettings?.SystemPromptTemplate is { } template && !string.IsNullOrWhiteSpace(template))
            {
                systemPrompt = template.Trim();
            }

            var userPrompt = await _promptLoader.FormatPromptAsync(input).ConfigureAwait(false);
            var messages = new List<ChatMessage>
            {
                new(ChatRole.System, systemPrompt),
                new(ChatRole.User, userPrompt)
            };

            var response = await _chatService.GetChatResponseAsync(
                    chat =>
                    {
                        chat.WithAlias(DiagnosticsChatAlias);
                        if (useExplicitProfile)
                        {
                            chat.WithProfile(explicitAliasOrNull!);
                        }

                        if (chatOptionsFromProfile is not null)
                        {
                            chat.WithChatOptions(chatOptionsFromProfile);
                        }
                    },
                    messages,
                    cancellationToken)
                .ConfigureAwait(false);

            var rawText = response.Text;
            if (string.IsNullOrWhiteSpace(rawText))
            {
                _logger.LogWarning("Umbraco.AI returned an empty message for diagnostics.");
                return JsonSerializer.Serialize(new { error = "Umbraco.AI returned an empty response." });
            }

            var extracted = ExtractJsonPayload(rawText);
            _logger.LogInformation("Completed diagnostics summary via Umbraco.AI ({Alias}).", DiagnosticsChatAlias);
            return extracted;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Umbraco.AI for diagnostics.");
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Resolves which profile to use. Request override: <c>null</c> = use diagnostics options;
    /// empty string = Umbraco.AI site default only; non-empty = that alias.
    /// </summary>
    private (bool UseExplicitProfile, string? ExplicitAlias) ResolveProfileSelection(string? umbracoAiProfileAliasFromRequest)
    {
        if (umbracoAiProfileAliasFromRequest is null)
        {
            var fromOptions = string.IsNullOrWhiteSpace(_options.UmbracoAiProfileAlias)
                ? null
                : _options.UmbracoAiProfileAlias.Trim();
            return (fromOptions is not null, fromOptions);
        }

        if (umbracoAiProfileAliasFromRequest.Length == 0)
        {
            return (false, null);
        }

        return (true, umbracoAiProfileAliasFromRequest.Trim());
    }

    /// <summary>
    /// Maps Umbraco.AI chat profile settings to <see cref="ChatOptions"/>; returns <c>null</c> when nothing is set on the profile.
    /// </summary>
    private static ChatOptions? BuildChatOptionsFromProfile(AIChatProfileSettings? chatSettings)
    {
        if (chatSettings is null)
        {
            return null;
        }

        ChatOptions? options = null;
        if (chatSettings.Temperature.HasValue)
        {
            options = new ChatOptions { Temperature = chatSettings.Temperature.Value };
        }

        if (chatSettings.MaxTokens.HasValue)
        {
            options ??= new ChatOptions();
            options.MaxOutputTokens = chatSettings.MaxTokens.Value;
        }

        return options;
    }

    /// <summary>
    /// Strips optional markdown fences and returns the inner JSON payload.
    /// </summary>
    private static string ExtractJsonPayload(string text)
    {
        var trimmed = text.Trim();
        if (!trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            return trimmed;
        }

        // ```json ... ``` or ``` ... ```
        var firstLineBreak = trimmed.IndexOf('\n');
        if (firstLineBreak < 0)
        {
            return trimmed;
        }

        var inner = trimmed[(firstLineBreak + 1)..];
        var fenceEnd = inner.LastIndexOf("```", StringComparison.Ordinal);
        if (fenceEnd >= 0)
        {
            inner = inner[..fenceEnd];
        }

        return inner.Trim();
    }
}

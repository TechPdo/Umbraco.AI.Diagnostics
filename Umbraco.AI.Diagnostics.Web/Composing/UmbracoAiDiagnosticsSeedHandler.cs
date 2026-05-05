using Microsoft.Extensions.Options;
using Umbraco.AI.Core.Connections;
using Umbraco.AI.Core.Models;
using Umbraco.AI.Core.Profiles;
using Umbraco.AI.Core.Settings;
using Umbraco.AI.Diagnostics;
using Umbraco.AI.Diagnostics.Web.Options;
using Umbraco.AI.Google;
using Umbraco.AI.OpenAI;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace Umbraco.AI.Diagnostics.Web.Composing;

/// <summary>
/// Idempotent seed: creates Gemini and (optionally) Azure OpenAI connections plus chat profiles,
/// and sets the default Umbraco.AI chat profile for the site.
/// </summary>
/// <remarks>
/// Uses <see cref="INotificationHandler{TNotification}"/> (sync) because <see cref="UmbracoApplicationStartedNotification"/>
/// is published synchronously on cold start; async handlers may not run reliably for this notification.
/// </remarks>
public sealed class UmbracoAiDiagnosticsSeedHandler : INotificationHandler<UmbracoApplicationStartedNotification>
{
    public const string GeminiConnectionAlias = "diagnostics-site-gemini";
    public const string AzureConnectionAlias = "diagnostics-site-azure-openai";
    public const string GeminiChatProfileAlias = "default-gemini-chat";
    public const string AzureChatProfileAlias = "default-azure-openai-chat";

    private readonly IAIConnectionService _connectionService;
    private readonly IAIProfileService _profileService;
    private readonly IAISettingsService _settingsService;
    private readonly IRuntimeState _runtimeState;
    private readonly ILogger<UmbracoAiDiagnosticsSeedHandler> _logger;
    private readonly AIDiagnosticsSeedOptions _options;

    public UmbracoAiDiagnosticsSeedHandler(
        IAIConnectionService connectionService,
        IAIProfileService profileService,
        IAISettingsService settingsService,
        IRuntimeState runtimeState,
        IOptions<AIDiagnosticsSeedOptions> options,
        ILogger<UmbracoAiDiagnosticsSeedHandler> logger)
    {
        _connectionService = connectionService;
        _profileService = profileService;
        _settingsService = settingsService;
        _runtimeState = runtimeState;
        _logger = logger;
        _options = options.Value;
    }

    public void Handle(UmbracoApplicationStartedNotification notification)
    {
        // Install / upgrade / boot-failed: AI persistence is not in a runnable state.
        if (_runtimeState.Level != RuntimeLevel.Run)
        {
            _logger.LogInformation(
                "Umbraco.AI diagnostics seed skipped: runtime level is {Level} (expected {Run}).",
                _runtimeState.Level,
                RuntimeLevel.Run);
            return;
        }

        if (!_options.Enabled)
        {
            _logger.LogDebug("Umbraco.AI diagnostics seed skipped: AI:Diagnostics:Seed:Enabled is false.");
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.Google.ApiKey))
        {
            _logger.LogWarning(
                "Umbraco.AI diagnostics seed skipped: AI:Diagnostics:Seed:Google:ApiKey is empty. Set the key in configuration or user secrets (e.g. AI__Diagnostics__Seed__Google__ApiKey) to create sample connections.");
            return;
        }

        try
        {
            SeedCoreAsync(CancellationToken.None).GetAwaiter().GetResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Umbraco.AI diagnostics seed failed.");
        }
    }

    private async Task SeedCoreAsync(CancellationToken cancellationToken)
    {
        if (await _connectionService.GetConnectionByAliasAsync(GeminiConnectionAlias, cancellationToken) is not null)
        {
            _logger.LogInformation(
                "Umbraco.AI diagnostics seed skipped: connection alias {Alias} already exists (idempotent).",
                GeminiConnectionAlias);
            return;
        }

        _logger.LogInformation("Seeding Umbraco.AI connections and profiles for AI Diagnostics sample site…");

        var geminiConnection = await _connectionService.SaveConnectionAsync(
            new AIConnection
            {
                Alias = GeminiConnectionAlias,
                Name = "Google Gemini (sample)",
                ProviderId = "google",
                Settings = new GoogleProviderSettings { ApiKey = _options.Google.ApiKey },
                IsActive = true
            },
            cancellationToken);

        var geminiProfile = await _profileService.SaveProfileAsync(
            new AIProfile
            {
                Alias = GeminiChatProfileAlias,
                Name = "Default Gemini Chat",
                Capability = AICapability.Chat,
                ConnectionId = geminiConnection.Id,
                Model = new AIModelRef("google", _options.GeminiModelId),
                Settings = new AIChatProfileSettings
                {
                    Temperature = 0.3f,
                    MaxTokens = 8192,
                    SystemPromptTemplate = Constants.DefaultDiagnosticsSystemPromptTemplate
                }
            },
            cancellationToken);

        var azureEndpoint = _options.AzureOpenAI.Endpoint;
        var azureDeployment = _options.AzureOpenAI.ChatDeploymentName;
        if (string.IsNullOrWhiteSpace(azureDeployment))
        {
            azureDeployment = "gpt-4o";
        }

        AIProfile? azureProfile = null;
        if (!string.IsNullOrWhiteSpace(azureEndpoint))
        {
            var azureConnection = await _connectionService.SaveConnectionAsync(
                new AIConnection
                {
                    Alias = AzureConnectionAlias,
                    Name = "Azure OpenAI (sample)",
                    ProviderId = "openai",
                    Settings = new OpenAIProviderSettings
                    {
                        ApiKey = _options.AzureOpenAI.ApiKey,
                        Endpoint = azureEndpoint.TrimEnd('/')
                    },
                    IsActive = true
                },
                cancellationToken);

            azureProfile = await _profileService.SaveProfileAsync(
                new AIProfile
                {
                    Alias = AzureChatProfileAlias,
                    Name = "Default Azure OpenAI Chat",
                    Capability = AICapability.Chat,
                    ConnectionId = azureConnection.Id,
                    Model = new AIModelRef("openai", azureDeployment),
                    Settings = new AIChatProfileSettings
                    {
                        Temperature = 0.3f,
                        MaxTokens = 8192,
                        SystemPromptTemplate = Constants.DefaultDiagnosticsSystemPromptTemplate
                    }
                },
                cancellationToken);
        }
        else
        {
            _logger.LogInformation(
                "Azure OpenAI connection not seeded: {Key} is empty. Set AI:Diagnostics:Seed:AzureOpenAI:Endpoint to create the second connection.",
                "AI:Diagnostics:Seed:AzureOpenAI:Endpoint");
        }

        var settings = await _settingsService.GetSettingsAsync(cancellationToken);
        settings.DefaultChatProfileId = _options.DefaultProvider.Equals("AzureOpenAI", StringComparison.OrdinalIgnoreCase) && azureProfile is not null
            ? azureProfile.Id
            : geminiProfile.Id;
        await _settingsService.SaveSettingsAsync(settings, cancellationToken);

        _logger.LogInformation(
            "Umbraco.AI seed complete. Default chat profile: {ProfileId}.",
            settings.DefaultChatProfileId);
    }
}

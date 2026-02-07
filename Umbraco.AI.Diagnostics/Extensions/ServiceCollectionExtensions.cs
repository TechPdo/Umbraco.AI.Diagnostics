using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.AI.Diagnostics.AI;
using Umbraco.AI.Diagnostics.Models;
using Umbraco.AI.Diagnostics.Services;

namespace Umbraco.AI.Diagnostics.Extensions;

/// <summary>
/// Extension methods for registering AI Diagnostics services in the DI container.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds Umbraco AI Diagnostics services to the service collection.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The configuration instance.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddUmbracoAIDiagnostics(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register configuration
        services.Configure<DiagnosticsOptions>(
            configuration.GetSection(DiagnosticsOptions.SectionName));

        // Register prompt loader as singleton (for caching)
        services.AddSingleton<PromptLoader>();

        // Register AI clients
        services.AddHttpClient<OllamaClient>();
        services.AddHttpClient<GeminiClient>();
        services.AddHttpClient<OpenAIClient>();

        // Register the appropriate AI client based on configuration
        services.AddScoped<IAIClient>(serviceProvider =>
        {
            var options = configuration
                .GetSection(DiagnosticsOptions.SectionName)
                .Get<DiagnosticsOptions>() ?? new DiagnosticsOptions();

            return options.AIProvider.ToLowerInvariant() switch
            {
                "ollama" => serviceProvider.GetRequiredService<OllamaClient>(),
                "gemini" => serviceProvider.GetRequiredService<GeminiClient>(),
                "openai" => serviceProvider.GetRequiredService<OpenAIClient>(),
                _ => serviceProvider.GetRequiredService<GeminiClient>() // default
            };
        });

        // Register services
        services.AddScoped<ILogAnalysisService, LogAnalysisService>();

        return services;
    }

    /// <summary>
    /// Adds Umbraco AI Diagnostics services with custom options configuration.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configureOptions">Action to configure diagnostics options.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddUmbracoAIDiagnostics(
        this IServiceCollection services,
        Action<DiagnosticsOptions> configureOptions)
    {
        // Register configuration
        services.Configure(configureOptions);

        // Register prompt loader as singleton (for caching)
        services.AddSingleton<PromptLoader>();

        // Register AI clients
        services.AddHttpClient<OllamaClient>();
        services.AddHttpClient<GeminiClient>();
        services.AddHttpClient<OpenAIClient>();

        // Register the appropriate AI client based on configuration
        services.AddScoped<IAIClient>(serviceProvider =>
        {
            var options = new DiagnosticsOptions();
            configureOptions(options);

            return options.AIProvider.ToLowerInvariant() switch
            {
                "ollama" => serviceProvider.GetRequiredService<OllamaClient>(),
                "gemini" => serviceProvider.GetRequiredService<GeminiClient>(),
                "openai" => serviceProvider.GetRequiredService<OpenAIClient>(),
                _ => serviceProvider.GetRequiredService<GeminiClient>() // default
            };
        });

        // Register services
        services.AddScoped<ILogAnalysisService, LogAnalysisService>();

        return services;
    }
}
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
    /// Requires Umbraco.AI to be installed on the host site with a configured chat profile (or <see cref="DiagnosticsOptions.UmbracoAiProfileAlias"/>).
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <param name="configuration">The configuration instance.</param>
    /// <returns>The service collection for chaining.</returns>
    public static IServiceCollection AddUmbracoAIDiagnostics(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<DiagnosticsOptions>(
            configuration.GetSection(DiagnosticsOptions.SectionName));

        services.AddSingleton<PromptLoader>();
        services.AddScoped<IAIClient, UmbracoAIDiagnosticsChatClient>();
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
        services.Configure(configureOptions);

        services.AddSingleton<PromptLoader>();
        services.AddScoped<IAIClient, UmbracoAIDiagnosticsChatClient>();
        services.AddScoped<ILogAnalysisService, LogAnalysisService>();

        return services;
    }
}

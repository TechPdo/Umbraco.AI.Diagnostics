using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;

namespace Umbraco.AI.Diagnostics.Web.Composing;

/// <summary>
/// Registers startup seeding for Umbraco.AI connections and chat profiles (Gemini + optional Azure OpenAI).
/// </summary>
public sealed class UmbracoAiDiagnosticsSeedComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder) =>
        builder.AddNotificationHandler<UmbracoApplicationStartedNotification, UmbracoAiDiagnosticsSeedHandler>();
}

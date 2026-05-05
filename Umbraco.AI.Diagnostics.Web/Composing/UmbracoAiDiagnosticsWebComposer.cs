using Umbraco.AI.Diagnostics.Web.Options;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace Umbraco.AI.Diagnostics.Web.Composing;

/// <summary>
/// Registers sample-site options for <c>AI:Diagnostics:Seed</c>.
/// </summary>
public sealed class UmbracoAiDiagnosticsWebComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.Configure<AIDiagnosticsSeedOptions>(
            builder.Config.GetSection(AIDiagnosticsSeedOptions.SectionPath));
    }
}

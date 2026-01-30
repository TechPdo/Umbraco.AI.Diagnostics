using Umbraco.AI.Diagnostics.Extensions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace Umbraco.AI.Diagnostics.Composer
{
    /// <summary>
    /// Umbraco composer for automatic registration of AI Diagnostics services.
    /// </summary>
    public class AIDiagnosticsComposer : IComposer
    {
        /// <summary>
        /// Composes the AI Diagnostics services into the Umbraco application.
        /// </summary>
        /// <param name="builder">The Umbraco builder.</param>
        public void Compose(IUmbracoBuilder builder)
        {
            builder.Services.AddUmbracoAIDiagnostics(builder.Config);
        }
    }
}

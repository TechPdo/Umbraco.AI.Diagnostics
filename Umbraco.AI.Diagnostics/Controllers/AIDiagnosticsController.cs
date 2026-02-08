using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Umbraco.AI.Diagnostics.Models;
using Umbraco.AI.Diagnostics.Services;
using Umbraco.Cms.Web.Common.Authorization;

namespace Umbraco.AI.Diagnostics.Controllers
{
    /// <summary>
    /// API Controller for AI Diagnostics functionality
    /// Accessible at: /umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics
    /// </summary>
    [Route("umbraco/backoffice/umbracoaidiagnostics/api/[controller]")]
    [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
    public class AIDiagnosticsController : ControllerBase
    {
        private readonly ILogAnalysisService _logAnalysisService;
        private readonly ILogger<AIDiagnosticsController> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="AIDiagnosticsController"/> class.
        /// </summary>
        /// <param name="logAnalysisService">Log analysis service.</param>
        /// <param name="logger">Logger instance.</param>
        public AIDiagnosticsController(
            ILogAnalysisService logAnalysisService,
            ILogger<AIDiagnosticsController> logger)
        {
            _logAnalysisService = logAnalysisService;
            _logger = logger;
        }

        /// <summary>
        /// Analyze logs with filters
        /// POST /umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/analyze
        /// </summary>
        [HttpPost]
        [Route("analyze")]
        public async Task<IActionResult> Analyze([FromBody] AnalysisRequest request, CancellationToken cancellationToken)
        {
            if (request == null || request.LogLevels == null || !request.LogLevels.Any())
            {
                return BadRequest(new { error = "LogLevels are required" });
            }

            try
            {
                _logger.LogInformation(
                    "Starting log analysis for levels: {Levels}, time range: {TimeRange}",
                    string.Join(", ", request.LogLevels),
                    request.TimeRange);

                var report = await _logAnalysisService.AnalyzeLogsAsync(
                    request.LogLevels,
                    request.TimeRange,
                    cancellationToken);

                _logger.LogInformation("Log analysis completed successfully");

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing logs");
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}

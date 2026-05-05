using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Umbraco.AI.Core.Models;
using Umbraco.AI.Core.Profiles;
using Umbraco.AI.Core.Settings;
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
    [IgnoreAntiforgeryToken]
    public class AIDiagnosticsController : ControllerBase
    {
        private readonly ILogAnalysisService _logAnalysisService;
        private readonly IAIProfileService _profileService;
        private readonly IAISettingsService _settingsService;
        private readonly ILogger<AIDiagnosticsController> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="AIDiagnosticsController"/> class.
        /// </summary>
        /// <param name="logAnalysisService">Log analysis service.</param>
        /// <param name="profileService">Umbraco.AI profile service.</param>
        /// <param name="settingsService">Umbraco.AI settings service.</param>
        /// <param name="logger">Logger instance.</param>
        public AIDiagnosticsController(
            ILogAnalysisService logAnalysisService,
            IAIProfileService profileService,
            IAISettingsService settingsService,
            ILogger<AIDiagnosticsController> logger)
        {
            _logAnalysisService = logAnalysisService;
            _profileService = profileService;
            _settingsService = settingsService;
            _logger = logger;
        }

        /// <summary>
        /// Lists Umbraco.AI chat profiles for the diagnostics workspace picker.
        /// GET /umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/chat-profiles
        /// </summary>
        [HttpGet]
        [Route("chat-profiles")]
        public async Task<IActionResult> GetChatProfiles(CancellationToken cancellationToken)
        {
            try
            {
                var settings = await _settingsService.GetSettingsAsync(cancellationToken).ConfigureAwait(false);
                var defaultId = settings.DefaultChatProfileId;

                var profiles = await _profileService
                    .GetProfilesAsync(AICapability.Chat, cancellationToken)
                    .ConfigureAwait(false);

                var list = profiles
                    .Select(p => new ChatProfileOptionDto
                    {
                        Alias = p.Alias,
                        Name = string.IsNullOrWhiteSpace(p.Name) ? p.Alias : p.Name,
                        IsDefault = defaultId.HasValue && p.Id == defaultId.Value,
                    })
                    .OrderByDescending(p => p.IsDefault)
                    .ThenBy(p => p.Name, StringComparer.OrdinalIgnoreCase)
                    .ToList();

                var defaultAlias = list.FirstOrDefault(p => p.IsDefault)?.Alias;

                return Ok(new ChatProfilesResponse
                {
                    Profiles = list,
                    DefaultProfileAlias = defaultAlias,
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading Umbraco.AI chat profiles for diagnostics");
                return StatusCode(500, new { error = ex.Message });
            }
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
                    request.UmbracoAiProfileAlias,
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

        /// <summary>
        /// Analyze a single log entry selected from the Umbraco log viewer.
        /// POST /umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/analyze-log-entry
        /// </summary>
        [HttpPost]
        [Route("analyze-log-entry")]
        public async Task<IActionResult> AnalyzeLogEntry([FromBody] SingleLogAnalysisRequest request, CancellationToken cancellationToken)
        {
            if (request?.LogEntry == null)
            {
                return BadRequest(new { error = "LogEntry is required" });
            }

            var level = request.LogEntry.Level?.Trim();
            if (!IsSupportedSingleLogLevel(level))
            {
                return BadRequest(new { error = "Only Fatal, Error, and Warning log entries can be analyzed from the Log Viewer." });
            }

            try
            {
                _logger.LogInformation(
                    "Starting single log analysis for level: {Level}",
                    level);

                request.LogEntry.Level = level!;
                var response = await _logAnalysisService.AnalyzeSingleLogEntryAsync(
                    request.LogEntry,
                    request.UmbracoAiProfileAlias,
                    cancellationToken);

                _logger.LogInformation("Single log analysis completed successfully");

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing single log entry");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Time-bucketed log counts for trend analysis and chart workspace views.
        /// POST /umbraco/backoffice/umbracoaidiagnostics/api/aidiagnostics/log-trends
        /// </summary>
        [HttpPost]
        [Route("log-trends")]
        public async Task<IActionResult> LogTrends([FromBody] AnalysisRequest request, CancellationToken cancellationToken)
        {
            if (request == null || request.LogLevels == null || !request.LogLevels.Any())
            {
                return BadRequest(new { error = "LogLevels are required" });
            }

            try
            {
                var timeRange = string.IsNullOrWhiteSpace(request.TimeRange) ? "1hour" : request.TimeRange;
                var report = await _logAnalysisService.GetLogTrendsAsync(
                    request.LogLevels,
                    timeRange,
                    cancellationToken);

                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error building log trends");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private static bool IsSupportedSingleLogLevel(string? level)
        {
            return string.Equals(level, "Fatal", StringComparison.OrdinalIgnoreCase)
                || string.Equals(level, "Error", StringComparison.OrdinalIgnoreCase)
                || string.Equals(level, "Warning", StringComparison.OrdinalIgnoreCase);
        }
    }
}

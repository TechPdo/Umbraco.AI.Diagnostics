using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.AI.Diagnostics.Models;

namespace Umbraco.AI.Diagnostics.AI;

/// <summary>
/// Loads and manages standard prompts from the configured prompt file.
/// </summary>
public class PromptLoader
{
    private readonly DiagnosticsOptions _options;
    private readonly ILogger<PromptLoader> _logger;
    private string? _cachedPrompt;
    private DateTime? _lastLoadTime;
    private readonly TimeSpan _cacheExpiration = TimeSpan.FromMinutes(5);
    private readonly IWebHostEnvironment _env;

    /// <summary>
    /// Initializes a new instance of the <see cref="PromptLoader"/> class.
    /// </summary>
    /// <param name="options">Diagnostics options containing prompt file path.</param>
    /// <param name="logger">Logger instance.</param>
    public PromptLoader(IOptions<DiagnosticsOptions> options, ILogger<PromptLoader> logger, IWebHostEnvironment env)
    {
        _options = options.Value;
        _logger = logger;
        _env = env;
    }

    /// <summary>
    /// Gets the standard analysis prompt from the configured file.
    /// Uses caching to avoid repeated file I/O.
    /// </summary>
    /// <returns>The prompt template string.</returns>
    public async Task<string> GetAnalysisPromptAsync()
    {
        // Check if we have a valid cached prompt
        if (_cachedPrompt != null && _lastLoadTime.HasValue &&
            DateTime.UtcNow - _lastLoadTime.Value < _cacheExpiration)
        {
            return _cachedPrompt;
        }

        try
        {
            var promptPath = Path.Combine(_env.ContentRootPath, _options.PromptFilePath);

            if (!File.Exists(promptPath))
            {
                _logger.LogWarning("Prompt file not found at {PromptPath}. Using default prompt.", promptPath);
                return GetDefaultPrompt();
            }

            _cachedPrompt = await File.ReadAllTextAsync(promptPath);
            _lastLoadTime = DateTime.UtcNow;

            _logger.LogInformation("Successfully loaded prompt from {PromptPath}", promptPath);
            return _cachedPrompt;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading prompt file from {PromptPath}. Using default prompt.", _options.PromptFilePath);
            return GetDefaultPrompt();
        }
    }

    /// <summary>
    /// Formats the prompt with the provided log data.
    /// </summary>
    /// <param name="logData">The log data to insert into the prompt.</param>
    /// <returns>The formatted prompt ready for AI analysis.</returns>
    public async Task<string> FormatPromptAsync(string logData)
    {
        var promptTemplate = await GetAnalysisPromptAsync();
        return promptTemplate.Replace("{LOG_DATA}", logData);
    }

    /// <summary>
    /// Gets the default analysis prompt used when the prompt file is not available.
    /// </summary>
    /// <returns>Default prompt template.</returns>
    private static string GetDefaultPrompt()
    {
        return @"You are an expert Umbraco CMS and .NET developer with deep knowledge of common errors, performance issues, and best practices.
Analyze the following log entries from an Umbraco 17 (.NET 10) application and provide a comprehensive diagnostic report.

Log Data:
{LOG_DATA}

Your task is to:
1. Identify the root cause of each unique error or warning
2. Provide actionable fixes with specific code examples or configuration changes where applicable
3. Include relevant documentation links (Umbraco docs, Microsoft docs, Stack Overflow, GitHub issues)
4. Assess the severity of each issue (Critical, High, Medium, Low)
5. Provide an overall summary of the system health based on the logs

Respond ONLY with valid JSON in the following format (no markdown formatting):
{
  ""overallSummary"": ""Brief overview of the main issues found and overall system health assessment"",
  ""items"": [
    {
      ""logDate"": ""The original log date"",
      ""logMessage"": ""The original log message (shortened if too long)"",
      ""likelyCause"": ""Detailed explanation of what likely caused this error"",
      ""suggestedFixes"": [
        ""Specific fix 1 with code example or configuration change"",
        ""Specific fix 2 with step-by-step instructions"",
        ""Alternative fix 3 if applicable""
      ],
      ""referenceLinks"": [
        ""https://docs.umbraco.com/relevant-page"",
        ""https://learn.microsoft.com/relevant-doc"",
        ""https://github.com/umbraco/relevant-issue""
      ],
      ""severityAssessment"": ""Critical|High|Medium|Low""
    }
  ]
}

Guidelines:
- Focus on Umbraco-specific issues (content types, templates, configuration, cache, database)
- Consider .NET 10 and C# 14 specific issues
- Look for patterns indicating performance problems, memory leaks, or security issues
- Prioritize fixes that have the most impact
- Keep explanations clear and actionable
- Include working code snippets in suggested fixes when possible
- Reference official documentation whenever available

Return ONLY valid JSON without any markdown formatting, code blocks, or additional text.";
    }

    /// <summary>
    /// Clears the cached prompt, forcing a reload on next request.
    /// </summary>
    public void ClearCache()
    {
        _cachedPrompt = null;
        _lastLoadTime = null;
    }
}
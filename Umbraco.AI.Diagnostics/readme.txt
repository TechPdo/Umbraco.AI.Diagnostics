
Umbraco AI Diagnostics analyzes application logs using Umbraco.AI to suggest root causes and fixes.

Quick configuration (appsettings.json) — diagnostics keys under AI:Diagnostics; sample seed under AI:Diagnostics:Seed:

  "AI": {
    "Diagnostics": {
      "MaxBatchSize": 100,
      "EnableAI": true,
      "UmbracoAiProfileAlias": "your-chat-profile-alias",
      "PromptFilePath": "prompt/analysis-prompt.txt",
    }
  }

Also install Umbraco.AI + provider packages and configure connections/profiles in the backoffice AI section.
See: https://docs.umbraco.com/ai-in-umbraco

namespace Umbraco.AI.Diagnostics.Web.Options;



/// <summary>

/// Optional startup seed for the sample web project (Umbraco.AI connections + chat profiles).

/// Binds to <c>AI:Diagnostics:Seed</c>. API keys and Azure settings come from nested <c>Google</c> and <c>AzureOpenAI</c>.

/// </summary>

public sealed class AIDiagnosticsSeedOptions

{

    public const string SectionPath = "AI:Diagnostics:Seed";



    /// <summary>When true, seeds on first run. Idempotent. Off by default so clones without API keys do not log seed warnings.</summary>

    public bool Enabled { get; set; }



    /// <summary>Google Gemini API key for the seeded connection.</summary>

    public GoogleSeedOptions Google { get; set; } = new();



    /// <summary>Azure OpenAI credentials and endpoint for optional seeded connection.</summary>

    public AzureOpenAiSeedOptions AzureOpenAI { get; set; } = new();



    /// <summary>Gemini model id for the chat profile.</summary>

    public string GeminiModelId { get; set; } = "gemini-2.0-flash";



    /// <summary>Which seeded profile becomes the site default: <c>Gemini</c> or <c>AzureOpenAI</c>.</summary>

    public string DefaultProvider { get; set; } = "Gemini";

}



/// <summary>Google provider values used only by the sample-site seed.</summary>

public sealed class GoogleSeedOptions

{

    public string ApiKey { get; set; } = "";

}



/// <summary>Azure OpenAI values used only by the sample-site seed.</summary>

public sealed class AzureOpenAiSeedOptions

{

    public string ApiKey { get; set; } = "";



    public string Endpoint { get; set; } = "";



    public string ChatDeploymentName { get; set; } = "gpt-4o";

}



using System.Text.Json;
using System.Text.Json.Serialization;

namespace Umbraco.AI.Diagnostics.Models
{
    // Typed container for Serilog/Umbraco JSON log lines. Uses JsonPropertyName to map special
    // Serilog names like "@t" and "@l". Any extra properties will be captured in ExtensionData.
    public class JsonLog
    {
        [JsonPropertyName("@t")]
        public string? T { get; set; }

        [JsonPropertyName("Timestamp")]
        public string? Timestamp { get; set; }

        [JsonPropertyName("time")]
        public string? Time { get; set; }

        [JsonPropertyName("@l")]
        public string? L { get; set; }

        [JsonPropertyName("Level")]
        public string? Level { get; set; }

        [JsonPropertyName("@m")]
        public string? M { get; set; }

        [JsonPropertyName("@mt")]
        public string? Mt { get; set; }

        [JsonPropertyName("RenderedMessage")]
        public string? RenderedMessage { get; set; }

        [JsonPropertyName("Message")]
        public string? Message { get; set; }

        [JsonPropertyName("@x")]
        public string? X { get; set; }

        [JsonPropertyName("Exception")]
        public string? Exception { get; set; }

        [JsonPropertyName("SourceContext")]
        public string? SourceContext { get; set; }

        [JsonPropertyName("Logger")]
        public string? Logger { get; set; }

        [JsonPropertyName("Log4NetLevel")]
        public string? Log4NetLevel { get; set; }

        // Capture any other properties
        [JsonExtensionData]
        public Dictionary<string, JsonElement>? ExtensionData { get; set; }
    }
}

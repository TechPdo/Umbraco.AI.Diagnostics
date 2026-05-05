namespace Umbraco.AI.Diagnostics.Models;

/// <summary>
/// Response for listing Umbraco.AI chat profiles in the diagnostics UI.
/// </summary>
public sealed class ChatProfilesResponse
{
    /// <summary>
    /// Chat profiles available for diagnostics (Umbraco.AI capability Chat).
    /// </summary>
    public IReadOnlyList<ChatProfileOptionDto> Profiles { get; init; } = Array.Empty<ChatProfileOptionDto>();

    /// <summary>
    /// Alias of the site's default chat profile from Umbraco.AI settings, if set.
    /// </summary>
    public string? DefaultProfileAlias { get; init; }
}

/// <summary>
/// One selectable chat profile.
/// </summary>
public sealed class ChatProfileOptionDto
{
    public required string Alias { get; init; }

    public required string Name { get; init; }

    public bool IsDefault { get; init; }
}

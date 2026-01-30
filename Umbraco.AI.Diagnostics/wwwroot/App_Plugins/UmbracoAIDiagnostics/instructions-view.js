import { UmbElementMixin as c } from "@umbraco-cms/backoffice/element-api";
import { LitElement as l, html as u, css as d, customElement as g } from "@umbraco-cms/backoffice/external/lit";
var p = Object.getOwnPropertyDescriptor, m = (s, t, r, a) => {
  for (var o = a > 1 ? void 0 : a ? p(t, r) : t, i = s.length - 1, n; i >= 0; i--)
    (n = s[i]) && (o = n(o) || o);
  return o;
};
let e = class extends c(l) {
  render() {
    return u`
      <uui-box headline="Quick Start — AI Diagnostics">
        <div class="content">
          <h2>Quick Start Guide — Umbraco.AI.Diagnostics</h2>

          <section class="instruction-section">
            <h3>⚙️ Prerequisites</h3>
            <ul>
              <li>Umbraco 17+ project</li>
              <li>.NET 10 SDK</li>
              <li>Node.js 18+ (for frontend build)</li>
              <li>An AI provider key or local Ollama instance</li>
            </ul>
          </section>

          <section class="instruction-section">
            <h3>📦 Install Package</h3>
            <p><strong>Recommended — NuGet:</strong></p>
            <uui-code-block language="bash">dotnet add package Umbraco.AI.Diagnostics</uui-code-block>

            <p><strong>Or clone &amp; build:</strong></p>
            <uui-code-block language="bash">
git clone https://github.com/yourusername/Umbraco.AI.Diagnostics.git
cd Umbraco.AI.Diagnostics
./build.sh    # or build.bat on Windows
            </uui-code-block>
          </section>

          <section class="instruction-section">
            <h3>🔒 Configure AI Provider</h3>
            <p>Add to <code>appsettings.json</code>. Example — OpenAI:</p>
            <uui-code-block language="json">
{
  "Umbraco": {
    "AI": {
      "Diagnostics": {
        "AIProvider": "OpenAI",
        "OpenAI": {
          "ApiKey": "sk-your-api-key-here",
          "Model": "gpt-4"
        }
      }
    }
  }
}
            </uui-code-block>

            <p>Example — Ollama (local, free):</p>
            <uui-code-block language="json">
{
  "Umbraco": {
    "AI": {
      "Diagnostics": {
        "AIProvider": "Ollama",
        "Ollama": {
          "Endpoint": "http://localhost:11434",
          "Model": "llama2"
        }
      }
    }
  }
}
            </uui-code-block>

            <p class="note">For Ollama: <code>ollama pull llama2</code> and <code>ollama serve</code>.</p>
          </section>

          <section class="instruction-section">
            <h3>🧩 Register Services</h3>
            <p>Add the diagnostic services in <code>Program.cs</code>:</p>
            <uui-code-block language="csharp">
using Umbraco.AI.Diagnostics.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add after CreateUmbracoBuilder()
builder.Services.AddUmbracoAIDiagnostics(builder.Configuration);

// ... rest of configuration
var app = builder.Build();
app.Run();
            </uui-code-block>
            <p><strong>Note:</strong> Composer auto-registration is included via <code>AIDiagnosticsComposer</code>.</p>
          </section>

          <section class="instruction-section">
            <h3>🛠 Build Frontend (if applicable)</h3>
            <p>If you cloned the repo:</p>
            <uui-code-block language="bash">
npm install
npm run build
            </uui-code-block>
            <p>If installed from NuGet, frontend assets are already built and packaged.</p>
          </section>

          <section class="instruction-section">
            <h3>🚪 Access the Dashboard</h3>
            <ol>
              <li>Start your Umbraco app</li>
              <li>Log in to the backoffice</li>
              <li>Go to <strong>Settings</strong></li>
              <li>Open <strong>AI Diagnostics</strong></li>
            </ol>
          </section>

          <section class="instruction-section">
            <h3>📊 Analyze Logs</h3>
            <ol>
              <li>Select log levels (Error, Critical, Warning)</li>
              <li>Choose time range (1 hour, 24 hours, 7 days)</li>
              <li>Click <em>Analyze Logs</em></li>
              <li>Review AI analysis and download JSON report</li>
            </ol>
          </section>

          <section class="instruction-section">
            <h3>🔎 What the Report Contains</h3>
            <ul>
              <li><strong>Summary statistics</strong> — totals and unique issues</li>
              <li><strong>AI summary</strong> — high-level assessment</li>
              <li><strong>Detailed items</strong> — likely cause, suggested fixes, links, severity</li>
            </ul>
          </section>

          <section class="instruction-section">
            <h3>🩺 Troubleshooting</h3>
            <ul>
              <li><strong>No logs found:</strong> Ensure <code>umbraco/Logs/</code> exists and contains data for the selected range.</li>
              <li><strong>AI client not configured:</strong> Verify API key and that <code>EnableAI</code> is <code>true</code>.</li>
              <li><strong>Dashboard missing:</strong> Run <code>npm run build</code> and confirm <code>umbraco-package.json</code> is included.</li>
              <li><strong>API errors:</strong> Check quotas, network, and server logs in <code>umbraco/Logs/</code>.</li>
            </ul>
          </section>

          <section class="instruction-section">
            <h3>🧰 Programmatic Usage</h3>
            <p>Consume the analysis service in code:</p>
            <uui-code-block language="csharp">
public class MyController : Controller
{
    private readonly ILogAnalysisService _logAnalysis;

    public MyController(ILogAnalysisService logAnalysis) => _logAnalysis = logAnalysis;

    [HttpGet]
    public async Task<IActionResult> GetDiagnostics()
    {
        var report = await _logAnalysis.AnalyzeLogsAsync(
            logLevels: new List&lt;string&gt; { "Error", "Critical" },
            timeRange: "24hours"
        );

        return Json(report);
    }
}
            </uui-code-block>
          </section>

          <section class="instruction-section">
            <h3>🔧 Configuration Reference (examples)</h3>
            <uui-code-block language="json">
{
  "Umbraco": {
    "AI": {
      "Diagnostics": {
        "LogLevels": ["Error","Critical","Warning"],
        "MaxBatchSize": 100,
        "EnableAI": true,
        "AIProvider": "OpenAI"
      }
    }
  }
}
            </uui-code-block>
          </section>

          <section class="instruction-section">
            <h3>📚 Resources</h3>
            <ul>
              <li><a href="https://docs.umbraco.com" target="_blank">Umbraco Documentation</a></li>
              <li><a href="https://docs.umbraco.com/umbraco-cms/extending" target="_blank">Extending Umbraco</a></li>
              <li><a href="https://ollama.ai" target="_blank">Ollama</a> — local model hosting</li>
            </ul>
          </section>
        </div>
      </uui-box>
    `;
  }
};
e.styles = d`
    :host {
      display: block;
      padding: var(--uui-size-space-5);
    }

    .content {
      padding: var(--uui-size-space-4);
    }

    h2 {
      color: var(--uui-color-interactive);
      margin: 0 0 var(--uui-size-space-5) 0;
      font-size: var(--uui-type-h3-size);
      font-weight: 700;
    }

    h3 {
      color: var(--uui-color-interactive);
      margin: 0 0 var(--uui-size-space-3) 0;
      font-size: var(--uui-type-h5-size);
      font-weight: 600;
    }

    .instruction-section {
      margin-bottom: var(--uui-size-space-6);
      padding-bottom: var(--uui-size-space-4);
      border-bottom: 1px solid var(--uui-color-border);
    }

    .instruction-section:last-child {
      border-bottom: none;
    }

    p {
      margin: 0 0 var(--uui-size-space-3) 0;
      color: var(--uui-color-text);
      line-height: 1.6;
    }

    ul, ol {
      margin: var(--uui-size-space-3) 0;
      padding-left: var(--uui-size-space-6);
      color: var(--uui-color-text);
    }

    li {
      margin-bottom: var(--uui-size-space-2);
      line-height: 1.6;
    }

    code {
      background: var(--uui-color-surface-alt);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    uui-code-block {
      margin: var(--uui-size-space-3) 0;
      white-space: pre-wrap;
    }

    .endpoint {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-3);
      padding: var(--uui-size-space-3);
      background: var(--uui-color-surface-alt);
      border-radius: var(--uui-border-radius);
      margin: var(--uui-size-space-3) 0;
    }

    .method {
      background: var(--uui-color-positive);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.85em;
    }

    a {
      color: var(--uui-color-interactive);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .note {
      color: var(--uui-color-text-alt);
      margin-top: var(--uui-size-space-2);
    }

    strong {
      font-weight: 600;
      color: var(--uui-color-text-alt);
    }
  `;
e = m([
  g("umbraco-ai-diagnostics-instructions-view")
], e);
const v = e;
export {
  e as UmbracoAIDiagnosticsInstructionsViewElement,
  v as default
};
//# sourceMappingURL=instructions-view.js.map

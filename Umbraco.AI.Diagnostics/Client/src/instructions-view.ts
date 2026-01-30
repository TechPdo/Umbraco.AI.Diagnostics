import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { LitElement, html, css, customElement } from '@umbraco-cms/backoffice/external/lit';

@customElement('umbraco-ai-diagnostics-instructions-view')
export class UmbracoAIDiagnosticsInstructionsViewElement extends UmbElementMixin(LitElement) {

    render() {
        return html`
      <uui-box headline="Umbraco AI Diagnostics — Readme">
        <div class="content">
          <h2>🤖 Umbraco AI Diagnostics For Umbraco 17+</h2>

          <p><strong>Analyze errors in your Umbraco website using Artificial Intelligence!</strong></p>
          <p>Stop wasting hours reading through log files. Let AI analyze your website's errors and give you clear, actionable solutions in plain English.</p>

          <hr />

          <section class="instruction-section">
            <h3>✨ Features</h3>

            <h4>🧠 Smart AI Analysis</h4>
            <p>Your logs are analyzed by powerful AI models that understand common web application issues and can explain them clearly.</p>

            <h4>🔄 Automatic Grouping</h4>
            <p>If the same error appears 100 times, you'll see it as one issue with a count of "100" — not 100 separate items.</p>

            <h4>🎯 Multiple AI Options</h4>
            <p>Choose from:</p>
            <ul>
              <li><strong>Google Gemini</strong> - Cloud-based, powerful, easy to set up</li>
              <li><strong>Ollama</strong> - FREE, runs on your own computer, no internet needed</li>
              <li><strong>OpenAI</strong> (coming soon!)</li>
              <li><strong>Azure OpenAI</strong> (coming soon!)</li>
            </ul>

            <h4>🎨 Beautiful Dashboard</h4>
            <p>Easy-to-use interface right inside your Umbraco admin panel.</p>

            <h4>📊 Comprehensive Reports</h4>
            <p>Get detailed analysis with:</p>
            <ul>
              <li>Overall health summary</li>
              <li>Likely causes for each issue</li>
              <li>Step-by-step fix suggestions</li>
              <li>Reference documentation links</li>
              <li>Severity assessments</li>
            </ul>
          </section>

          <hr />

          <section class="instruction-section">
            <h3>⚙️ Configuration</h3>

            <h4>Step 1: Choose Your AI Provider</h4>
            <p>You need to pick ONE of these options:</p>

            <h5>🟢 Option 1: Ollama (FREE - Recommended for Beginners)</h5>
            <p>Ollama runs AI on your own computer - completely free!</p>
            <ol>
              <li>Download Ollama: <a href="https://ollama.com" target="_blank">https://ollama.com</a></li>
              <li>Install and start Ollama (run the installer)</li>
              <li>Download an AI model: <uui-code-block language="bash">ollama pull llama3</uui-code-block></li>
            </ol>

            <h5>🔵 Option 2: Google Gemini (Easy Cloud Setup)</h5>
            <ol>
              <li>Get an API Key:
                <ul>
                  <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                  <li>Click "Get API Key"</li>
                  <li>Copy your key</li>
                </ul>
              </li>
              <li>Keep your API key safe — you'll need it in Step 2</li>
            </ol>

            <h4>Step 2: Configure Your Settings</h4>
            <p>Open the file called <code>appsettings.json</code> in your Umbraco project and add this section:</p>

            <uui-code-block language="json">
{
  "AI": {
    "Diagnostics": {
      "LogLevels": ["Error", "Critical"],
      "MaxBatchSize": 100,
      "EnableAI": true,
      "AIProvider": "Ollama",
      "PromptFilePath": "prompt/analysis-prompt.txt",
      "Ollama": {
        "Endpoint": "http://localhost:11434",
        "Model": "llama3"
      },
      "Gemini": {
        "ApiKey": "YOUR-API-KEY-HERE",
        "Model": "gemini-1.5-flash"
      }
    }
  }
}
            </uui-code-block>

            <p><strong>Important:</strong> Replace <code>YOUR-API-KEY-HERE</code> with your actual API key from Step 1.</p>

            <h5>Settings explained</h5>
            <ul>
              <li><strong>LogLevels</strong>: Which severity levels to analyze (Trace, Debug, Information, Warning, Error, Critical). Default: <code>["Error","Critical","Warning"]</code></li>
              <li><strong>MaxBatchSize</strong>: Maximum number of unique issues to analyze at once. Default: <code>100</code></li>
              <li><strong>EnableAI</strong>: <code>true</code> = AI analysis enabled, <code>false</code> = show raw logs</li>
              <li><strong>AIProvider</strong>: Which AI service to use (options: <code>"Ollama"</code> or <code>"Gemini"</code>)</li>
              <li><strong>PromptFilePath</strong>: Optional path to custom prompt file for advanced users</li>
            </ul>

            <h4>Step 3: Start Using It!</h4>
            <ol>
              <li>Start your Umbraco website (press F5 in Visual Studio)</li>
              <li>Log in to the Umbraco admin panel (the backoffice)</li>
              <li>Click on <strong>Settings</strong> in the left menu</li>
              <li>Click <strong>AI Diagnostics</strong></li>
              <li>Choose which types of errors to analyze (Error, Critical, or Warning)</li>
              <li>Select a time range (last hour, day, week, etc.)</li>
              <li>Click the big <strong>Analyze Logs</strong> button</li>
              <li>Wait a few seconds while AI does its magic! ✨</li>
            </ol>
          </section>

          <hr />

          <section class="instruction-section">
            <h3>Understanding Your Results</h3>

            <h4>📈 Summary Statistics</h4>
            <ul>
              <li>Total logs analyzed</li>
              <li>Number of unique issues found</li>
              <li>Overall health assessment from AI</li>
            </ul>

            <h4>🔍 Detailed Analysis for Each Issue</h4>
            <ul>
              <li><strong>Log Entry</strong>: The actual error message and when it occurred</li>
              <li><strong>Occurrence Count</strong>: How many times this exact issue appeared</li>
              <li><strong>Likely Cause</strong>: AI's explanation of what's wrong (in plain English)</li>
              <li><strong>Suggested Fixes</strong>: Step-by-step solutions to try (ordered from easiest to most complex)</li>
              <li><strong>Reference Links</strong>: Helpful documentation and guides</li>
              <li><strong>Severity Assessment</strong>: How serious the issue is (Low, Medium, High, Critical)</li>
            </ul>
          </section>

          <hr />

          <section class="instruction-section">
            <h3>🚀 Coming Soon</h3>
            <ul>
              <li>OpenAI Integration</li>
              <li>Azure OpenAI</li>
              <li>Export to PDF/Excel</li>
              <li>Trend Analysis</li>
              <li>Enhanced Visualizations</li>
            </ul>
          </section>

          <hr />

          <section class="instruction-section">
            <h3>🐛 Issues & Support</h3>
            <p>Found a bug or have a suggestion? We'd love to hear from you!</p>
            <p>Report Issues: <a href="https://github.com/TechPdo/Umbraco.AI.Diagnostics/issues" target="_blank">GitHub Issues</a></p>
            <p>When reporting an issue, please include:</p>
            <ul>
              <li>What you expected to happen</li>
              <li>What actually happened</li>
              <li>Error messages (if any)</li>
              <li>Your configuration (without API keys!)</li>
              <li>Steps to reproduce</li>
            </ul>
          </section>

          <hr />

          <section class="instruction-section">
            <h3>📜 License</h3>
            <p>This project is licensed under the MIT License - see the <a href="https://github.com/TechPdo/Umbraco.AI.Diagnostics/blob/main/LICENSE" target="_blank">LICENSE</a> file for details.</p>
          </section>

          <section class="instruction-section">
            <h3>🙏 Acknowledgments</h3>
            <ul>
              <li>Built with ❤️ for the Umbraco community</li>
              <li>Powered by AI (Gemini, Ollama, and more)</li>
              <li>Lots of coffee ☕</li>
            </ul>
          </section>

          <section class="instruction-section">
            <p><strong>Happy debugging! 🎉</strong></p>
            <p><em>Made with ❤️ for the Umbraco community</em></p>
          </section>
        </div>
      </uui-box>
    `;
    }

    static styles = css`
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

    h4, h5 {
      margin: var(--uui-size-space-2) 0;
      color: var(--uui-color-text);
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
}

export default UmbracoAIDiagnosticsInstructionsViewElement;

declare global {
    interface HTMLElementTagNameMap {
        'umbraco-ai-diagnostics-instructions-view': UmbracoAIDiagnosticsInstructionsViewElement;
    }
}
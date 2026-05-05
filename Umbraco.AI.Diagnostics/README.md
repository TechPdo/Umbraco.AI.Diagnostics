# 🤖 AI Diagnostics For Umbraco 17+

**Analyze errors in your Umbraco website using Artificial Intelligence!**

Stop wasting hours reading through log files. Let AI analyze your website's errors and give you clear, actionable solutions in plain English.

---

## ✨ Features

### 🧠 **Smart AI Analysis**
Your logs are analyzed by powerful AI models that understand common web application issues and can explain them clearly.

### 🔄 **Automatic Grouping**
If the same error appears 100 times, you'll see it as one issue with a count of "100" - not 100 separate items!

### 🎯 **Multiple AI Options**
AI is provided through **[Umbraco.AI](https://docs.umbraco.com/ai-in-umbraco)**. Install provider packages (for example **Google Gemini**, **OpenAI**, **Azure OpenAI**, or others supported by Umbraco.AI) and configure them in the backoffice **AI** section—no `AIProvider` or provider API keys inside `AI:Diagnostics` anymore.

### 🎨 **Beautiful Dashboard**
Easy-to-use interface right inside your Umbraco admin panel.

### 📊 **Comprehensive Reports**
Get detailed analysis with:
- Overall health summary
- Likely causes for each issue
- Step-by-step fix suggestions
- Reference documentation links
- Severity assessments

---

## 📦 Installation

### Using .NET CLI

```bash
dotnet add package AI.Diagnostics
```

### Using NuGet Package Manager

```bash
Install-Package AI.Diagnostics
```

### Using Visual Studio

1. Right-click on your project in Visual Studio
2. Click "Manage NuGet Packages..."
3. Click the "Browse" tab
4. Search for: `AI.Diagnostics`
5. Click "Install"

Installing **`AI.Diagnostics`** also brings in the **`Umbraco.AI`** NuGet dependency. You still add **at least one Umbraco.AI provider package** on your site (see configuration below).

---

## ⚙️ Configuration

### How AI is wired: **Umbraco.AI**

This package **does not** embed Gemini, OpenAI, Ollama, or Azure clients in `appsettings.json` the way older versions did. Instead:

- **`AI.Diagnostics`** depends on **`Umbraco.AI`**.
- **Connections, models, and API keys** live in **Umbraco.AI** (backoffice **AI** section and [Umbraco.AI configuration](https://github.com/umbraco/Umbraco.AI/blob/dev/docs/public/getting-started/configuration.md)).
- **`AI:Diagnostics`** only holds **diagnostics behaviour** (batch size, optional chat profile alias, prompt path, etc.). Log levels are chosen in the backoffice for each analysis.

---

### Step 1: Install Umbraco.AI providers and set up the backoffice

1. Add provider packages compatible with your **`Umbraco.AI`** version, for example:
   ```bash
   dotnet add package Umbraco.AI.Google
   dotnet add package Umbraco.AI.OpenAI
   ```
2. Open the **AI** section in the Umbraco backoffice.
3. Create a **connection**, a **chat profile**, and set a **default chat profile** (or use `UmbracoAiProfileAlias` in Step 2).

---

### Step 2: Configure `appsettings.json` (`AI:Diagnostics`)

Open **`appsettings.json`** in your Umbraco project and add or merge this section.

#### Example

```json
{
  "AI": {
    "Diagnostics": {
      "MaxBatchSize": 100,
      "EnableAI": true,
      "UmbracoAiProfileAlias": "my-diagnostics-profile",
      "PromptFilePath": "prompt/analysis-prompt.txt"
    }
  }
}
```

#### Default values (if you skip a key)

| Setting | Default |
| --------|--------|
| **MaxBatchSize** | `100` |
| **EnableAI** | `true` |
| **UmbracoAiProfileAlias** | *(empty → use Umbraco.AI default chat profile)* |
| **PromptFilePath** | `prompt/analysis-prompt.txt` |

#### Settings explained

- **Log levels** in the UI use Umbraco / Serilog names (`Verbose`, `Debug`, `Information`, `Warning`, `Error`, `Fatal`). Legacy **`Critical`** is accepted and mapped to **`Fatal`** when querying the log viewer.
- **MaxBatchSize**: Maximum number of **unique** issues to analyze in one batch.
- **EnableAI**: `true` = call AI through Umbraco.AI; `false` = grouped logs without AI calls.
- **UmbracoAiProfileAlias**: Optional Umbraco.AI **chat profile alias**. If not set, the site **default chat profile** is used.
- **PromptFilePath**: Optional custom analysis prompt file under the site content root.

> **Note:** Older versions used **`AIProvider`**, **`Gemini`**, **`Ollama`**, **`OpenAI`**, **`AzureOpenAI`** under `AI:Diagnostics`. **That shape is removed.** Configure providers only through **Umbraco.AI**.

---

### Step 3: Start Using It!

1. **Start your Umbraco website** (press F5 in Visual Studio)
2. **Log in** to the Umbraco admin panel (the backoffice)
3. Click on **"Settings"** in the left menu
4. Click **"AI Diagnostics"**
5. Choose which types of errors to analyze (**Error**, **Warning**, **Fatal**)
6. Select a time range (last hour, day, week, etc.)
7. Click the big **"Analyze Logs"** button
8. Wait a few seconds while AI does its magic! ✨

In **Settings → Log Viewer → Search**, you can use **AI Analysis** on individual rows when levels match.

---

### Understanding Your Results

The analysis report includes:

**📈 Summary Statistics**
- Total logs analyzed
- Number of unique issues found
- Overall health assessment from AI

**🔍 Detailed Analysis for Each Issue**
- **Log Entry**: The actual error message and when it occurred
- **Occurrence Count**: How many times this exact issue appeared
- **Likely Cause**: AI's explanation of what's wrong (in plain English!)
- **Suggested Fixes**: Step-by-step solutions to try (ordered from easiest to most complex)
- **Reference Links**: Helpful documentation and guides
- **Severity Assessment**: How serious the issue is (Low, Medium, High, Critical)

---

## 🚀 Coming Soon

We're actively working on exciting new features:

- 📄 **Export to PDF/Excel**: Download analysis reports
- 📊 **Trend Analysis**: Track if errors are increasing or decreasing over time
- 🎨 **Enhanced Visualizations**: More charts and graphs

---

## 🐛 Issues & Support

Found a bug or have a suggestion? We'd love to hear from you!

👉 **Report Issues**: [GitHub Issues](https://github.com/TechPdo/Umbraco.AI.Diagnostics/issues)

When reporting an issue, please include:
- What you expected to happen
- What actually happened  
- Error messages (if any)
- Your configuration (without API keys!)
- Steps to reproduce

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/TechPdo/Umbraco.AI.Diagnostics/blob/main/LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- ❤️ Love for the Umbraco community
- 🤖 Powered by **Umbraco.AI** and your chosen providers
- ☕ Lots of coffee

---

**Happy debugging! 🎉**

*Made with ❤️ for the Umbraco community*

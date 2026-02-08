# 🤖 AI Diagnostics For Umbraco 17+

**Analyze errors in your Umbraco website using Artificial Intelligence!**

Stop wasting hours reading through log files. Let AI analyze your website's errors and give you clear, actionable solutions in plain English.

[![AI.Diagnostics - CI](https://github.com/TechPdo/Umbraco.AI.Diagnostics/actions/workflows/build.yml/badge.svg)](https://github.com/TechPdo/Umbraco.AI.Diagnostics/actions/workflows/build.yml)
[![AI.Diagnostics - Release](https://github.com/TechPdo/Umbraco.AI.Diagnostics/actions/workflows/release.yml/badge.svg)](https://github.com/TechPdo/Umbraco.AI.Diagnostics/actions/workflows/release.yml)
| Package | NuGet |
| ------- | ----- |
| AI.Diagnostics | [![NuGet](https://img.shields.io/nuget/v/AI.Diagnostics)](https://www.nuget.org/packages/AI.Diagnostics) [![NuGet downloads](https://img.shields.io/nuget/dt/AI.Diagnostics.svg)](https://www.nuget.org/packages/AI.Diagnostics) |

---

## ✨ Features

### 🧠 **Smart AI Analysis**
Your logs are analyzed by powerful AI models that understand common web application issues and can explain them clearly.

### 🔄 **Automatic Grouping**
If the same error appears 100 times, you'll see it as one issue with a count of "100" - not 100 separate items!

### 🎯 **Multiple AI Options**
Choose from:
- **Google Gemini** - Cloud-based, powerful, easy to set up
- **Ollama** - FREE, runs on your own computer, no internet needed
- **OpenAI** - Use GPT models for analysis
- **Azure OpenAI** *(coming soon!)*

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

---

## ⚙️ Configuration

### Step 1: Choose Your AI Provider

You need to pick ONE of these options:

#### 🟢 **Option 1: Ollama (FREE - Recommended for Beginners)**

Ollama runs AI on your own computer - completely free!

1. **Download Ollama**: Visit [ollama.com](https://ollama.com) and download it
2. **Install and start Ollama**: Just run the installer
3. **Download an AI model**: Open your terminal and run:
   ```bash
   ollama pull llama3
   ```

That's it! Ollama will run in the background.

#### 🔵 **Option 2: Google Gemini (Easy Cloud Setup)**

Google's Gemini is powerful and has a generous free tier.

1. **Get an API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Click "Get API Key"
   - Copy your key (looks like: `AIzaSyA...`)

#### 🔵 **Option 3: OpenAI**

1. **Get an API Key**:
   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Click "API Keys"
   - Create one by clicking "Create new secret key"

**Keep your API key safe** - you'll need it in Step 2!

---

### Step 2: Configure Your Settings

Open the file called `appsettings.json` in your Umbraco project and add this section:

#### Configuration Options

You can customize these settings:

```json
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
      },
      "OpenAI": {
        "ApiKey": "",
        "Model": "",
        "OrganizationId": null
      }
    }
  }
}
```
**Important:** Replace `YOUR-API-KEY-HERE` with your actual API key from Step 1!

**Settings explained:**

- **LogLevels**: Which severity levels to analyze
  - Options: `"Trace"`, `"Debug"`, `"Information"`, `"Warning"`, `"Error"`, `"Critical"`
  - Default: `["Error", "Critical", "Warning"]`

- **MaxBatchSize**: Maximum number of unique issues to analyze at once
  - Default: 100

- **EnableAI**: Turn AI analysis on/off
  - `true` = AI analysis enabled
  - `false` = Just show raw logs

- **AIProvider**: Which AI service to use
  - Options: `"Ollama"` or `"Gemini"` (more coming soon!)

- **PromptFilePath**: Optional path to custom prompt file for advanced users

---

### Step 3: Start Using It!

1. **Start your Umbraco website** (press F5 in Visual Studio)
2. **Log in** to the Umbraco admin panel (the backoffice)
3. Click on **"Settings"** in the left menu
4. Click **"AI Diagnostics"**
5. Choose which types of errors to analyze (Error, Critical, or Warning)
6. Select a time range (last hour, day, week, etc.)
7. Click the big **"Analyze Logs"** button
8. Wait a few seconds while AI does its magic! ✨

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

- ✅ **Azure OpenAI**: Enterprise-grade OpenAI for Azure customers
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
- 🤖 Powered by AI (Gemini, Ollama, and more!)
- ☕ Lots of coffee

---

**Happy debugging! 🎉**

*Made with ❤️ for the Umbraco community*
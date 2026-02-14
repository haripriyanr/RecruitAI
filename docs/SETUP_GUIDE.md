# Setup Guide

Complete guide to setting up, running, and deploying RecruitAI.

---

## Prerequisites

- A modern browser (Chrome, Firefox, Edge, Safari)
- A local HTTP server (required — `file://` URLs won't work with ES modules)
- API keys for [ScaleDown](https://scaledown.ai) and [Google Gemini](https://aistudio.google.com)

---

## Installation

### Option 1: Clone from GitHub

```bash
git clone https://github.com/<your-username>/RecruitAI.git
cd RecruitAI
```

### Option 2: Download ZIP

Download the repository as a ZIP file from GitHub and extract it.

---

## Running Locally

Since RecruitAI uses ES modules (`import` statements), browsers require HTTP serving. You **cannot** open `index.html` directly via `file://`.

### Using Node.js (npx)

```bash
npx -y serve .
```

Opens at `http://localhost:3000`

### Using Python

```bash
# Python 3
python -m http.server 8000
```

Opens at `http://localhost:8000`

### Using VS Code

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**
3. Opens automatically at `http://127.0.0.1:5500`

---

## API Key Setup

### Step 1: Get a ScaleDown API Key

1. Go to [scaledown.ai](https://scaledown.ai)
2. Sign up for a free account
3. Navigate to the API Keys section
4. Create a new API key and copy it

### Step 2: Get a Google Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API Key** → **Create API key**
4. Copy the generated key

### Step 3: Configure in RecruitAI

1. Open the app in your browser
2. Click the ⚙️ **Settings** icon in the header
3. Paste your **ScaleDown Key** in the first field
4. Paste your **Gemini Key** in the second field
5. Click **Save Keys**
6. The Gemini Model dropdown will auto-populate with available models
7. Select your preferred model (recommended: `gemini-2.0-flash` for speed, `gemini-2.5-pro` for quality)

> **Privacy:** API keys are stored in your browser's `localStorage`. They are only sent to ScaleDown and Google APIs respectively — never to any third-party server.

---

## Usage

### 1. Enter a Job Description

Paste the full job description into the **Job Description** text area. The more detailed the JD, the better the AI analysis.

### 2. Upload Resumes

- **Click** the upload area to browse for PDF files, or
- **Drag and drop** PDF files directly into the upload zone
- Batch upload is supported — select multiple files at once

### 3. Start Screening

Click **Start Screening**. Each candidate goes through three processing stages:

| Stage | Status Display | What Happens |
|---|---|---|
| 1 | `Extracting` | PDF.js reads text from the resume |
| 2 | `Compressing` | ScaleDown compresses the text |
| 3 | `Analyzing` | Gemini scores and analyzes the candidate |
| ✅ | `Done` | Results appear in the ranking table |

### 4. Review Results

- The **Ranked Table** shows all candidates sorted by score (highest first)
- Click the 👁️ **eye icon** on any candidate to open the **Detail View**
- The Detail View has **5 tabs**:
  - **Analysis** — Strengths and weaknesses assessment
  - **Bias Audit** — Flags any potential bias indicators
  - **Culture Fit** — Strong / Moderate / Weak fit rating with justification
  - **Interview Questions** — 3 tailored behavioral questions
  - **Offer Letter** — AI-drafted offer letter template

### 5. Compression Stats

After screening completes, a green info bar appears below the Start Screening button showing:
- **Compression percentage** — how much text ScaleDown removed
- **Tokens saved** — estimated API token savings (~4 chars per token)

---

## Deploying to GitHub Pages

1. Push all files to a GitHub repository
2. Go to **Settings → Pages** in the repository
3. Under **Source**, select the branch (e.g., `main`) and folder (`/ (root)`)
4. Click **Save**
5. Your site will be live at: `https://<username>.github.io/RecruitAI/`

> GitHub Pages serves files over HTTPS, so ES modules work perfectly with no additional configuration needed.

---

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| Blank page on `file://` | ES modules blocked on file:// | Use a local HTTP server (see above) |
| "No models found" after saving keys | Invalid Gemini API key | Verify key at [aistudio.google.com](https://aistudio.google.com) |
| `ScaleDown failed to return compressed prompt` | Invalid ScaleDown key or quota exceeded | Check key validity and usage limits |
| Scores seem wrong or inconsistent | Model variation | Try a different Gemini model or re-run |
| Theme doesn't persist | localStorage disabled | Enable localStorage in browser settings |
| File upload not working | Non-PDF file selected | Only `.pdf` files are accepted |

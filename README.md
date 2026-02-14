# RecruitAI — AI-Powered Recruitment Screening Agent

<p align="center">
  <img src="logo.png" alt="RecruitAI Logo" width="80">
</p>

<p align="center">
  <strong>Screen candidates with AI — not bias.</strong><br>
  A static web app that extracts, compresses, and analyzes resumes against job descriptions using ScaleDown and Google Gemini APIs.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Gemini_API-4285F4?logo=google&logoColor=white" alt="Gemini">
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| **PDF Resume Parsing** | Client-side text extraction using PDF.js — no uploads to any server |
| **Context Compression** | ScaleDown API reduces resume text to only JD-relevant content |
| **Compression Stats** | Shows % compressed and tokens saved after each screening run |
| **AI Scoring (0–100)** | Gemini rates candidates based on job description fit |
| **Bias Audit** | Flags potential bias triggers (gender, age, ethnicity indicators) |
| **Culture Fit Assessment** | Evaluates communication style, teamwork, and company value alignment |
| **Interview Questions** | Auto-generates 3 tailored behavioral interview questions |
| **Offer Letter Draft** | AI-generated offer letter template with role details from the JD |
| **Model Selection** | Choose any Gemini LLM from a dynamically fetched list |
| **Dark / Light Theme** | System preference auto-detection with manual toggle |
| **Mobile Responsive** | Optimized layout for phones and tablets |
| **Privacy-First** | API keys stored in `localStorage`, never sent to any third-party |

---

## 🏗️ Architecture

> **📄 PDF Resumes** + **📋 Job Description**
> 
> ⬇️ &nbsp; *Step 1 — PDF.js extracts raw text from each resume*
> 
> **Raw Resume Text** + **Job Description**
> 
> ⬇️ &nbsp; *Step 2 — ScaleDown API compresses text to JD-relevant summary*
> 
> **Compressed Summary** + **Job Description**
> 
> ⬇️ &nbsp; *Step 3 — Google Gemini API analyzes and scores the candidate*
> 
> ✅ **Score (0–100)** · 📝 **Analysis** · ⚖️ **Bias Audit** · 🤝 **Culture Fit** · ❓ **Interview Questions** · 📨 **Offer Letter**
> 
> ⬇️ &nbsp; *Results ranked and displayed*
> 
> **📊 Ranked Candidate Dashboard**

---

## 🔄 Screening Pipeline

Each candidate goes through three sequential steps:

### Step 1 — Text Extraction (Client-Side)

PDF.js extracts raw text from uploaded resumes entirely in the browser. No files are uploaded to any server.

```javascript
// PDF.js v5 loaded as an ES module
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/.../pdf.min.mjs';

const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ');
}
```

### Step 2 — Context Compression (ScaleDown API)

The raw resume text is sent to ScaleDown along with a prompt derived from the Job Description. ScaleDown compresses it into a concise, JD-relevant summary.

**Endpoint:** `POST https://api.scaledown.xyz/compress/raw/`

**Headers:**
```
x-api-key: <your-scaledown-key>
Content-Type: application/json
```

**Request Body:**
```json
{
    "context": "<full resume text>",
    "prompt": "This is a resume. The Job Description is: <JD excerpt>... Extract key skills, experience, and education relevant to the JD. Identify any potential bias triggers. Keep it concise for an ATS.",
    "model": "gpt-4o",
    "scaledown": { "rate": "auto" }
}
```

**Response:** Returns `compressed_prompt` — the condensed resume summary.

**Why compress?** Raw resumes can be thousands of tokens. Compression reduces noise, lowers API costs, and keeps the Gemini prompt focused on what matters. After screening, the app displays a **compression stats bar** showing the % saved and estimated tokens saved across all resumes.

### Step 3 — AI Analysis (Google Gemini API)

The compressed summary + full JD are sent to the user-selected Gemini model. The model returns a structured JSON analysis.

**Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent?key=<key>`

**Request Body:**
```json
{
    "contents": [{ "parts": [{ "text": "<prompt with JD + compressed resume>" }] }],
    "generationConfig": { "responseMimeType": "application/json" }
}
```

**Response (JSON):**
```json
{
    "score": 85,
    "summary": "**Strengths:** 5+ years in React... **Weaknesses:** No backend experience...",
    "bias_report": "No significant bias indicators detected...",
    "culture_fit": "**Strong Fit** — demonstrates clear teamwork and leadership traits...",
    "questions": "1. Tell me about a time you led a cross-functional team...",
    "offer_letter": "Dear [Candidate], We are pleased to offer you the position of..."
}
```

### Model Listing (Gemini API)

Available models are fetched dynamically from Google's API. The list is refined for usability:
- **Capability Filter**: Only models supporting `generateContent` (actual LLMs) are shown.
- **Strict Exclusion**: Non-chat models (vision, audio, tts, robotics, embedding, computer-use) are hidden.
- **A–Z Sorting**: Models are listed in alphabetical order for consistent and predictable navigation.

**Endpoint:** `GET https://generativelanguage.googleapis.com/v1beta/models?key=<key>`

---

## 🔑 API Configuration

You need two API keys. Enter them via the ⚙️ Settings panel in the app.

| Key | Provider | Purpose | Get it from |
|---|---|---|---|
| **ScaleDown** | ScaleDown | Resume text compression | [scaledown.ai](https://scaledown.ai) |
| **Gemini** | Google | AI analysis & scoring | [aistudio.google.com](https://aistudio.google.com) |

> **Storage:** Keys are saved in your browser's `localStorage` and are only sent to the respective API endpoints. They are never stored on any remote server.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Structure** | HTML5 (Semantic) |
| **Styling** | CSS3 (Vanilla — Glassmorphism, CSS Grid, Custom Properties) |
| **Logic** | JavaScript ES6+ |
| **PDF Parsing** | [PDF.js](https://mozilla.github.io/pdf.js/) v5.4 |
| **Markdown Rendering** | [Marked.js](https://marked.js.org/) v16.3 |
| **Icons** | [Font Awesome](https://fontawesome.com/) v7.0 |
| **Typography** | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |

---

## 🚀 Getting Started

> **Note:** This app uses ES modules, so it must be served over HTTP — opening `index.html` directly via `file://` won't work.

### Clone & Run Locally

```bash
git clone https://github.com/<your-username>/RecruitAI.git
cd RecruitAI
npx -y serve .
```

Then open `http://localhost:3000` in your browser.

**Alternative local servers:**

```bash
# Python
python -m http.server 8000

# VS Code — install the "Live Server" extension and click "Go Live"
```

### Setup

1. Click ⚙️ **Settings** and enter your API keys ([ScaleDown](https://scaledown.ai) + [Gemini](https://aistudio.google.com))
2. Select a Gemini model from the dropdown
3. Paste a Job Description, upload resumes (PDF), and click **Start Screening**

### Deploy to GitHub Pages

1. Push all files to a GitHub repository
2. Go to **Settings → Pages**
3. Set the source branch (e.g., `main`) and root (`/`)
4. Your site will be live at `https://<username>.github.io/RecruitAI/`

---

## 📂 Project Structure

```
RecruitAI/
├── index.html      # Main HTML structure with semantic sections
├── style.css       # Glassmorphism UI, themes, responsive layout
├── script.js       # Application logic, API calls, state management (ES module)
├── logo.png        # Application logo and favicon
├── LICENSE         # MIT License
├── README.md       # This file
├── docs/           # Detailed documentation
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── SETUP_GUIDE.md
│   └── FEATURES.md
├── demo/           # Sample job description and resumes for testing
│   ├── Job_Description.txt
│   └── resumes/    # 5 pre-generated PDF resumes
```

---

## 📚 Documentation

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System overview, data flow, state management, and design decisions |
| [API Reference](docs/API_REFERENCE.md) | ScaleDown & Gemini endpoints, request/response formats, prompt template |
| [Setup Guide](docs/SETUP_GUIDE.md) | Installation, local servers, API key setup, deployment, troubleshooting |
| [Features](docs/FEATURES.md) | In-depth documentation of all 12 features |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** this repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-username>/RecruitAI.git
   ```
3. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and test in the browser
5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. **Push** and open a **Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Ideas for Contributions

- 🔧 Add support for `.docx` resume uploads
- 📊 Export screening results as CSV/PDF
- 🧪 Add unit tests for API response handling
- 🌐 Add i18n (internationalization) support
- 📈 Add a score distribution chart
- 🔒 Implement Web Crypto API encryption for stored keys

---

## 🛡️ Security Notes

- API keys are stored in `localStorage` (browser-only, never transmitted to third parties)
- All API calls go directly from your browser to ScaleDown / Google — no intermediary server
- Resume data is processed client-side and is not stored beyond the browser session
- For shared or public machines, clear site data after use

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <strong>haripriyanr</strong>
</p>

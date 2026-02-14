# Architecture

RecruitAI runs **entirely client-side** — there is no backend server. All processing, API calls, and data handling happen in the browser.

---

## System Overview

```
Browser (Client-Side Only)
├── UI Layer          → HTML5 + CSS3 (Glassmorphism, CSS Grid)
├── Application Logic → JavaScript ES6+ (ES Module)
├── PDF Extraction    → PDF.js v5 (imported as ESM)
├── Compression       → ScaleDown API (external)
├── AI Analysis       → Google Gemini API (external)
└── Rendering         → Marked.js v16 (Markdown → HTML)
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUTS                              │
│                                                                 │
│   📋 Job Description (text)    📄 PDF Resumes (files)           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: TEXT EXTRACTION (Client-Side)                          │
│                                                                 │
│  PDF.js reads each PDF as an ArrayBuffer, iterates through      │
│  pages, and extracts text content. No file leaves the browser.  │
│                                                                 │
│  Input:  PDF File (ArrayBuffer)                                 │
│  Output: Raw text string (can be thousands of characters)       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: CONTEXT COMPRESSION (ScaleDown API)                    │
│                                                                 │
│  Raw resume text + JD-derived prompt are sent to ScaleDown.     │
│  ScaleDown returns a compressed, JD-relevant summary.           │
│                                                                 │
│  Input:  Full resume text + JD prompt                           │
│  Output: Compressed summary (~60–80% smaller)                   │
│  Stats:  Original vs compressed sizes tracked for display       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: AI ANALYSIS (Google Gemini API)                        │
│                                                                 │
│  Compressed summary + full JD are sent to the user-selected     │
│  Gemini model. Returns structured JSON with 6 fields.           │
│                                                                 │
│  Input:  Compressed resume + Job Description                    │
│  Output: { score, summary, bias_report, culture_fit,            │
│            questions, offer_letter }                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  RENDERING                                                      │
│                                                                 │
│  - Candidates sorted by score → Ranked Table                    │
│  - Click any candidate → 5-tab Detail View                      │
│  - Markdown fields rendered via Marked.js                       │
│  - Compression stats bar shows % saved + tokens saved           │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

| File | Purpose | Lines |
|---|---|---|
| `index.html` | Semantic HTML5 structure, all UI sections | ~155 |
| `style.css` | Full styling — themes, glassmorphism, responsive, animations | ~790 |
| `script.js` | Application logic — state, APIs, DOM updates (ES module) | ~510 |
| `logo.png` | App logo, also used as favicon | — |

---

## State Management

All application state lives in a single `state` object inside `script.js`:

```javascript
const state = {
    scaledownKey: '',      // ScaleDown API key (from localStorage)
    geminiKey: '',         // Gemini API key (from localStorage)
    geminiModel: '',       // Selected Gemini model ID
    theme: 'light',       // Current theme ('light' or 'dark')
    files: [],             // Uploaded file references
    candidates: []         // Candidate objects with analysis results
};
```

Each candidate object accumulates data through the pipeline:

```javascript
{
    id: 'unique-id',
    name: 'Resume.pdf',
    file: File,             // Original PDF file reference
    status: 'Done',         // Pending → Extracting → Compressing → Analyzing → Done
    score: 85,              // AI-generated score (0–100)
    analysis: '...',        // Markdown: strengths/weaknesses
    bias: '...',            // Markdown: bias audit report
    culture: '...',         // Markdown: culture fit assessment
    questions: '...',       // Markdown: 3 interview questions
    offer: '...'            // Markdown: offer letter draft
}
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **No backend** | Simplifies deployment, eliminates server costs, keeps data private |
| **ES modules** | Required by PDF.js v5; enables modern `import` syntax |
| **localStorage for keys** | Persists API keys across sessions without a server |
| **ScaleDown before Gemini** | Reduces token count → lower API costs, less noise |
| **Structured JSON output** | `responseMimeType: "application/json"` forces Gemini to return parseable JSON |
| **Markdown rendering** | Gemini returns markdown in its analysis — Marked.js converts to rich HTML |
| **CSS Custom Properties** | Single source of truth for theming — light/dark switch is instant |

---

## Security Model

- **API keys** are stored in `localStorage` (browser-only, never transmitted to third parties)
- **Resume data** is processed in-memory and never persisted beyond the browser session
- **All API calls** go directly from the browser to ScaleDown / Google — no intermediary
- **No cookies, no tracking, no analytics** are used
- **ES module** script tag prevents execution in legacy browsers that don't support CORS

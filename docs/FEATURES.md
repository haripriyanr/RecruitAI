# Features

Detailed documentation of every feature in RecruitAI.

---

## PDF Resume Parsing

**How it works:** PDF.js v5 (loaded as an ES module) reads uploaded PDF files as `ArrayBuffer` objects, iterates through every page, and extracts text content using `getTextContent()`.

**Key details:**
- Runs entirely in the browser — no files are uploaded to any server
- Supports multi-page PDFs
- Batch upload via drag-and-drop or file picker
- Only `.pdf` files are accepted (validated by MIME type `application/pdf`)

**Processing flow:**
```
PDF File → ArrayBuffer → PDF.js → Per-page text extraction → Concatenated string
```

---

## Context Compression (ScaleDown)

**Why compress?** Raw resume text can be thousands of tokens. Sending all of it to Gemini would:
- Cost more in API tokens
- Introduce noise (irrelevant details)
- Reduce analysis accuracy

**How it works:** ScaleDown takes the full resume text and a JD-derived prompt, then returns a compressed summary focusing only on JD-relevant skills, experience, and education.

**Compression prompt:**
```
This is a resume. The Job Description is: <JD excerpt>...
Extract key skills, experience, and education relevant to the JD.
Identify any potential bias triggers (gender, age, ethnicity indicators).
Keep it concise for an ATS.
```

**Typical results:** 60–80% compression rate, preserving only the information that matters for the specific role.

---

## Compression Stats

**What it shows:** After all candidates are processed, a green info bar appears below the Start Screening button displaying:

- **Compression percentage** — `(1 - compressed/original) × 100`
- **Tokens saved** — `(original - compressed) ÷ 4` (approximate, ~4 characters per token)
- **Resume count** — how many resumes were processed

**Example output:**
> 🗜️ ScaleDown compressed 72.3% — saved ~4,218 tokens across 5 resumes

**Visibility:** Hidden on page load, hidden when re-running screening, shown only after a completed screening run.

---

## AI Scoring (0–100)

**How it works:** Gemini evaluates the compressed resume against the full job description and assigns a score from 0 to 100.

**Score interpretation:**

| Range | Badge Color | Meaning |
|---|---|---|
| 80–100 | 🟢 Green | Strong match — meets or exceeds most JD requirements |
| 60–79 | 🟡 Yellow | Partial match — meets some requirements, has notable gaps |
| 0–59 | 🔴 Red | Weak match — significant skill or experience gaps |

**Ranking:** Candidates are automatically sorted by score (highest first) in the results table.

---

## Bias Audit

**Purpose:** Identifies potential bias triggers in resume content that could unfairly influence hiring decisions.

**What it checks:**
- Gender indicators (names, pronouns, gendered language)
- Age indicators (graduation dates, outdated technologies)
- Ethnicity indicators (cultural identifiers, location-based assumptions)
- Other potential bias triggers

**Output:** A markdown report per candidate, displayed in the **Bias Audit** tab. May include findings like "None detected" or specific flags with mitigation suggestions.

---

## Culture Fit Assessment

**Purpose:** Evaluates how well a candidate would align with typical company culture and values.

**Evaluation criteria:**
- Communication style (formal vs. collaborative)
- Teamwork indicators (group projects, cross-functional experience)
- Leadership traits (mentoring, initiative, ownership)
- Alignment with common company values

**Rating scale:**

| Rating | Meaning |
|---|---|
| **Strong Fit** | Clear evidence of alignment on multiple dimensions |
| **Moderate Fit** | Some alignment, some areas of uncertainty |
| **Weak Fit** | Limited evidence of cultural alignment |

**Output:** A justified assessment with the rating and supporting evidence from the resume.

---

## Interview Questions

**Purpose:** Generates 3 behavioral interview questions tailored specifically to each candidate's background and the JD requirements.

**Question characteristics:**
- Based on gaps or interesting points in the candidate's profile
- Follow the STAR format (Situation, Task, Action, Result)
- Relevant to the specific role and candidate combination
- Different for each candidate — not generic templates

---

## Offer Letter Draft

**Purpose:** Generates a professional offer letter template for each candidate.

**Contents:**
- Candidate's name (from resume filename)
- Role title (from the job description)
- Congratulatory opening paragraph
- Key responsibilities summary
- Compensation placeholder (`[To be discussed]`)
- Standard closing

**Note:** This is a draft template meant as a starting point. Hiring teams should customize compensation, benefits, start date, and legal terms before sending.

---

## Model Selection

**How it works:** When the user saves their Gemini API key, the app fetches all available models from the Gemini API and populates a dropdown.

**Filtering:** Only relevant models are shown. These are excluded:
- Image generation models
- Text-to-speech (TTS) models
- Robotics models
- Computer-use models
- Deep research models
- Video generation (Veo) models
- Experimental/internal models

**Persistence:** The selected model is saved to `localStorage` and automatically restored on the next visit.

**Recommended models:**
- `gemini-2.0-flash` — Fast, good for quick screening
- `gemini-2.5-pro` — Higher quality analysis, slower

---

## Dark / Light Theme

**How it works:** The theme system uses CSS custom properties (variables) that change based on the `data-theme` attribute on the `<html>` element.

**Auto-detection:** On first visit, the app checks `window.matchMedia('(prefers-color-scheme: dark)')` and applies the system preference.

**Manual toggle:** Click the 🌙/☀️ icon in the header to switch themes.

**Persistence:** Theme preference is saved to `localStorage` as `sa_theme`.

**Implementation:** All colors, backgrounds, borders, and shadows reference CSS variables — switching the theme changes all UI colors instantly with a smooth CSS transition.

---

## Mobile Responsive

**Breakpoints:**

| Breakpoint | Layout Change |
|---|---|
| `> 768px` | Two-column grid (input panel + results panel) |
| `≤ 768px` | Single-column stacked layout |

**Mobile optimizations:**
- Full-width cards and inputs
- Horizontally scrollable tabs
- Touch-friendly button sizes
- Scrollable results table
- Adjusted font sizes and spacing

# API Reference

RecruitAI integrates with two external APIs. All calls are made directly from the browser — no backend proxy is involved.

---

## ScaleDown API

**Purpose:** Compresses raw resume text into a concise, JD-relevant summary.

### Compress Raw Text

```
POST https://api.scaledown.xyz/compress/raw/
```

**Headers:**

| Header | Value |
|---|---|
| `x-api-key` | Your ScaleDown API key |
| `Content-Type` | `application/json` |

**Request Body:**

```json
{
    "context": "<full resume text extracted from PDF>",
    "prompt": "This is a resume. The Job Description is: <JD excerpt>... Extract key skills, experience, and education relevant to the JD. Identify any potential bias triggers (gender, age, ethnicity indicators). Keep it concise for an ATS.",
    "model": "gpt-4o",
    "scaledown": {
        "rate": "auto"
    }
}
```

| Field | Type | Description |
|---|---|---|
| `context` | string | The full text to compress (resume content) |
| `prompt` | string | Instructions for how to compress, including JD context |
| `model` | string | The underlying LLM model for compression |
| `scaledown.rate` | string | Compression aggressiveness (`"auto"` lets ScaleDown decide) |

**Response:**

```json
{
    "results": {
        "compressed_prompt": "Senior full-stack developer with 6 years experience in React, Node.js, Python..."
    }
}
```

> **Note:** The API response structure can vary — the app handles both `data.results.compressed_prompt` and `data.compressed_prompt` formats.

**Error Handling:**

If neither response format returns a `compressed_prompt`, the app throws: `"ScaleDown failed to return compressed prompt"`

---

## Google Gemini API

**Purpose:** Analyzes compressed resume summaries against job descriptions and generates structured screening reports.

### Generate Content (Screening Analysis)

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

**Headers:**

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |

**Path Parameters:**

| Parameter | Description |
|---|---|
| `model` | Gemini model ID (e.g., `gemini-2.0-flash`) |

**Query Parameters:**

| Parameter | Description |
|---|---|
| `key` | Your Gemini API key |

**Request Body:**

```json
{
    "contents": [
        {
            "parts": [
                {
                    "text": "<prompt with JD + compressed resume>"
                }
            ]
        }
    ],
    "generationConfig": {
        "responseMimeType": "application/json"
    }
}
```

> `responseMimeType: "application/json"` forces the model to return valid, parseable JSON.

**Prompt Template:**

```
You are an expert Recruitment AI.
JOB DESCRIPTION: {jd}

CANDIDATE SUMMARY: {compressedResume}

Task:
1. Score the candidate (0-100) based on JD fit.
2. Write a brief analysis (strengths/weaknesses).
3. Create a strict Bias Audit (any detected bias in resume?).
4. Assess Culture Fit: evaluate communication style, teamwork indicators,
   leadership traits, and alignment with typical company values.
   Rate as Strong Fit / Moderate Fit / Weak Fit with justification.
5. Generate 3 behavioral interview questions tailored to this candidate.
6. Draft a short Offer Letter template addressed to the candidate,
   including role title from the JD, a congratulatory opening,
   key responsibilities summary, and a placeholder for compensation.

Return ONLY valid JSON in this format:
{
    "score": 85,
    "summary": "markdown string...",
    "bias_report": "markdown string...",
    "culture_fit": "markdown string...",
    "questions": "markdown string...",
    "offer_letter": "markdown string..."
}
```

**Response:**

```json
{
    "candidates": [
        {
            "content": {
                "parts": [
                    {
                        "text": "{ \"score\": 85, \"summary\": \"...\", ... }"
                    }
                ]
            }
        }
    ]
}
```

The text field contains a JSON string which is parsed into:

| Field | Type | Description |
|---|---|---|
| `score` | number | Candidate fit score from 0 to 100 |
| `summary` | string | Markdown analysis with strengths and weaknesses |
| `bias_report` | string | Markdown bias audit findings |
| `culture_fit` | string | Markdown culture fit assessment (Strong/Moderate/Weak) |
| `questions` | string | Markdown with 3 behavioral interview questions |
| `offer_letter` | string | Markdown offer letter template |

---

### List Models

```
GET https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}
```

**Purpose:** Fetches all available Gemini models to populate the model selector dropdown.

**Filtering Logic:**

The app filters the response to show only relevant text-generation models:

1. Must support `generateContent` generation method
2. Must start with `models/gemini-`
3. Excludes models containing: `image`, `tts`, `robotics`, `computer-use`, `deep-research`, `nano-banana`, `veo`

---

## API Key Storage

| Key | localStorage Key | Used For |
|---|---|---|
| ScaleDown | `sa_scaledown_key` | Resume compression |
| Gemini | `sa_gemini_key` | AI analysis + model listing |
| Selected Model | `sa_gemini_model` | Persists model choice |
| Theme | `sa_theme` | Persists light/dark preference |

All keys are stored in `localStorage` and are never sent to any third-party service beyond the respective API endpoints.

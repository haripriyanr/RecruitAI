/**
 * RecruitAI - Recruitment Screening Agent
 * 
 * ES module handling client-side logic for the RecruitAI application.
 * Manages state, file uploads, API integrations (ScaleDown + Gemini),
 * compression stats, and UI rendering.
 * 
 * Dependencies: PDF.js v5 (ESM), Marked.js v16 (UMD global), Font Awesome v7
 * 
 * @author haripriyanr
 */

import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs';

document.addEventListener('DOMContentLoaded', () => {

    /**
     * Application State
     * Stores API keys, theme preference, and processed candidate data.
     */
    const state = {
        scaledownKey: localStorage.getItem('sa_scaledown_key') || '',
        geminiKey: localStorage.getItem('sa_gemini_key') || '',
        geminiModel: localStorage.getItem('sa_gemini_model') || '',
        theme: localStorage.getItem('sa_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
        files: [],
        candidates: [] // Stores candidate objects with metadata and analysis results
    };

    /**
     * DOM Elements
     * Cached references to key UI elements for performance.
     */
    const themeToggle = document.getElementById('theme-toggle');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const saveKeysBtn = document.getElementById('save-keys');
    const geminiModelSelect = document.getElementById('gemini-model');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('resume-upload');
    const processBtn = document.getElementById('process-btn');
    const uploadStats = document.getElementById('upload-stats');
    const candidatesBody = document.getElementById('candidates-body');
    const detailView = document.getElementById('detail-view');
    const compressionStats = document.getElementById('compression-stats');
    const compressionText = document.getElementById('compression-text');

    /* -------------------------------------------------------------------------- */
    /*                               Initialization                               */
    /* -------------------------------------------------------------------------- */

    // Apply saved or default theme on load
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();

    // Pre-fill API keys if available in localStorage
    if (state.scaledownKey) document.getElementById('scaledown-key').value = state.scaledownKey;
    if (state.geminiKey) {
        document.getElementById('gemini-key').value = state.geminiKey;
        fetchGeminiModels(state.geminiKey);
    }

    /* -------------------------------------------------------------------------- */
    /*                               Event Listeners                              */
    /* -------------------------------------------------------------------------- */

    /**
     * Theme Toggle
     * Switches between light and dark modes and persists preference.
     */
    themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('sa_theme', state.theme);
        document.documentElement.setAttribute('data-theme', state.theme);
        updateThemeIcon();
    });

    function updateThemeIcon() {
        themeToggle.querySelector('i').className = state.theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    // Toggle Settings Panel visibility
    settingsBtn.addEventListener('click', () => settingsPanel.classList.toggle('hidden'));

    /**
     * Save API Keys
     * Persists user API keys to localStorage for future sessions.
     */
    saveKeysBtn.addEventListener('click', () => {
        state.scaledownKey = document.getElementById('scaledown-key').value.trim();
        state.geminiKey = document.getElementById('gemini-key').value.trim();
        localStorage.setItem('sa_scaledown_key', state.scaledownKey);
        localStorage.setItem('sa_gemini_key', state.geminiKey);

        if (state.geminiKey) {
            fetchGeminiModels(state.geminiKey);
        }

        settingsPanel.classList.add('hidden');
        alert('Keys Saved!');
    });

    /**
     * Model Selection Change
     * Updates state and persistence when user selects a different model.
     */
    geminiModelSelect.addEventListener('change', () => {
        state.geminiModel = geminiModelSelect.value;
        localStorage.setItem('sa_gemini_model', state.geminiModel);
    });

    /**
     * Password Visibility Toggle
     * Toggles input type between 'password' and 'text' for API key fields.
     */
    document.querySelectorAll('.eye-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const inputId = btn.getAttribute('data-target');
            const input = document.getElementById(inputId);
            const icon = btn.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    /* -------------------------------------------------------------------------- */
    /*                               File Handling                                */
    /* -------------------------------------------------------------------------- */

    // Drag and Drop & Click Upload handlers
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    /**
     * Handles new file additions.
     * Filters for PDFs, creates candidate objects, and updates the UI.
     * @param {FileList} fileList - List of files selected by user
     */
    function handleFiles(fileList) {
        for (const file of fileList) {
            if (file.type === 'application/pdf') {
                const id = Date.now() + Math.random().toString(36).substr(2, 9);
                state.candidates.push({
                    id,
                    name: file.name,
                    file: file,
                    status: 'Pending'
                });
            }
        }
        updateFileList();
        processBtn.disabled = state.candidates.length === 0;
    }

    /**
     * Renders the list of uploaded files showing their status.
     * Triggers overflow check for marquee animation.
     */
    function updateFileList() {
        uploadStats.innerHTML = state.candidates.map(c => `
            <div class="file-item">
                <div class="file-name-container" title="${c.name}">
                    <div class="file-name-scroll">
                        <span>${c.name}</span>
                    </div>
                </div>
                <span class="file-status ${c.status.toLowerCase()}">${c.status}</span>
            </div>
        `).join('');

        // Defer overflow check to next tick to ensure DOM rendering is complete
        setTimeout(checkOverflows, 0);
    }

    /**
     * Checks if file names overflow their containers and applies marquee animation.
     * Duplicates text content to create a seamless infinite scroll effect.
     */
    function checkOverflows() {
        document.querySelectorAll('.file-name-container').forEach(container => {
            const scroll = container.querySelector('.file-name-scroll');
            const span = scroll.querySelector('span');

            // Reset content to single span to measure accurately first
            if (scroll.children.length > 1) {
                scroll.innerHTML = `<span>${span.innerText}</span>`;
            }

            if (scroll.scrollWidth > container.clientWidth) {
                // Duplicate text for seamless scrolling
                const originalText = scroll.innerHTML;
                scroll.innerHTML += originalText;
                scroll.classList.add('scroll-active');
            } else {
                scroll.classList.remove('scroll-active');
            }
        });
    }

    /* -------------------------------------------------------------------------- */
    /*                             Processing Logic                               */
    /* -------------------------------------------------------------------------- */

    /**
     * Main Processing Handler
     * Iterates through pending candidates and runs the screening pipeline:
     * 1. Extract Text (PDF.js)
     * 2. Compress Context (ScaleDown API)
     * 3. Analyze & Score (Gemini API)
     */
    processBtn.addEventListener('click', async () => {
        const jd = document.getElementById('job-description').value.trim();
        if (!jd) return alert('Please enter a Job Description');
        if (!state.scaledownKey || !state.geminiKey) return alert('Please configure API keys');

        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Screening...';
        compressionStats.classList.add('hidden');

        let totalOriginal = 0;
        let totalCompressed = 0;

        for (const candidate of state.candidates) {
            if (candidate.status === 'Done') continue;

            try {
                // Step 1: Text Extraction
                candidate.status = 'Extracting';
                updateFileList();
                const text = await extractTextFromPDF(candidate.file);

                // Step 2: Context Compression
                // ScaleDown reduces the resume text to key relevance relative to the JD
                candidate.status = 'Compressing';
                updateFileList();
                const compressed = await callScaleDown(text, jd);

                // Track compression metrics
                totalOriginal += text.length;
                totalCompressed += compressed.length;

                // Step 3: AI Analysis
                // Gemini scores the compressed summary and generates the report
                candidate.status = 'Analyzing';
                updateFileList();
                const analysis = await callGemini(compressed, jd);

                // Store Results
                candidate.score = analysis.score;
                candidate.analysis = analysis.summary;
                candidate.bias = analysis.bias_report;
                candidate.culture = analysis.culture_fit;
                candidate.questions = analysis.questions;
                candidate.offer = analysis.offer_letter;
                candidate.status = 'Done';
            } catch (err) {
                console.error(err);
                candidate.status = 'Error';
            }
            updateFileList();
            renderTable();
        }

        // Display compression stats
        if (totalOriginal > 0) {
            const pct = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
            const savedChars = totalOriginal - totalCompressed;
            const savedTokens = Math.round(savedChars / 4); // ~4 chars per token
            compressionText.textContent = `ScaleDown compressed ${pct}% — saved ~${savedTokens.toLocaleString()} tokens across ${state.candidates.filter(c => c.status === 'Done').length} resumes`;
            compressionStats.classList.remove('hidden');
        }

        processBtn.disabled = false;
        processBtn.innerHTML = '<i class="fa-solid fa-microchip"></i> Start Screening';
    });

    /**
     * Extracts raw text from a PDF file using PDF.js.
     * @param {File} file - The PDF file object
     * @returns {Promise<string>} Concatenated text from all pages
     */
    async function extractTextFromPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ');
        }
        return fullText;
    }

    /**
     * Calls ScaleDown API to compress the resume text.
     * ScaleDown transforms long raw text into a concise, relevant summary based on the prompt.
     * @param {string} context - The full resume text
     * @param {string} jd - The job description for relevance context
     * @returns {Promise<string>} Compressed resume text
     */
    async function callScaleDown(context, jd) {
        const prompt = `
        This is a resume. The Job Description is: ${jd.substring(0, 500)}...
        Extract key skills, experience, and education relevant to the JD.
        Identify any potential bias triggers (gender, age, ethnicity indicators).
        Keep it concise for an ATS.
        `;

        const res = await fetch('https://api.scaledown.xyz/compress/raw/', {
            method: 'POST',
            headers: {
                'x-api-key': state.scaledownKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                context: context,
                prompt: prompt,
                model: "gpt-4o",
                scaledown: { rate: "auto" }
            })
        });

        const data = await res.json();

        // Handle inconsistent API response structures
        let compressed = '';
        if (data.results && data.results.compressed_prompt) {
            compressed = data.results.compressed_prompt;
        } else if (data.compressed_prompt) {
            compressed = data.compressed_prompt;
        } else {
            throw new Error('ScaleDown failed to return compressed prompt');
        }
        return compressed;
    }

    /**
     * Calls Gemini API to analyze the compressed candidate profile.
     * Generates score, summary, bias audit, and interview questions.
     * @param {string} resumeSummary - The compressed resume text from ScaleDown
     * @param {string} jd - The job description
     * @returns {Promise<Object>} JSON object containing analysis results
     */
    async function callGemini(resumeSummary, jd) {
        const prompt = `
        You are an expert Recruitment AI.
        JOB DESCRIPTION: ${jd}
        
        CANDIDATE SUMMARY: ${resumeSummary}
        
        Task:
        1. Score the candidate (0-100) based on JD fit.
        2. Write a brief analysis (strengths/weaknesses).
        3. Create a strict Bias Audit (any detected bias in resume?).
        4. Assess Culture Fit: evaluate communication style, teamwork indicators, leadership traits, and alignment with typical company values. Rate as Strong Fit / Moderate Fit / Weak Fit with justification.
        5. Generate 3 behavioral interview questions tailored to this candidate.
        6. Draft a short Offer Letter template addressed to the candidate, including role title from the JD, a congratulatory opening, key responsibilities summary, and a placeholder for compensation.
        
        Return ONLY valid JSON in this format:
        {
            "score": 85,
            "summary": "markdown string...",
            "bias_report": "markdown string...",
            "culture_fit": "markdown string...",
            "questions": "markdown string...",
            "offer_letter": "markdown string..."
        }
        `;

        const model = state.geminiModel;
        if (!model) return alert('Please select a Gemini model in Settings.');
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${state.geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await res.json();
        const text = data.candidates[0].content.parts[0].text;
        return JSON.parse(text);
    }

    /**
     * Fetches available Gemini models from the Google API using the provided key.
     * Populates the model selector dropdown.
     * @param {string} apiKey - The Google Gemini API key
     */
    async function fetchGeminiModels(apiKey) {
        if (!apiKey) return;

        geminiModelSelect.innerHTML = '<option value="" disabled selected>Fetching models...</option>';

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            const data = await response.json();

            const excluded = ['vision', 'image', 'audio', 'tts', 'embedding', 'robotics', 'veo', 'deep-research', 'nano-banana', 'computer-use'];
            const filteredModels = (data.models || [])
                .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
                .filter(m => !excluded.some(tag => m.name.toLowerCase().includes(tag)));

            // Sort A-Z
            filteredModels.sort((a, b) => {
                const idA = a.name.replace('models/', '');
                const idB = b.name.replace('models/', '');
                return idA.localeCompare(idB);
            });

            const models = filteredModels.map(m => {
                const value = m.name.replace('models/', '');
                return `<option value="${value}" ${value === state.geminiModel ? 'selected' : ''}>${m.displayName} (${value})</option>`;
            }).join('');

            if (!models) {
                geminiModelSelect.innerHTML = '<option value="" disabled selected>No models found</option>';
                alert('No compatible Gemini models found for your API key.');
                return;
            }

            geminiModelSelect.innerHTML = models;

            // Sync state with the actually selected value
            state.geminiModel = geminiModelSelect.value;
            localStorage.setItem('sa_gemini_model', state.geminiModel);

        } catch (error) {
            console.error("Failed to fetch models:", error);
            geminiModelSelect.innerHTML = '<option value="" disabled selected>Failed to load models</option>';
            alert(`Failed to fetch Gemini models: ${error.message}`);
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                               UI Rendering                                 */
    /* -------------------------------------------------------------------------- */

    /**
     * Renders the candidate ranking table sorted by score.
     */
    function renderTable() {
        const sorted = [...state.candidates].filter(c => c.score !== undefined).sort((a, b) => b.score - a.score);

        if (sorted.length === 0) return;

        candidatesBody.innerHTML = sorted.map((c, i) => `
            <tr onclick="showDetails('${c.id}')">
                <td>${i + 1}</td>
                <td>${c.name}</td>
                <td><span class="badge ${getScoreClass(c.score)}" style="padding:4px 8px; border-radius:4px; color:white;">${c.score}</span></td>
                <td>${c.status}</td>
                <td><button class="icon-btn"><i class="fa-solid fa-eye"></i></button></td>
            </tr>
        `).join('');
    }

    /**
     * Returns the CSS class for the score badge based on the score value.
     */
    function getScoreClass(score) {
        if (score >= 80) return 'bg-green';
        if (score >= 60) return 'bg-yellow';
        return 'bg-red';
    }

    /**
     * Opens the detail view modal for a specific candidate.
     * Populates tabs with analysis data.
     * @param {string} id - Candidate ID
     */
    window.showDetails = (id) => {
        const candidate = state.candidates.find(c => c.id === id);
        if (!candidate) return;

        document.getElementById('candidate-name').textContent = candidate.name;
        document.getElementById('tab-analysis').innerHTML = marked.parse(candidate.analysis || '');
        document.getElementById('tab-bias').innerHTML = marked.parse(candidate.bias || '');
        document.getElementById('tab-culture').innerHTML = marked.parse(candidate.culture || '');
        document.getElementById('tab-questions').innerHTML = marked.parse(candidate.questions || '');
        document.getElementById('tab-offer').innerHTML = marked.parse(candidate.offer || '');

        detailView.classList.remove('hidden');
    };

    // Tab Navigation Logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // Close Detail View
    document.querySelector('.close-detail').addEventListener('click', () => {
        detailView.classList.add('hidden');
    });
});

# 🚀 Pull Request Template: Apex Review Protocol

**Repository:** `chirag127/FluentPDF-AI-Powered-Text-To-Speech-Converter-CLI`

--- 

## 📝 Summary of Changes

<!-- Briefly describe the purpose of this pull request. Link to any relevant issue (e.g., `Closes #123`). -->

[Issue Reference/Ticket]: 

## ✅ Checklist for the Author

Before requesting a review, ensure you have satisfied all architectural and quality gates:

1.  [ ] **Functional Verification:** Does this change meet the stated requirement? (Self-test completed).
2.  [ ] **Code Style:** Has `ruff format` been run successfully on all modified files? (Linter checks pass).
3.  [ ] **Testing:** Are new unit/integration tests included for new logic? (Pytest coverage maintained/increased).
4.  [ ] **Documentation:** Have I updated `README.md` or associated documentation if the public API changed?
5.  [ ] **Security:** Have I reviewed dependencies for vulnerabilities (checked against current `uv list --outdated`)?
6.  [ ] **Architectural Compliance:** Does this PR adhere to **SOLID** principles and the **Modular Monolith** pattern defined in `AGENTS.md`?
7.  [ ] **Async Safety:** If asynchronous operations are involved, are race conditions or resource deadlocks mitigated?

## 🔎 Technical Deep Dive

<!-- Provide context for the reviewer. Explain *why* certain architectural decisions were made, especially concerning the Node.js/JavaScript core and PDF parsing strategy. -->

### Core Logic Walkthrough

1.  **PDF Extraction:** (e.g., `pdf-parse` usage, raw buffer handling).
2.  **Text Optimization Pass:** (e.g., cleanup regex, handling of hyphenation/line breaks for better TTS flow).
3.  **TTS Integration:** (e.g., Which specific TTS engine/library is used, and what parameters were configured? e.g., `elevenlabs` or native Node modules).
4.  **CLI Interface:** (e.g., Changes to `Commander` or `Yargs` usage).

### Affected Files (High Impact)

*   `src/processor.js`
*   `src/cli.js`
*   `lib/tts_adapter.js` (If applicable)

## 🧪 Verification Steps for Reviewer

To validate this PR, execute the following steps:

1.  Checkout branch and install dependencies:
    bash
    git checkout <branch-name>
    npm install
    
2.  Run linting and formatting:
    bash
    npm run lint
    npm run format
    
3.  Execute relevant test suite:
    bash
    npm run test:unit
    # OR for integration/E2E verification:
    npm run test:e2e -- --pdf <path/to/test_document.pdf>
    
4.  Manually test the core feature flow (e.g., `node dist/cli.js process --input ./test.pdf --output ./output.mp3`).

--- 

**Reviewer Focus Area:** Please pay close attention to error handling around I/O streams and text normalization before TTS synthesis.
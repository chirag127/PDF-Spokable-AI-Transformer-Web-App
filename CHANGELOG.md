# Changelog

All notable changes to Spokable PDF will be documented in this file.

## [1.0.0] - 2025-11-19

### Added

-   Initial release of Spokable PDF
-   PDF text extraction using PDF.js
-   AI-powered text transformation using Google Gemini API
-   Smart chunking with configurable batch size and overlap
-   Automatic model failover and retry logic
-   Turbo Mode for parallel chunk processing
-   In-browser TTS playback
-   Dark mode support
-   IndexedDB storage for PDFs and processing state
-   Configurable transformation prompts
-   PDF generation with customizable formatting
-   Progress tracking with pause/resume
-   Partial result download
-   Multi-file batch processing
-   Comprehensive settings management
-   Interactive walkthrough for new users
-   Privacy-first architecture (client-side only)
-   Responsive design for mobile and desktop
-   Complete documentation (README, FAQ, Privacy Policy, Terms)

### Features

-   Support for multiple Gemini models (Flash, Pro, Flash-8B)
-   Multimodal support for figure descriptions
-   SSML output option for advanced TTS
-   Natural pause insertion
-   Acronym expansion
-   Citation removal
-   Code-to-description transformation
-   Table-to-narrative conversion
-   Figure description generation
-   Mathematical notation to spoken form
-   URL pronunciation conversion
-   Advanced logging and diagnostics
-   Export logs functionality
-   Clear storage option

### Technical

-   Vanilla JavaScript (ES6+)
-   No build step required
-   Static hosting compatible
-   IndexedDB for persistence
-   localStorage for settings
-   Web Speech API for TTS
-   PDF.js for extraction
-   jsPDF for generation
-   REST API integration with Gemini

## [Unreleased]

### Planned Features

-   Batch PDF processing (parallel)
-   Custom provider support (Cerebras, Groq)
-   Advanced figure extraction with OCR
-   Multi-language support
-   Audio file export
-   Cloud sync option
-   Browser extension version
-   Offline mode improvements
-   Advanced analytics dashboard
-   Template library for different document types

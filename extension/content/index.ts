// Content Script for Click-Wise - Detects and extracts legal documents

interface DetectedDocument {
  docType: string;
  content: string;
  confidence: number;
}

const LEGAL_DOC_PATTERNS = {
  tos: ['/terms', '/tos', '/terms-of-service', '/terms-and-conditions'],
  privacy: ['/privacy', '/privacy-policy'],
  cookie: ['/cookie', '/cookies', '/cookie-policy'],
  eula: ['/eula', '/end-user-license-agreement'],
  api_terms: ['/api/terms', '/api-terms', '/developer/terms'],
};

const LEGAL_KEYWORDS = {
  heading: [
    'Terms of Service',
    'Terms & Conditions',
    'Privacy Policy',
    'Cookie Policy',
    'EULA',
    'End User License Agreement',
    'API Terms',
    'Developer Terms',
  ],
  body: ['agree to', 'binding agreement', 'terms and conditions', 'privacy practices'],
};

const MIN_WORD_COUNT = 1500;

/**
 * Detect if current page contains a legal document
 */
function detectLegalDocument(): DetectedDocument | null {
  const url = window.location.href;
  const domain = new URL(url).hostname;

  let docType: string | null = null;
  let confidence = 0;

  // Check URL patterns
  for (const [type, patterns] of Object.entries(LEGAL_DOC_PATTERNS)) {
    if (patterns.some((p) => url.toLowerCase().includes(p))) {
      docType = type;
      confidence += 40;
      break;
    }
  }

  // Check heading text
  const headingText = (document.querySelector('h1, h2, title') || { textContent: '' })
    .textContent?.toLowerCase();
  if (headingText) {
    if (LEGAL_KEYWORDS.heading.some((kw) => headingText.includes(kw.toLowerCase()))) {
      docType = docType || inferDocTypeFromHeading(headingText);
      confidence += 30;
    }
  }

  // Extract and validate text
  const text = extractDocumentText();
  if (text.split(/\s+/).length > MIN_WORD_COUNT) {
    confidence += 20;
  } else {
    return null; // Not enough content
  }

  // Check body keywords
  if (LEGAL_KEYWORDS.body.some((kw) => text.toLowerCase().includes(kw))) {
    confidence += 10;
  }

  if (confidence >= 50 && docType) {
    return {
      docType,
      content: text,
      confidence,
    };
  }

  return null;
}

/**
 * Extract main text content from page, including shadow DOM
 */
function extractDocumentText(): string {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let text = '';
  let node;

  while ((node = walker.nextNode())) {
    const trimmed = (node as Text).textContent?.trim();
    if (trimmed && trimmed.length > 0) {
      text += ' ' + trimmed;
    }
  }

  // Clean up text
  text = text
    .replace(/\s+/g, ' ')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '');

  return text.trim();
}

/**
 * Infer document type from heading text
 */
function inferDocTypeFromHeading(heading: string): string {
  if (heading.includes('privacy')) return 'privacy';
  if (heading.includes('cookie')) return 'cookie';
  if (heading.includes('eula') || heading.includes('license')) return 'eula';
  if (heading.includes('api') || heading.includes('developer')) return 'api_terms';
  return 'tos';
}

/**
 * Initialize detection and send message to background
 */
function initialize() {
  const detected = detectLegalDocument();

  if (detected) {
    const domain = new URL(window.location.href).hostname;

    chrome.runtime.sendMessage(
      {
        action: 'detectLegalDocument',
        domain,
        docType: detected.docType,
        content: detected.content,
        confidence: detected.confidence,
      },
      (response) => {
        if (response?.success) {
          console.log('Document analyzed successfully');
        } else {
          console.error('Analysis failed:', response?.error);
        }
      }
    );
  }
}

// Run detection when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Also listen for dynamically added content (SPAs)
const observer = new MutationObserver(() => {
  const detected = detectLegalDocument();
  if (detected) {
    initialize();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false,
});

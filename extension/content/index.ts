// Content Script for Click Wise - Detects and extracts legal documents

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
  body: [
    'agree to',
    'binding agreement',
    'terms and conditions',
    'privacy practices',
    'personal data',
    'shall',
    'may not',
    'we may',
    'you agree',
  ],
};

const MIN_TEXT_LENGTH = 500; // Minimum characters (much lower than before)

/**
 * Detect if current page contains a legal document
 * BULLETPROOF: Will extract text from any page with sufficient content
 */
function detectLegalDocument(): DetectedDocument | null {
  const url = window.location.href;
  const domain = new URL(url).hostname;

  let docType: string | null = null;
  let confidence = 10; // Start with base confidence

  // Check URL patterns (optional boost, not required)
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

  // Extract text - BULLETPROOF APPROACH
  const text = extractDocumentText();

  // CRITICAL: Accept any text >= MIN_TEXT_LENGTH
  // Don't fail if we have content available
  if (text.length < MIN_TEXT_LENGTH) {
    return null; // Too little content
  }

  // Boost confidence if we find legal keywords
  if (LEGAL_KEYWORDS.body.some((kw) => text.toLowerCase().includes(kw))) {
    confidence += 20;
  }

  // Default document type if not detected
  if (!docType) {
    docType = 'tos'; // Default assumption
    confidence = Math.max(confidence, 30); // Ensure minimum confidence
  }

  // Return document with confidence - don't require minimum confidence
  // Just ensure we have content
  return {
    docType,
    content: text,
    confidence,
  };
}

/**
 * Extract main text content from page with multiple fallback strategies
 * BULLETPROOF: Will grab text from somewhere, guaranteed
 */
function extractDocumentText(): string {
  let text = '';

  // Strategy 1: Try common content containers
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '#content',
    '#main-content',
    '.content',
    '.main-content',
  ];

  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      text = element.innerText || element.textContent || '';
      if (text.length > 300) {
        // Found good content
        return cleanText(text);
      }
    }
  }

  // Strategy 2: Fallback to body.innerText (most reliable)
  if (document.body.innerText) {
    text = document.body.innerText;
    if (text.length > 100) {
      return cleanText(text);
    }
  }

  // Strategy 3: Fallback to body.textContent
  if (document.body.textContent) {
    text = document.body.textContent;
    return cleanText(text);
  }

  // Strategy 4: TreeWalker as last resort
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    const trimmed = (node as Text).textContent?.trim();
    if (trimmed && trimmed.length > 0) {
      text += ' ' + trimmed;
    }
  }

  return cleanText(text);
}

/**
 * Clean text: strip excessive whitespace and newlines
 */
function cleanText(text: string): string {
  return text
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\r+/g, ' ') // Replace carriage returns
    .replace(/\t+/g, ' ') // Replace tabs
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim(); // Remove leading/trailing whitespace
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

/**
 * Listen for extraction requests from UI
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractLegalDocument') {
    const detected = detectLegalDocument();

    if (detected) {
      const domain = new URL(window.location.href).hostname;
      sendResponse({
        success: true,
        data: {
          content: detected.content,
          domain: domain,
          docType: detected.docType,
          confidence: detected.confidence,
        },
      });
    } else {
      sendResponse({
        success: false,
        error: 'No legal document detected on this page',
      });
    }
  }
});

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

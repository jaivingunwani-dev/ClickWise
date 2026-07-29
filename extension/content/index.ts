// Content Script for Click Wise - Detects and extracts legal documents
// PHASE 1: Automatic Legal Detection with Toast Notification

interface DomainPreference {
  [domain: string]: 'always' | 'never' | null;
}

/**
 * Detect the legal document type based on page context
 * Falls back to 'privacy' as the safest default for unknown documents
 */
function detectDocumentType(): string {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  const bodyText = (document.body.innerText || document.body.textContent || '').toLowerCase();

  // Pattern-based detection: URL and page title keywords
  const patterns: Record<string, RegExp> = {
    tos: /terms[\s-]?(of[\s-]?service|&[\s-]?conditions|of[\s-]?use)|service[\s-]?terms/i,
    privacy: /privacy[\s-]?policy|privacy[\s-]?notice|privacy[\s-]?statement|data[\s-]?privacy/i,
    cookie: /cookie[\s-]?policy|cookie[\s-]?notice|cookie[\s-]?consent/i,
    eula: /end[\s-]?user[\s-]?license[\s-]?agreement|eula|license[\s-]?agreement/i,
    api_terms: /api[\s-]?terms|api[\s-]?agreement|developer[\s-]?terms|developer[\s-]?agreement/i,
  };

  // Check URL first (most reliable)
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      console.log(`CLICK WISE: Detected ${type} from URL`);
      return type;
    }
  }

  // Check page title
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(title)) {
      console.log(`CLICK WISE: Detected ${type} from title`);
      return type;
    }
  }

  // Check for common legal phrases in body (sampling to avoid full text scan)
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map((el) => el.textContent?.toLowerCase() || '')
    .join(' ');

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(headings)) {
      console.log(`CLICK WISE: Detected ${type} from headings`);
      return type;
    }
  }

  // Default to 'privacy' as safest fallback (more common than other types)
  console.log('CLICK WISE: Could not determine doc type, defaulting to privacy');
  return 'privacy';
}

/**
 * Detect if page is a legal document (confidence score 0-100)
 * Enhanced patterns to catch more legal document variations
 */
function detectLegalPage(): { isLegal: boolean; confidence: number; docType?: string } {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map((el) => el.textContent?.toLowerCase() || '')
    .join(' ');

  // Get body text (first 2000 chars for efficiency)
  const bodyText = (document.body.innerText || document.body.textContent || '')
    .toLowerCase()
    .substring(0, 2000);

  const legalPatterns = [
    /terms[\s-]?(of[\s-]?service|&[\s-]?conditions|of[\s-]?use)|service[\s-]?terms/i,
    /privacy[\s-]?policy|privacy[\s-]?notice|privacy[\s-]?statement|data[\s-]?privacy/i,
    /cookie[\s-]?policy|cookie[\s-]?notice|cookie[\s-]?consent/i,
    /end[\s-]?user[\s-]?license[\s-]?agreement|eula|license[\s-]?agreement/i,
    /api[\s-]?terms|api[\s-]?agreement|developer[\s-]?terms|developer[\s-]?agreement/i,
  ];

  let confidence = 0;

  // URL match = 60% confidence (highest signal)
  if (legalPatterns.some(p => p.test(url))) {
    confidence += 60;
    console.log('CLICK WISE: URL pattern matched');
  }

  // Title match = 30% confidence
  if (legalPatterns.some(p => p.test(title))) {
    confidence += 30;
    console.log('CLICK WISE: Title pattern matched');
  }

  // Heading match = 10% confidence
  if (legalPatterns.some(p => p.test(headings))) {
    confidence += 10;
    console.log('CLICK WISE: Heading pattern matched');
  }

  // Body text check = 5% confidence (weak signal)
  if (legalPatterns.some(p => p.test(bodyText))) {
    confidence += 5;
    console.log('CLICK WISE: Body text pattern matched');
  }

  const isLegal = confidence >= 60;
  const docType = isLegal ? detectDocumentType() : undefined;

  console.log(`CLICK WISE: Legal page detection - confidence: ${confidence}%, isLegal: ${isLegal}, url: ${url}`);

  return { isLegal, confidence, docType };
}

/**
 * Display floating toast notification for legal document detection
 * Enhanced with body availability check
 */
function showLegalDetectionToast(docType: string, domain: string): void {
  // Wait for body to be available
  const ensureBodyAndShowToast = () => {
    if (!document.body) {
      setTimeout(ensureBodyAndShowToast, 50);
      return;
    }

    // Check if toast already exists
    const existingToast = document.getElementById('clickwise-legal-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast container
    const toast = document.createElement('div');
    toast.id = 'clickwise-legal-toast';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 16px;
      max-width: 380px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: clickwise-slide-in 0.3s ease-out;
    `;

    // Create content
    const docTypeLabel = docType.replace(/_/g, ' ').toUpperCase();
    toast.innerHTML = `
      <div style="margin: 0 0 12px; font-size: 14px; color: #333; line-height: 1.4;">
        ClickWise detected <strong>${docTypeLabel}</strong> on this page. Analyze now?
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="clickwise-btn-yes" style="
          padding: 6px 12px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        ">Yes, Analyze</button>
        <button class="clickwise-btn-ignore" style="
          padding: 6px 12px;
          background: #f3f4f6;
          color: #666;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        ">Ignore</button>
        <button class="clickwise-btn-never" style="
          padding: 6px 12px;
          background: #f3f4f6;
          color: #666;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        ">Never for this domain</button>
        <button class="clickwise-btn-close" style="
          background: none;
          border: none;
          color: #999;
          padding: 0;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        ">×</button>
      </div>
    `;

    // Add animation keyframes
    if (!document.getElementById('clickwise-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'clickwise-toast-styles';
      style.textContent = `
        @keyframes clickwise-slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .clickwise-btn-yes:hover {
          background: #1d4ed8 !important;
        }

        .clickwise-btn-ignore:hover,
        .clickwise-btn-never:hover {
          background: #e5e7eb !important;
        }

        .clickwise-btn-close:hover {
          color: #666 !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(toast);
    console.log('CLICK WISE: Toast injected into DOM');

    // Event listeners
    const btnYes = toast.querySelector('.clickwise-btn-yes') as HTMLButtonElement;
    const btnIgnore = toast.querySelector('.clickwise-btn-ignore') as HTMLButtonElement;
    const btnNever = toast.querySelector('.clickwise-btn-never') as HTMLButtonElement;
    const btnClose = toast.querySelector('.clickwise-btn-close') as HTMLButtonElement;

    const removeToast = () => {
      if (toast.parentNode) {
        toast.remove();
      }
    };

    btnYes.addEventListener('click', () => {
      removeToast();
      const result = extractPageText();
      chrome.runtime.sendMessage({
        action: 'extractLegalDocument',
        manual: true,
        ...result,
      });
    });

    btnIgnore.addEventListener('click', removeToast);

    btnNever.addEventListener('click', async () => {
      await setDomainPreference(domain, 'never');
      removeToast();
    });

    btnClose.addEventListener('click', removeToast);

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        removeToast();
      }
    }, 8000);
  };

  ensureBodyAndShowToast();
}

/**
 * Store domain preference (always/never analyze this domain)
 */
async function setDomainPreference(domain: string, preference: 'always' | 'never' | null): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['domainPreferences'], (result) => {
      const prefs = (result.domainPreferences as DomainPreference) || {};
      prefs[domain] = preference;
      chrome.storage.local.set({ domainPreferences: prefs }, resolve);
      console.log(`CLICK WISE: Set domain preference for ${domain}: ${preference}`);
    });
  });
}

/**
 * Get domain preference
 */
async function getDomainPreference(domain: string): Promise<'always' | 'never' | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['domainPreferences'], (result) => {
      const prefs = (result.domainPreferences as DomainPreference) || {};
      resolve(prefs[domain] || null);
    });
  });
}

/**
 * FOOLPROOF extraction: Grab text from page, no questions asked
 * If text length > 50 characters, return success
 */
function extractPageText() {
  try {
    // Step 1: Get text from document.body
    let text = document.body.innerText || document.body.textContent || '';

    // Step 2: Clean whitespace
    text = text
      .replace(/\n+/g, ' ')     // Newlines → spaces
      .replace(/\r+/g, ' ')     // Carriage returns → spaces
      .replace(/\t+/g, ' ')     // Tabs → spaces
      .replace(/\s+/g, ' ')     // Multiple spaces → single space
      .trim();

    // Step 3: Check length and return
    const textLength = text.length;
    console.log('CLICK WISE: Extraction fired', textLength);

    if (textLength > 50) {
      // SUCCESS - we have enough text
      // Intelligently detect document type instead of hardcoding 'general'
      const docType = detectDocumentType();

      return {
        success: true,
        data: {
          content: text,
          domain: window.location.hostname,
          docType: docType,
          confidence: 100,
        },
      };
    } else {
      console.log('CLICK WISE: Text too short', textLength);
      return {
        success: false,
        error: `Not enough text (${textLength} chars, need >50)`,
      };
    }
  } catch (error) {
    console.error('CLICK WISE: Extraction error', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Listen for extraction requests from UI popup/sidepanel
 * FOOLPROOF: Always tries to extract, always responds
 * CRITICAL: Return true to keep message port open until sendResponse is called
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('CLICK WISE: Message received', request.action);

  if (request.action === 'extractLegalDocument') {
    try {
      const result = extractPageText();
      console.log('CLICK WISE: Extraction result', result);
      sendResponse(result);
    } catch (error) {
      console.error('CLICK WISE: Handler error', error);
      sendResponse({
        success: false,
        error: String(error),
      });
    }
  } else {
    // Fallback: unknown action still gets a response
    console.warn('CLICK WISE: Unknown action:', request.action);
    sendResponse({
      success: false,
      error: 'Unknown action: ' + request.action,
    });
  }

  // Return true to indicate response is sent (keeps port open if needed)
  return true;
});

/**
 * Initialize legal page detection on page load
 * Run in background to avoid blocking page rendering
 * Enhanced with multiple detection attempts and better timing
 * CRITICAL: This function is called multiple times to catch all cases
 */
async function initializeLegalPageDetection(): Promise<void> {
  const domain = window.location.hostname;

  // Attempt detection with multiple timing approaches
  const attemptDetection = async () => {
    try {
      const detection = detectLegalPage();

      console.log(`CLICK WISE: Legal page detection - domain: ${domain}, confidence: ${detection.confidence}%, isLegal: ${detection.isLegal}`);

      // If not a legal page, skip
      if (!detection.isLegal) {
        console.debug('CLICK WISE: Page does not appear to be a legal document');
        return;
      }

      // Check domain preference
      const preference = await getDomainPreference(domain);
      console.log(`CLICK WISE: Domain preference for ${domain}: ${preference}`);

      if (preference === 'never') {
        console.log(`CLICK WISE: Domain ${domain} is blacklisted, skipping`);
        return;
      }

      if (preference === 'always') {
        console.log(`CLICK WISE: Domain ${domain} is whitelisted, auto-analyzing`);
        const result = extractPageText();
        chrome.runtime.sendMessage({
          action: 'extractLegalDocument',
          autoTriggered: true,
          ...result,
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('CLICK WISE: Failed to send message:', chrome.runtime.lastError);
          } else {
            console.log('CLICK WISE: Auto-extraction message sent');
          }
        });
        return;
      }

      // No preference set, show toast
      if (detection.docType) {
        console.log(`CLICK WISE: Showing toast for ${detection.docType} on ${domain}`);
        showLegalDetectionToast(detection.docType, domain);
      } else {
        console.warn('CLICK WISE: Detection found legal page but no docType determined');
      }
    } catch (error) {
      console.error('CLICK WISE: Error during detection attempt:', error);
    }
  };

  // Try immediately (for fast-loaded pages)
  console.log('CLICK WISE: Running immediate detection attempt');
  attemptDetection();

  // Try again after a short delay (for slower-loaded content)
  setTimeout(() => {
    console.log('CLICK WISE: Running 500ms delayed detection attempt');
    attemptDetection();
  }, 500);

  // Try once more after DOM is fully ready (for SPAs and dynamic content)
  setTimeout(() => {
    console.log('CLICK WISE: Running 2000ms delayed detection attempt');
    attemptDetection();
  }, 2000);
}

/**
 * Apply highlights to matching text on the page
 * PHASE 4: In-page highlighting of risky clauses
 */
function applyHighlights(excerpts: Array<{text: string; severity: string; explanation: string}>): void {
  // Add highlight styles
  const highlightStyle = document.createElement('style');
  highlightStyle.id = 'clickwise-highlight-styles';
  highlightStyle.textContent = `
    .clickwise-highlight {
      position: relative;
      cursor: help;
      transition: background-color 0.2s;
      padding: 2px 0;
    }

    .clickwise-highlight-high-risk {
      background-color: rgba(239, 68, 68, 0.3);
      border-bottom: 2px solid #ef4444;
    }

    .clickwise-highlight-caution {
      background-color: rgba(250, 204, 21, 0.3);
      border-bottom: 2px solid #facc15;
    }

    .clickwise-highlight:hover {
      filter: brightness(0.95);
    }

    .clickwise-tooltip {
      position: absolute;
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.4;
      max-width: 250px;
      z-index: 10000;
      display: none;
      pointer-events: none;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      white-space: normal;
      margin-bottom: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      word-wrap: break-word;
    }

    .clickwise-highlight:hover .clickwise-tooltip {
      display: block;
    }

    @keyframes clickwise-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .clickwise-highlight {
      animation: clickwise-fade-in 0.3s ease-out;
    }
  `;

  if (!document.getElementById('clickwise-highlight-styles')) {
    document.head.appendChild(highlightStyle);
  }

  console.log(`CLICK WISE: Highlighting ${excerpts.length} excerpts`);

  // Walk through DOM nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const nodesToReplace: Array<{node: Node; excerpts: Array<{text: string; severity: string; explanation: string}>}> = [];
  let node;

  while ((node = walker.nextNode())) {
    const textContent = node.textContent || '';
    const matchingExcerpts = excerpts.filter(e =>
      textContent.toLowerCase().includes(e.text.toLowerCase().substring(0, 50))
    );

    if (matchingExcerpts.length > 0) {
      nodesToReplace.push({ node, excerpts: matchingExcerpts });
    }
  }

  // Replace text nodes with highlighted spans
  nodesToReplace.forEach(({ node, excerpts: matchingExcerpts }) => {
    try {
      const parent = node.parentElement;
      if (!parent) return;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      const text = node.textContent || '';

      matchingExcerpts.forEach(excerpt => {
        const searchText = excerpt.text.substring(0, 50);
        const index = text.toLowerCase().indexOf(searchText.toLowerCase(), lastIndex);

        if (index === -1) return;

        // Add unmatched text
        if (index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
        }

        // Create highlighted span
        const span = document.createElement('span');
        span.className = `clickwise-highlight clickwise-highlight-${excerpt.severity}`;
        span.textContent = text.substring(index, index + searchText.length);

        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'clickwise-tooltip';
        tooltip.textContent = excerpt.explanation;
        span.appendChild(tooltip);

        fragment.appendChild(span);
        lastIndex = index + searchText.length;
      });

      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      parent.replaceChild(fragment, node);
    } catch (error) {
      console.error('CLICK WISE: Error highlighting text', error);
    }
  });

  console.log(`CLICK WISE: Highlighting complete`);
}

/**
 * Handle messages from popup/background
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('CLICK WISE: Message received', request.action);

  if (request.action === 'applyHighlights') {
    try {
      applyHighlights(request.excerpts);
      sendResponse({ success: true });
    } catch (error) {
      console.error('CLICK WISE: Highlighting error', error);
      sendResponse({ success: false, error: String(error) });
    }
  }

  return true;
});

/**
 * Comprehensive initialization of legal page detection
 * Handles all document readyStates and runs detection immediately + on events
 */
function initContentScript(): void {
  console.log(`CLICK WISE: Content script loaded. Document readyState: ${document.readyState}`);

  // CRITICAL: Run detection immediately regardless of readyState
  // This catches pages that load very quickly
  initializeLegalPageDetection();

  // Also listen for DOMContentLoaded if we're still loading
  if (document.readyState === 'loading') {
    console.log('CLICK WISE: DOM still loading, adding DOMContentLoaded listener');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('CLICK WISE: DOMContentLoaded fired, running detection again');
      initializeLegalPageDetection();
    });
  }

  // Also listen for page fully loaded
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => {
      console.log('CLICK WISE: Window load event fired, running detection again');
      setTimeout(initializeLegalPageDetection, 100);
    });
  }

  // Periodically check in case content changes (SPAs)
  setTimeout(() => {
    console.log('CLICK WISE: Running periodic detection check (SPA support)');
    initializeLegalPageDetection();
  }, 3000);
}

// Run comprehensive initialization
initContentScript();

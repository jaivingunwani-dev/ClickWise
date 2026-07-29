// Content Script for Click Wise - Detects and extracts legal documents
// FOOLPROOF EXTRACTION FOR HACKATHON DEMO

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
      return {
        success: true,
        data: {
          content: text,
          domain: window.location.hostname,
          docType: 'general',
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
  }
});

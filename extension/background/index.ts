// Background Service Worker for Click Wise

chrome.runtime.onInstalled.addListener(() => {
  console.log('Click Wise extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);

  if (request.action === 'getExtensionId') {
    sendResponse({ extensionId: chrome.runtime.id });
  }

  if (request.action === 'detectLegalDocument') {
    const { domain, docType, content } = request;
    console.log(`Detected ${docType} on ${domain}`);

    // Send analysis request to backend
    analyzeDocument(domain, docType, content)
      .then((result) => {
        sendResponse({ success: true, result });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});

async function analyzeDocument(
  domain: string,
  docType: string,
  content: string
): Promise<any> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

  const response = await fetch(`${backendUrl}/api/documents/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      domain,
      doc_type: docType,
      content,
      url: new URL(document.URL).origin,
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.statusText}`);
  }

  return response.json();
}

// Open sidepanel on extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

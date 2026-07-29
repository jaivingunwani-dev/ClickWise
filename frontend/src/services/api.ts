/**
 * Click Wise API Client
 * Handles communication with the backend API for document analysis
 */

const BACKEND_URL = (typeof process !== 'undefined' && process.env.REACT_APP_BACKEND_URL) || 'http://localhost:8000';

interface ScanResponse {
  content_hash: string;
  domain: string;
  doc_type: string;
  summary: {
    executive_summary: string;
    key_risks: string[];
    is_legal_advice: boolean;
  };
  risk_score: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    flags: Array<{
      code: string;
      category: string;
      weight: number;
      description: string;
    }>;
  };
  ai_training_clause: boolean;
  dark_patterns_detected: string[];
  created_at: string;
  cached: boolean;
}

interface ScanError {
  status: number;
  message: string;
  detail?: string;
}

/**
 * Scan a legal document and get AI-powered analysis
 * @param documentText - The full text of the legal document
 * @param docType - Type of document (tos, privacy, cookie, eula, api_terms)
 * @param domain - Domain where the document was found
 * @param url - Optional URL of the document source
 * @returns Analysis response with risk score and summary
 * @throws ScanError if the API call fails
 */
export async function scanDocument(
  documentText: string,
  docType: string,
  domain: string,
  url?: string
): Promise<ScanResponse> {
  // Validate inputs
  if (!documentText || documentText.length < 100) {
    throw {
      status: 400,
      message: 'Document too short',
      detail: 'Document must be at least 100 characters',
    } as ScanError;
  }

  if (!['tos', 'privacy', 'cookie', 'eula', 'api_terms'].includes(docType)) {
    throw {
      status: 400,
      message: 'Invalid document type',
      detail: `doc_type must be one of: tos, privacy, cookie, eula, api_terms. Got: ${docType}`,
    } as ScanError;
  }

  if (!domain) {
    throw {
      status: 400,
      message: 'Domain required',
      detail: 'Domain field cannot be empty',
    } as ScanError;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`${BACKEND_URL}/api/v1/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: documentText,
        doc_type: docType,
        domain,
        url: url || undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: `API Error (${response.status})`,
        detail: errorData.detail || response.statusText,
      } as ScanError;
    }

    const data = await response.json();
    return data as ScanResponse;
  } catch (error) {
    // Handle network errors and timeouts
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw {
        status: 0,
        message: 'Network error',
        detail: 'Could not reach the backend. Make sure the backend server is running.',
      } as ScanError;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw {
        status: 0,
        message: 'Request timeout',
        detail: 'The analysis took too long. Please try again.',
      } as ScanError;
    }

    // Re-throw if already a ScanError
    if (error instanceof Object && 'status' in error) {
      throw error;
    }

    // Handle unexpected errors
    throw {
      status: 500,
      message: 'Unexpected error',
      detail: error instanceof Error ? error.message : 'An unknown error occurred',
    } as ScanError;
  }
}

/**
 * Get a cached analysis by content hash
 * @param contentHash - SHA-256 hash of document content
 * @returns Cached analysis response
 */
export async function getCachedAnalysis(contentHash: string): Promise<ScanResponse | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/cache/${contentHash}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Cache lookup failed: ${response.statusText}`);
    }

    return (await response.json()) as ScanResponse;
  } catch (error) {
    console.error('Cache lookup error:', error);
    return null;
  }
}

/**
 * Format error message for display to user
 */
export function formatError(error: ScanError): string {
  if (error.status === 0 && error.message === 'Network error') {
    return 'Could not connect to the backend. Is the server running?';
  }

  if (error.status === 0 && error.message === 'Request timeout') {
    return 'Analysis took too long. Please try a shorter document.';
  }

  if (error.status === 400) {
    return error.detail || 'Invalid request. Please check the document.';
  }

  if (error.status === 500) {
    return 'Server error. Please try again later.';
  }

  return error.detail || error.message || 'An error occurred during analysis.';
}

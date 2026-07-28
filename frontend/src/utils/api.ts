import { DocumentAnalysis } from '../types';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export interface AnalyzeDocumentRequest {
  content: string;
  url: string;
  doc_type: string;
  domain: string;
}

export async function analyzeDocument(
  request: AnalyzeDocumentRequest
): Promise<DocumentAnalysis> {
  const response = await fetch(`${BACKEND_URL}/api/documents/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getCachedDocument(contentHash: string): Promise<DocumentAnalysis> {
  const response = await fetch(
    `${BACKEND_URL}/api/documents/cache/${contentHash}`
  );

  if (!response.ok) {
    throw new Error(`Cache lookup failed: ${response.statusText}`);
  }

  return response.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

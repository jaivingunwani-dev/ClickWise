import React from 'react';
import { PrivacyScorecard } from './components/PrivacyScorecard';
import { DocumentSummary } from './components/DocumentSummary';
import { QuestionAnswerSection } from './components/QuestionAnswerSection';
import { HighlightsPreview } from './components/HighlightsPreview';
import { AlertCircle, Loader } from 'lucide-react';
import { scanDocument, formatError } from './services/api';
import './index.css';

interface AnalysisState {
  domain: string;
  docType: string;
  summary: string;
  risks: string[];
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: Array<{
    code: string;
    category: string;
    weight: number;
    description: string;
  }>;
  cached: boolean;
  contentHash: string;
  documentContent: string;
  highlightedExcerpts: Array<{
    text: string;
    severity: 'high_risk' | 'caution';
    explanation: string;
  }>;
}

interface ErrorState {
  message: string;
  detail?: string;
}

function App() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<ErrorState | null>(null);
  const [analysis, setAnalysis] = React.useState<AnalysisState | null>(null);

  /**
   * Request page text extraction from content script
   */
  const extractPageContent = async (): Promise<{
    text: string;
    domain: string;
    docType: string;
  } | null> => {
    return new Promise((resolve) => {
      chrome.tabs?.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
        const tab = tabs?.[0];
        if (!tab?.id) {
          setError({
            message: 'Unable to access current tab',
            detail: 'Click Wise could not read the current page.',
          });
          resolve(null);
          return;
        }

        chrome.tabs.sendMessage(
          tab.id,
          { action: 'extractLegalDocument' },
          (response: Record<string, unknown> | undefined) => {
            if (chrome.runtime.lastError) {
              setError({
                message: 'Content script not ready',
                detail: 'Please refresh the page and try again.',
              });
              resolve(null);
              return;
            }

            if (response?.success && response.data) {
              const data = response.data as Record<string, unknown>;
              resolve({
                text: data.content as string,
                domain: data.domain as string,
                docType: data.docType as string,
              });
            } else {
              setError({
                message: 'No legal document detected',
                detail: (response?.error as string) || 'Could not find a legal document on this page.',
              });
              resolve(null);
            }
          }
        );
      });
    });
  };

  /**
   * Handle analyze button click
   */
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Extract page content
      const pageData = await extractPageContent();
      if (!pageData) {
        setLoading(false);
        return;
      }

      // Call backend API
      const response = await scanDocument(
        pageData.text,
        pageData.docType,
        pageData.domain
      );

      // Map response to state
      setAnalysis({
        domain: response.domain,
        docType: response.doc_type,
        summary: response.summary.executive_summary,
        risks: response.summary.key_risks,
        score: response.risk_score.score,
        level: response.risk_score.level,
        flags: response.risk_score.flags,
        cached: response.cached,
        contentHash: response.content_hash,
        documentContent: pageData.text,
        highlightedExcerpts: response.highlighted_excerpts || [],
      });

      setError(null);
    } catch (err: unknown) {
      const scanError = err as Record<string, unknown>;
      const errorMessage = formatError(scanError as { status: number; message: string });
      setError({
        message: (scanError.message as string) || 'Analysis failed',
        detail: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset analysis
   */
  const handleReset = () => {
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Click Wise</h1>
          <p className="text-gray-600 text-sm">AI-powered legal document analysis</p>
        </header>

        <div className="space-y-6">
          {/* Error State */}
          {error && !analysis && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">{error.message}</p>
                  {error.detail && (
                    <p className="text-sm text-red-700 mt-1">{error.detail}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleReset}
                className="mt-3 w-full text-sm font-medium text-red-700 hover:text-red-900 py-2 px-3 rounded hover:bg-red-100 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Analysis State */}
          {analysis && !error && (
            <>
              {analysis.cached && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-700">✓ Loaded from cache</p>
                </div>
              )}

              <PrivacyScorecard
                score={analysis.score}
                level={analysis.level}
                flags={analysis.flags}
              />

              <DocumentSummary
                domain={analysis.domain}
                docType={analysis.docType}
                summary={{
                  executive_summary: analysis.summary,
                  key_clauses: analysis.risks,
                }}
                loading={false}
              />

              <HighlightsPreview
                excerpts={analysis.highlightedExcerpts}
                onApplyHighlights={() => {
                  // Send highlights to content script for page highlighting
                  chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]?.id) {
                      chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'applyHighlights',
                        excerpts: analysis.highlightedExcerpts,
                      });
                    }
                  });
                }}
              />

              <QuestionAnswerSection
                contentHash={analysis.contentHash}
                documentContent={analysis.documentContent}
                docType={analysis.docType}
                summary={{
                  executive_summary: analysis.summary,
                  key_risks: analysis.risks,
                }}
              />

              <button
                onClick={handleReset}
                className="w-full bg-gray-200 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Analyze Another Document
              </button>
            </>
          )}

          {/* Initial State */}
          {!analysis && !error && (
            <>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-blue-900">
                  💡 Click the button below to analyze Terms of Service, Privacy Policies, and other
                  legal documents on the current page.
                </p>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing Document...
                  </>
                ) : (
                  'Scan Current Page'
                )}
              </button>
            </>
          )}

          {/* Footer Disclaimer */}
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              ⚠️ <strong>Not legal advice.</strong> This is an AI analysis for informational purposes
              only. Always consult a lawyer for legal matters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

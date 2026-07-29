import React from 'react';
import { RiskScore } from './components/RiskScore';
import { DocumentSummary } from './components/DocumentSummary';
import { Loader, RefreshCw, AlertCircle } from 'lucide-react';
import { scanDocument, formatError } from './services/api';
import './index.css';

interface AnalysisState {
  domain: string;
  docType: string;
  documentText: string;
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  risks: string[];
  flags: Array<{
    code: string;
    category: string;
    weight: number;
    description: string;
  }>;
  cached: boolean;
}

interface ErrorState {
  message: string;
  detail?: string;
}

function SidePanelApp() {
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
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
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
          (response) => {
            if (chrome.runtime.lastError) {
              setError({
                message: 'Content script not ready',
                detail: 'Please refresh the page and try again.',
              });
              resolve(null);
              return;
            }

            if (response?.success && response.data) {
              resolve({
                text: response.data.content,
                domain: response.data.domain,
                docType: response.data.docType,
              });
            } else {
              setError({
                message: 'No legal document detected',
                detail: response?.error || 'Could not find a legal document on this page.',
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
        documentText: pageData.text,
        score: response.risk_score.score,
        level: response.risk_score.level,
        summary: response.summary.executive_summary,
        risks: response.summary.key_risks,
        flags: response.risk_score.flags,
        cached: response.cached,
      });

      setError(null);
    } catch (err: any) {
      const errorMessage = formatError(err);
      setError({
        message: err.message || 'Analysis failed',
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="p-4">
            <h1 className="text-lg font-bold text-gray-900">Click Wise</h1>
            <p className="text-xs text-gray-500">Legal document analyzer</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error State */}
          {error && !analysis && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">{error.message}</p>
                  {error.detail && (
                    <p className="text-xs text-red-700 mt-1">{error.detail}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleReset}
                className="mt-3 w-full text-xs font-medium text-red-700 hover:text-red-900 py-1 px-2 rounded hover:bg-red-100 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Initial State */}
          {!analysis && !error && (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Detect and analyze legal documents on this page with AI-powered insights.
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze This Page'
                  )}
                </button>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-800">
                  💡 Click Wise detects Terms of Service, Privacy Policies, Cookie Policies, and more.
                </p>
              </div>
            </div>
          )}

          {/* Analysis State */}
          {analysis && !error && (
            <div className="space-y-4">
              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                Analyze Different Page
              </button>

              {/* Cache indicator */}
              {analysis.cached && (
                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                  <p className="text-xs text-green-700">✓ Loaded from cache</p>
                </div>
              )}

              {/* Risk Score */}
              <RiskScore
                score={analysis.score}
                level={analysis.level}
                flags={analysis.flags}
              />

              {/* Summary */}
              <DocumentSummary
                domain={analysis.domain}
                docType={analysis.docType}
                summary={{
                  executive_summary: analysis.summary,
                  key_clauses: analysis.risks,
                }}
                loading={false}
              />
            </div>
          )}

          {/* Footer Disclaimer */}
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-600 text-center">
              ⚠️ <strong>Not legal advice.</strong> This is an AI analysis for informational
              purposes. Consult a lawyer for legal matters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidePanelApp;

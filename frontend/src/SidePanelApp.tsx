import React from 'react';
import { PrivacyScorecard } from './components/PrivacyScorecard';
import { DocumentSummary } from './components/DocumentSummary';
import { HighlightsPreview } from './components/HighlightsPreview';
import { QuestionAnswerSection } from './components/QuestionAnswerSection';
import { Loader, RefreshCw, AlertCircle, Zap } from 'lucide-react';
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
  contentHash: string;
  flags: Array<{
    code: string;
    category: string;
    weight: number;
    description: string;
  }>;
  highlightedExcerpts: Array<{
    text: string;
    severity: 'high_risk' | 'caution';
    explanation: string;
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

  const extractPageContent = async (): Promise<{
    text: string;
    domain: string;
    docType: string;
  } | null> => {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: chrome.tabs.Tab[]) => {
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

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const pageData = await extractPageContent();
      if (!pageData) {
        setLoading(false);
        return;
      }

      const response = await scanDocument(
        pageData.text,
        pageData.docType,
        pageData.domain
      );

      setAnalysis({
        domain: response.domain,
        docType: response.doc_type,
        documentText: pageData.text,
        score: response.risk_score.score,
        level: response.risk_score.level,
        summary: response.summary.executive_summary,
        risks: response.summary.key_risks,
        contentHash: response.content_hash,
        flags: response.risk_score.flags,
        highlightedExcerpts: response.highlighted_excerpts || [],
        cached: response.cached,
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

  const handleReset = () => {
    setAnalysis(null);
    setError(null);
  };

  const handleHighlightOnPage = () => {
    if (!analysis) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'applyHighlights',
          excerpts: analysis.highlightedExcerpts,
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">Click Wise</h1>
            </div>
            <p className="text-xs text-gray-500 ml-7">AI-powered legal document analyzer</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error State */}
          {error && !analysis && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">{error.message}</p>
                  {error.detail && (
                    <p className="text-xs text-red-700 mt-1">{error.detail}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleReset}
                className="mt-3 w-full text-xs font-medium text-red-700 hover:text-red-900 py-1.5 px-2 rounded hover:bg-red-100 transition-colors bg-white"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Initial State */}
          {!analysis && !error && (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-3">
                  Instantly analyze any legal document on this page to understand what you're agreeing to.
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 px-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Analyze This Page
                    </>
                  )}
                </button>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-800">
                  💡 Detects Terms, Privacy Policies, Cookies, EULAs & more with AI-powered insights.
                </p>
              </div>
            </div>
          )}

          {/* Analysis State */}
          {analysis && !error && (
            <>
              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Analyze Different Page
              </button>

              {/* Cache indicator */}
              {analysis.cached && (
                <div className="bg-green-50 rounded-lg p-2.5 border border-green-200 flex items-center gap-2">
                  <span className="text-lg">✓</span>
                  <p className="text-xs text-green-700">Loaded from cache (instant results)</p>
                </div>
              )}

              {/* Privacy Scorecard - NEW */}
              <PrivacyScorecard
                score={analysis.score}
                level={analysis.level}
                flags={analysis.flags}
              />

              {/* Highlights Preview - NEW */}
              <HighlightsPreview
                excerpts={analysis.highlightedExcerpts}
                onApplyHighlights={handleHighlightOnPage}
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

              {/* Q&A Section - NEW */}
              <QuestionAnswerSection
                contentHash={analysis.contentHash}
                documentContent={analysis.documentText}
                docType={analysis.docType}
                summary={{
                  executive_summary: analysis.summary,
                  key_risks: analysis.risks,
                }}
              />
            </>
          )}

          {/* Footer Disclaimer */}
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 text-center leading-relaxed">
              ⚠️ <strong>Not legal advice.</strong> This is an AI analysis for informational purposes only. Always consult a lawyer for legal matters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidePanelApp;

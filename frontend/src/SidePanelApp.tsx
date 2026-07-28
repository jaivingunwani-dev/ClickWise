import React from 'react';
import { RiskScore } from './components/RiskScore';
import { DocumentSummary } from './components/DocumentSummary';
import { Loader, RefreshCw } from 'lucide-react';
import './index.css';

function SidePanelApp() {
  const [loading, setLoading] = React.useState(false);
  const [analyzed, setAnalyzed] = React.useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAnalyzed(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="p-4">
            <h1 className="text-lg font-bold text-gray-900">Click-Wise</h1>
            <p className="text-xs text-gray-500">Legal document analyzer</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {!analyzed ? (
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
                  💡 Click-Wise detects Terms of Service, Privacy Policies, Cookie Policies, and more.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setAnalyzed(false)}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 py-2"
              >
                <RefreshCw className="w-4 h-4" />
                Analyze Different Page
              </button>

              <RiskScore
                score={58}
                level="high"
                flags={[
                  {
                    code: 'FLAG_DATA_SELLING',
                    description: 'Selling personal data to third parties',
                    weight: 25,
                  },
                  {
                    code: 'FLAG_AUTO_RENEWAL',
                    description: 'Auto-renewal without email notice',
                    weight: 15,
                  },
                  {
                    code: 'FLAG_AI_TRAINING',
                    description: 'User content used for AI training',
                    weight: 20,
                  },
                ]}
              />

              <DocumentSummary
                domain="example-platform.com"
                docType="terms of service"
                summary={{
                  executive_summary:
                    'This Terms of Service outlines the conditions under which you can use this SaaS platform, including data practices, subscription terms, and liability limitations.',
                  key_clauses: [
                    'Automatic renewal every month with 30-day cancellation notice',
                    'User data shared with 15+ third-party providers',
                    'Your content licensed for AI model training',
                  ],
                  user_rights: [
                    'Can export data within 30 days',
                    'Can delete account anytime',
                    'Can opt-out of non-essential tracking',
                  ],
                }}
              />

              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-900">
                  🔍 <strong>Changed since last view:</strong> Data retention policy updated from 12 to
                  24 months
                </p>
              </div>
            </div>
          )}

          {/* Footer Disclaimer */}
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-600 text-center">
              ⚠️ <strong>Not legal advice.</strong> This analysis is for informational purposes.
              Consult a lawyer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidePanelApp;

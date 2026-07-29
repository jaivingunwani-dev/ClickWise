import React from 'react';
import { AlertCircle, Lock, FileText } from 'lucide-react';

interface DocumentSummaryProps {
  domain: string;
  docType: string;
  summary: {
    executive_summary?: string;
    key_clauses?: string[];
    key_risks?: string[];
    user_rights?: string[];
    user_responsibilities?: string[];
  };
  loading?: boolean;
}

export const DocumentSummary: React.FC<DocumentSummaryProps> = ({
  domain,
  docType,
  summary,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-gray-900">{domain}</p>
          <p className="text-xs text-gray-500 capitalize">{docType}</p>
        </div>
      </div>

      {summary.executive_summary && (
        <div className="bg-blue-50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            Executive Summary
          </h4>
          <p className="text-sm text-gray-700">{summary.executive_summary}</p>
        </div>
      )}

      {(summary.key_clauses?.length || 0) + (summary.key_risks?.length || 0) > 0 && (
        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            Key Risks & Clauses
          </h4>
          <ul className="space-y-1">
            {(summary.key_risks || summary.key_clauses || []).slice(0, 5).map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.user_rights && summary.user_rights.length > 0 && (
        <div className="bg-green-50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Your Rights
          </h4>
          <ul className="space-y-1">
            {summary.user_rights.slice(0, 3).map((right, idx) => (
              <li key={idx} className="text-sm text-gray-700">
                • {right}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

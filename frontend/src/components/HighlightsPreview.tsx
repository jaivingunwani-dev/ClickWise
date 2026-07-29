import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Lightbulb } from 'lucide-react';

interface HighlightedExcerpt {
  text: string;
  severity: 'high_risk' | 'caution';
  explanation: string;
}

interface HighlightsPreviewProps {
  excerpts: HighlightedExcerpt[];
  onApplyHighlights?: () => void;
}

export const HighlightsPreview: React.FC<HighlightsPreviewProps> = ({
  excerpts,
  onApplyHighlights,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!excerpts || excerpts.length === 0) {
    return null;
  }

  const highRiskCount = excerpts.filter((e) => e.severity === 'high_risk').length;
  const cautionCount = excerpts.filter((e) => e.severity === 'caution').length;

  return (
    <div className="space-y-3 border-t pt-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-amber-600" />
        <h3 className="text-sm font-semibold text-gray-900">Key Points to Review</h3>
      </div>

      {/* Summary Stats */}
      <div className="flex gap-3">
        {highRiskCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">
              {highRiskCount} High Risk
            </span>
          </div>
        )}
        {cautionCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700">
              {cautionCount} Caution
            </span>
          </div>
        )}
      </div>

      {/* Highlighted Excerpts */}
      <div className="space-y-2">
        {excerpts.slice(0, expanded ? undefined : 3).map((excerpt, idx) => {
          const isHighRisk = excerpt.severity === 'high_risk';
          return (
            <div
              key={idx}
              className={`rounded-lg p-3 space-y-1 ${
                isHighRisk
                  ? 'bg-red-50 border border-red-100'
                  : 'bg-yellow-50 border border-yellow-100'
              }`}
            >
              {/* Severity Badge + Icon */}
              <div className="flex items-start gap-2">
                {isHighRisk ? (
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  {/* Excerpt Text */}
                  <p
                    className={`text-xs font-medium leading-tight ${
                      isHighRisk ? 'text-red-900' : 'text-yellow-900'
                    }`}
                  >
                    "{excerpt.text}"
                  </p>

                  {/* Explanation */}
                  <p
                    className={`text-xs leading-tight ${
                      isHighRisk ? 'text-red-700' : 'text-yellow-700'
                    }`}
                  >
                    {excerpt.explanation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More Button */}
      {excerpts.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 py-1"
        >
          {expanded ? 'Show Less' : `Show ${excerpts.length - 3} More`}
        </button>
      )}

      {/* Highlight on Page CTA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-900 mb-2">
          💡 These excerpts are highlighted in <strong>red</strong> (high risk) and{' '}
          <strong>yellow</strong> (caution) on the webpage. Hover to see explanations.
        </p>
        {onApplyHighlights && (
          <button
            onClick={onApplyHighlights}
            className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Highlight on Page
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
        ⚠️ Highlights are for reference only. Read the full policy for complete context.
      </div>
    </div>
  );
};

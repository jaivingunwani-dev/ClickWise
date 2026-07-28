import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface RiskScoreProps {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: Array<{
    code: string;
    description: string;
    weight: number;
  }>;
}

export const RiskScore: React.FC<RiskScoreProps> = ({ score, level, flags }) => {
  const getColorClass = () => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-900';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-900';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900';
      case 'low':
        return 'bg-green-100 border-green-300 text-green-900';
    }
  };

  const getIcon = () => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5" />;
      case 'low':
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getColorClass()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getIcon()}
          <h3 className="font-semibold">Risk Score</h3>
        </div>
        <span className="text-2xl font-bold">{score}/100</span>
      </div>

      <p className="text-sm mb-3 capitalize">{level} Risk Level</p>

      {flags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Detected Issues:</p>
          <ul className="space-y-1">
            {flags.map((flag) => (
              <li key={flag.code} className="text-sm">
                • {flag.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 text-xs opacity-75">
        ⚠️ This is not legal advice. This analysis is provided for informational purposes only.
      </div>
    </div>
  );
};

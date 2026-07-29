import React from 'react';
import { AlertTriangle, Eye, Lock, Trash2, ShieldAlert, TrendingDown } from 'lucide-react';

interface PrivacyScorecardProps {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  flags: Array<{
    code: string;
    category: string;
    weight: number;
    description: string;
  }>;
}

export const PrivacyScorecard: React.FC<PrivacyScorecardProps> = ({
  score,
  level,
  flags,
}) => {
  // Convert numeric score (0-100) to letter grade
  const getGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Get background gradient and text color based on level
  const getScoreColor = (): { bg: string; text: string; border: string } => {
    switch (level) {
      case 'low':
        return {
          bg: 'from-green-50 to-emerald-50',
          text: 'text-green-700',
          border: 'border-green-200',
        };
      case 'medium':
        return {
          bg: 'from-yellow-50 to-amber-50',
          text: 'text-yellow-700',
          border: 'border-yellow-200',
        };
      case 'high':
        return {
          bg: 'from-orange-50 to-red-50',
          text: 'text-orange-700',
          border: 'border-orange-200',
        };
      case 'critical':
        return {
          bg: 'from-red-50 to-rose-50',
          text: 'text-red-700',
          border: 'border-red-300',
        };
    }
  };

  // Get risk category icons and triggers
  const getRiskCategories = () => {
    const categories = [
      {
        icon: Eye,
        label: 'Ad Tracking',
        code: 'FLAG_TRACKING',
        color: 'text-purple-600',
        bg: 'bg-purple-100',
      },
      {
        icon: Lock,
        label: 'Data Sharing',
        code: 'FLAG_DATA_SELLING',
        color: 'text-blue-600',
        bg: 'bg-blue-100',
      },
      {
        icon: Trash2,
        label: 'Data Retention',
        code: 'FLAG_RETENTION',
        color: 'text-red-600',
        bg: 'bg-red-100',
      },
    ];

    return categories.map((cat) => {
      const triggered = flags.some((f) => f.code === cat.code);
      return {
        ...cat,
        triggered,
      };
    });
  };

  const colors = getScoreColor();
  const grade = getGrade(score);
  const categories = getRiskCategories();
  const criticalFlags = flags.filter((f) => f.weight >= 15);

  return (
    <div
      className={`bg-gradient-to-br ${colors.bg} rounded-lg p-5 border ${colors.border} space-y-4`}
    >
      {/* Score Display Section */}
      <div className="flex items-start justify-between">
        {/* Left: Grade and Risk Level */}
        <div className="flex items-center gap-4">
          {/* Large Grade Badge */}
          <div className="flex flex-col items-center">
            <div
              className={`text-5xl font-bold ${colors.text} leading-none mb-1`}
            >
              {grade}
            </div>
            <div className="text-xs text-gray-600 font-medium">
              {score}/100
            </div>
          </div>

          {/* Risk Level and Description */}
          <div>
            <p className="font-semibold text-gray-900 text-sm">Privacy Score</p>
            <p className={`text-xs font-semibold ${colors.text} capitalize mt-0.5`}>
              {level === 'critical' ? '🚨 Critical Risk' : `${level.charAt(0).toUpperCase() + level.slice(1)} Risk`}
            </p>
            <p className="text-xs text-gray-600 mt-2 max-w-xs">
              {level === 'critical' && 'Major privacy and security concerns detected'}
              {level === 'high' && 'Significant privacy issues to review'}
              {level === 'medium' && 'Some privacy concerns to be aware of'}
              {level === 'low' && 'Few privacy concerns detected'}
            </p>
          </div>
        </div>

        {/* Right: Alert Icon for Critical */}
        {level === 'critical' && (
          <div className="flex-shrink-0">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
          </div>
        )}
      </div>

      {/* Risk Category Badges */}
      <div className="grid grid-cols-3 gap-2">
        {categories.map(({ icon: Icon, label, triggered, color, bg }) => (
          <div
            key={label}
            className={`flex flex-col items-center p-2.5 rounded-lg transition-all ${
              triggered
                ? `${bg} border border-current ${color}`
                : 'bg-gray-100 border border-gray-200'
            }`}
          >
            <Icon
              className={`w-5 h-5 mb-1 ${triggered ? color : 'text-gray-400'}`}
            />
            <span
              className={`text-xs font-semibold text-center leading-tight ${
                triggered ? color : 'text-gray-500'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Critical Issues Summary */}
      {criticalFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-red-900">Critical Issues:</p>
          </div>
          <ul className="space-y-1">
            {criticalFlags.slice(0, 3).map((flag, idx) => (
              <li key={idx} className="text-xs text-red-700 flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">•</span>
                <span>{flag.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="space-y-2 text-xs">
        <p className="font-semibold text-gray-900">Score Breakdown:</p>
        <div className="space-y-1">
          {flags.slice(0, 4).map((flag, idx) => (
            <div key={idx} className="flex items-center justify-between text-gray-600">
              <span>{flag.description.substring(0, 30)}...</span>
              <span className="font-semibold text-gray-700">+{flag.weight}</span>
            </div>
          ))}
          {flags.length > 4 && (
            <div className="text-gray-500 italic pt-1">
              +{flags.length - 4} more flags detected
            </div>
          )}
        </div>
      </div>

      {/* Grade Explanation */}
      <div className="bg-white bg-opacity-60 rounded p-2 text-xs text-gray-700 border border-gray-200">
        <p>
          <strong>Grade Scale:</strong> A (Safe) → B (Acceptable) → C (Caution) → D (Risky) →
          F (Critical)
        </p>
      </div>

      {/* Legal Disclaimer */}
      <div className="text-xs text-gray-600 pt-2 border-t border-gray-300 border-opacity-50">
        ⚠️ <strong>Not legal advice.</strong> This score is for informational purposes only. Consult a
        lawyer for legal concerns.
      </div>
    </div>
  );
};

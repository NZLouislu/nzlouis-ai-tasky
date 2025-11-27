'use client';

import React, { useEffect, useState } from 'react';
import { PartialBlock } from '@blocknote/core';

interface QualityScore {
  overall: number;
  structure: number;
  content: number;
  readability: number;
  details: {
    structureIssues: string[];
    contentIssues: string[];
    readabilityIssues: string[];
  };
}

interface QualityDashboardProps {
  content: PartialBlock[];
  title: string;
  onApplySuggestion?: (suggestion: string) => void;
}

export function QualityDashboard({ content, title, onApplySuggestion }: QualityDashboardProps) {
  const [score, setScore] = useState<QualityScore | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    analyzeQuality();
  }, [content, title]);

  const analyzeQuality = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blog/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title }),
      });

      if (response.ok) {
        const data = await response.json();
        setScore(data);
      }
    } catch (error) {
      console.error('Quality analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!score) return null;

  const allIssues = [
    ...score.details.structureIssues,
    ...score.details.contentIssues,
    ...score.details.readabilityIssues,
  ].slice(0, 5);

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Article Quality</h3>
        <div className={`px-4 py-2 rounded-full font-bold ${getScoreColor(score.overall)}`}>
          {score.overall}/100 - {getScoreLabel(score.overall)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ScoreBar label="Structure" score={score.structure} />
        <ScoreBar label="Content" score={score.content} />
        <ScoreBar label="Readability" score={score.readability} />
      </div>

      {allIssues.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Top Suggestions</h4>
          {allIssues.map((issue, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="text-gray-700">{issue}</p>
              </div>
              {onApplySuggestion && (
                <button
                  onClick={() => onApplySuggestion(issue)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getColor(score)}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );
}

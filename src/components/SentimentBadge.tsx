import React from 'react';
import type { Sentiment } from '../types';

interface SentimentBadgeProps {
  sentiment: Sentiment;
  className?: string;
}

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({ sentiment, className = '' }) => {

  const bgColors = {
    positive: 'bg-green-50',
    negative: 'bg-red-50',
    neutral: 'bg-gray-100',
  };

  const textColors = {
    positive: 'text-green-700',
    negative: 'text-red-700',
    neutral: 'text-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bgColors[sentiment]} ${textColors[sentiment]} ${className}`}
    >
      {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
    </span>
  );
};

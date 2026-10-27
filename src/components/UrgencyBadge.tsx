import React from 'react';
import { UrgencyLevel } from '../types';
import { URGENCY_META } from '../utils/bangladeshData';
import { AlertTriangle, AlertOctagon, Info, Flame } from 'lucide-react';

interface Props {
  urgency: UrgencyLevel;
  lang?: 'en' | 'bn';
}

export const UrgencyBadge: React.FC<Props> = ({ urgency, lang = 'en' }) => {
  const meta = URGENCY_META[urgency] || URGENCY_META.routine;

  const renderIcon = () => {
    switch (urgency) {
      case 'immediate_danger':
        return <Flame className="w-3.5 h-3.5 mr-1 text-red-600 animate-pulse" />;
      case 'high':
        return <AlertOctagon className="w-3.5 h-3.5 mr-1" />;
      case 'elevated':
        return <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      case 'routine':
      default:
        return <Info className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <span
      style={{
        color: meta.color,
        backgroundColor: meta.bg,
        borderColor: meta.border,
      }}
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        urgency === 'immediate_danger' ? 'ring-1 ring-red-400 font-bold' : ''
      }`}
      title={meta.descriptionEn}
    >
      {renderIcon()}
      {lang === 'bn' ? meta.bn : meta.en}
    </span>
  );
};

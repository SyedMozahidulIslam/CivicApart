import React from 'react';
import { ReportStatus } from '../types';
import { STATUS_META } from '../utils/bangladeshData';
import {
  Clock,
  Search,
  CheckCircle2,
  UserCheck,
  Hammer,
  HelpCircle,
  Archive,
  XCircle,
  RotateCcw,
} from 'lucide-react';

interface Props {
  status: ReportStatus;
  lang?: 'en' | 'bn';
  showDescription?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ status, lang = 'en', showDescription = false }) => {
  const meta = STATUS_META[status] || STATUS_META.submitted;

  const renderIcon = () => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-3.5 h-3.5 mr-1" />;
      case 'under_review':
        return <Search className="w-3.5 h-3.5 mr-1" />;
      case 'verified':
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case 'assigned':
        return <UserCheck className="w-3.5 h-3.5 mr-1" />;
      case 'in_progress':
        return <Hammer className="w-3.5 h-3.5 mr-1" />;
      case 'resolved_pending_confirmation':
        return <HelpCircle className="w-3.5 h-3.5 mr-1" />;
      case 'closed':
        return <Archive className="w-3.5 h-3.5 mr-1" />;
      case 'rejected':
        return <XCircle className="w-3.5 h-3.5 mr-1" />;
      case 'reopened':
        return <RotateCcw className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <div className="inline-flex flex-col">
      <span
        style={{
          color: meta.color,
          backgroundColor: meta.bg,
          borderColor: meta.border,
        }}
        className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border shadow-xs tracking-wide"
        title={lang === 'bn' ? meta.descriptionBn : meta.descriptionEn}
      >
        {renderIcon()}
        {lang === 'bn' ? meta.bn : meta.en}
      </span>
      {showDescription && (
        <span className="text-[11px] text-gray-500 mt-1">
          {lang === 'bn' ? meta.descriptionBn : meta.descriptionEn}
        </span>
      )}
    </div>
  );
};

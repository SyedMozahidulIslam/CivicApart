import React, { useEffect, useState } from 'react';
import { Report, User, AuditLogEntry } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { fetchModerationCases, updateReportStatus } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { formatBSTDate } from '../utils/bangladeshData';
import {
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flag,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface Props {
  currentUser: User;
  lang: Language;
  onNavigate: (view: string, param?: string) => void;
}

export const ModeratorWorkspace: React.FC<Props> = ({ currentUser, lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];

  const [pendingReview, setPendingReview] = useState<Report[]>([]);
  const [flagged, setFlagged] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Rejection modal state
  const [rejectReportId, setRejectReportId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchModerationCases();
      setPendingReview(res.pendingReview);
      setFlagged(res.flagged);
      setAuditLogs(res.recentAuditLogs);
    } catch (err: any) {
      console.error('Failed to load moderation cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyReport = async (reportId: string) => {
    try {
      await updateReportStatus(
        reportId,
        'verified',
        'Verified by community moderator after reviewing photographic evidence and location accuracy.'
      );
      setActionFeedback(`Report ${reportId} marked Verified.`);
      loadData();
    } catch (err: any) {
      setActionFeedback(err.message || 'Action failed');
    }
  };

  const handleRejectReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReportId || !rejectionReason.trim()) return;
    try {
      await updateReportStatus(rejectReportId, 'rejected', rejectionReason.trim());
      setActionFeedback(`Report ${rejectReportId} rejected.`);
      setRejectReportId(null);
      setRejectionReason('');
      loadData();
    } catch (err: any) {
      setActionFeedback(err.message || 'Failed to reject report');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-purple-950 text-white rounded-md p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-purple-900">
        <div>
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-purple-300" />
            <h1 className="text-xl font-black tracking-tight">
              {lang === 'bn' ? 'কমিউনিটি মডারেশন ওয়ার্কস্পেস' : 'Community Moderation Queue'}
            </h1>
          </div>
          <p className="text-xs text-purple-200 mt-1">
            Logged in as {currentUser.name} (Moderator) • Reviewing pending submissions and flagged reports.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-purple-900/60 px-3 py-1.5 rounded border border-purple-700">
          <span>Pending: <strong>{pendingReview.length}</strong></span>
          <span>•</span>
          <span>Flagged: <strong>{flagged.length}</strong></span>
        </div>
      </div>

      {actionFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded text-xs flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-600 hover:text-emerald-800">
            ✕
          </button>
        </div>
      )}

      {/* Queue: Reports Awaiting Verification */}
      <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center justify-between">
          <span>Reports Awaiting Review ({pendingReview.length})</span>
          <span className="text-[11px] text-gray-400 font-normal">Requires moderator check</span>
        </h2>

        {loading ? (
          <p className="text-xs text-gray-500 py-4 text-center">{t.common.loading}</p>
        ) : pendingReview.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center italic">
            No reports currently awaiting review. All clear!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingReview.map(report => (
              <div
                key={report.id}
                className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                      {report.publicId}
                    </span>
                    <StatusBadge status={report.status} lang={lang} />
                    <UrgencyBadge urgency={report.urgency} lang={lang} />
                  </div>

                  <h3
                    className="font-bold text-sm text-gray-900 hover:text-blue-800 cursor-pointer"
                    onClick={() => onNavigate('detail', report.id)}
                  >
                    {report.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-2">
                    {report.description}
                  </p>

                  <div className="text-[11px] text-gray-500 flex items-center space-x-2 pt-0.5">
                    <span>📍 {report.location.locality}, {report.location.division}</span>
                    <span>•</span>
                    <span>Reporter: {report.userName}</span>
                    <span>•</span>
                    <span>{formatBSTDate(report.createdAt, lang)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 pt-2 md:pt-0">
                  <button
                    onClick={() => handleVerifyReport(report.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-semibold text-xs flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify</span>
                  </button>

                  <button
                    onClick={() => setRejectReportId(report.id)}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded font-semibold text-xs flex items-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => onNavigate('detail', report.id)}
                    className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-2.5 py-1.5 rounded font-semibold text-xs"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flagged or Suspicious Reports Queue */}
      <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center space-x-2 text-red-800">
          <Flag className="w-4 h-4 text-red-600" />
          <span>Flagged for Content or Community Dispute ({flagged.length})</span>
        </h2>

        {flagged.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center italic">
            No community flags currently open.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {flagged.map(report => (
              <div key={report.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-gray-900">{report.title}</div>
                  <div className="text-[11px] text-red-600 font-semibold">
                    {report.flagsCount} Citizen Flags • Location: {report.location.locality}
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('detail', report.id)}
                  className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded font-semibold"
                >
                  Review Case
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectReportId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2 text-red-700">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Mandatory Rejection Explanation</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every rejection requires a documented reason visible in the public audit history. Reports cannot silently disappear.
            </p>

            <form onSubmit={handleRejectReport} className="space-y-3">
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Duplicate of CA-BD-2026-001; or missing location details; or outside platform scope."
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectReportId(null);
                    setRejectionReason('');
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectionReason.trim()}
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-1.5 rounded text-xs font-bold disabled:opacity-40"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

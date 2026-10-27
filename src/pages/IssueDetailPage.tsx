import React, { useEffect, useState } from 'react';
import {
  Report,
  StatusHistoryEntry,
  ProgressNote,
  CommunityFeedback,
  User,
  ReportStatus,
} from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import {
  fetchReportById,
  updateReportStatus,
  submitCommunityFeedback,
  addProgressNote,
} from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { MapView } from '../components/MapView';
import { formatBSTDate, CATEGORIES } from '../utils/bangladeshData';
import { ALLOWED_TRANSITIONS } from '../utils/statusWorkflow';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Share2,
  ThumbsUp,
  RotateCcw,
  Flag,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  MessageSquare,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

interface Props {
  reportId: string;
  lang: Language;
  onNavigate: (view: string, param?: string) => void;
  currentUser: User;
}

export const IssueDetailPage: React.FC<Props> = ({
  reportId,
  lang,
  onNavigate,
  currentUser,
}) => {
  const t = TRANSLATIONS[lang];

  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [feedbacks, setFeedbacks] = useState<CommunityFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Operator Action State
  const [targetStatus, setTargetStatus] = useState<ReportStatus>('in_progress');
  const [statusComment, setStatusComment] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Progress Note State
  const [newNote, setNewNote] = useState('');
  const [isPublicNote, setIsPublicNote] = useState(true);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchReportById(reportId);
      setReport(res.data);
      setHistory(res.history);
      setNotes(res.notes);
      setFeedbacks(res.feedbacks);
    } catch (err: any) {
      setError(err.message || 'Report not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reportId]);

  const handleCommunityVote = async (type: 'still_exists' | 'seems_resolved' | 'suspicious') => {
    if (currentUser.role === 'visitor') {
      setActionMessage(t.common.loginRequired);
      return;
    }
    try {
      const res = await submitCommunityFeedback(reportId, type);
      setActionMessage(t.common.votedThanks);
      if (report) {
        setReport({
          ...report,
          confirmationsCount: res.confirmationsCount,
          resolvedVotesCount: res.resolvedVotesCount,
          status: res.status,
        });
      }
      loadData();
    } catch (err: any) {
      setActionMessage(err.message || t.common.alreadyVoted);
    }
  };

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    try {
      setIsUpdatingStatus(true);
      setActionMessage(null);
      await updateReportStatus(report.id, targetStatus, statusComment, resolutionPhoto || undefined);
      setActionMessage(`Status updated to "${targetStatus}"`);
      setStatusComment('');
      setResolutionPhoto('');
      loadData();
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddProgressNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !newNote.trim()) return;
    try {
      setIsSubmittingNote(true);
      await addProgressNote(report.id, newNote, isPublicNote);
      setNewNote('');
      setActionMessage('Progress note recorded.');
      loadData();
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setActionMessage('Public report link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500 space-y-2">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">{t.common.loading}</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Report Not Found</h2>
        <p className="text-xs text-gray-500">{error || 'The requested civic report could not be found.'}</p>
        <button
          onClick={() => onNavigate('directory')}
          className="text-xs bg-[#0F2942] text-white px-4 py-2 rounded font-semibold"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const categoryMeta = CATEGORIES.find(c => c.key === report.category);
  const isPrivilegedStaff = ['operator', 'moderator', 'admin'].includes(currentUser.role);
  const nextAllowedStatuses = ALLOWED_TRANSITIONS[report.status] || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Action status banner */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('directory')}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 inline-flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'সকল রিপোর্টে ফিরে যান' : 'Back to Directory'}</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="text-xs text-gray-600 hover:text-blue-700 inline-flex items-center space-x-1 border border-gray-300 px-2.5 py-1 rounded bg-white"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Link</span>
        </button>
      </div>

      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded text-xs font-medium flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            ✕
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-md border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
              {report.publicId}
            </span>
            <span className="text-xs font-semibold text-gray-500">
              {categoryMeta ? (lang === 'bn' ? categoryMeta.bn : categoryMeta.en) : report.category}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <StatusBadge status={report.status} lang={lang} />
            <UrgencyBadge urgency={report.urgency} lang={lang} />
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
          {report.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded border border-gray-200">
          <div>
            <span className="text-gray-500 block">Location:</span>
            <span className="font-bold text-gray-800">
              {report.location.locality}, {report.location.division}
            </span>
            {report.location.landmark && (
              <span className="text-[11px] text-gray-500 block">
                Landmark: {report.location.landmark}
              </span>
            )}
          </div>

          <div>
            <span className="text-gray-500 block">Reported:</span>
            <span className="font-bold text-gray-800">
              {formatBSTDate(report.createdAt, lang)}
            </span>
            <span className="text-[11px] text-gray-500 block">
              Reporter: {report.userName}
            </span>
          </div>

          <div>
            <span className="text-gray-500 block">Assigned To:</span>
            <span className="font-bold text-gray-800">
              {report.assignedOrganizationName || 'Unassigned / Under Platform Moderation'}
            </span>
            {report.targetResolutionDate && (
              <span className="text-[11px] text-amber-700 block font-semibold">
                Target Date: {report.targetResolutionDate}
              </span>
            )}
          </div>
        </div>

        {/* Problem Description */}
        <div className="space-y-1.5 pt-2">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            {lang === 'bn' ? 'সমস্যার বিস্তারিত বিবরণ' : 'Problem Description'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {report.description}
          </p>
        </div>

        {/* Evidence Photos */}
        {report.images && report.images.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {lang === 'bn' ? 'সংযুক্ত আলোকচিত্র প্রমাণ' : 'Photographic Evidence'}
            </h3>
            <div className="flex flex-wrap gap-3">
              {report.images.map((img, idx) => (
                <a
                  key={idx}
                  href={img}
                  target="_blank"
                  rel="noreferrer"
                  className="block group"
                >
                  <img
                    src={img}
                    alt="Evidence photograph"
                    className="w-48 h-36 object-cover rounded border border-gray-300 group-hover:opacity-95 transition-opacity"
                  />
                  <span className="text-[10px] text-gray-500 mt-0.5 block group-hover:text-blue-700">
                    Click to view full photo
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Community Verification Voting Controls */}
        <div className="pt-4 border-t border-gray-200 bg-slate-50 p-4 rounded-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-gray-900">
                {lang === 'bn' ? 'নাগরিক যাচাই ও নিশ্চিতকরণ' : 'Community Verification on the Ground'}
              </h4>
              <p className="text-[11px] text-gray-500">
                Do you reside or travel near this location? Confirm whether this problem still exists or is resolved.
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-emerald-700 font-bold">
                ✓ {report.confirmationsCount} Confirmations
              </span>
              <span className="text-blue-700 font-bold">
                {report.resolvedVotesCount} Resolved votes
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => handleCommunityVote('still_exists')}
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-3.5 py-1.5 rounded text-xs font-bold shadow-2xs transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.common.confirmStillExists}</span>
            </button>

            <button
              onClick={() => handleCommunityVote('seems_resolved')}
              className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded text-xs font-bold shadow-2xs transition-colors flex items-center space-x-1.5"
            >
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.common.confirmResolved}</span>
            </button>

            <button
              onClick={() => handleCommunityVote('suspicious')}
              className="bg-white hover:bg-red-50 text-red-700 border border-red-200 px-2.5 py-1.5 rounded text-xs font-medium ml-auto flex items-center space-x-1"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{t.common.flagAbuse}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Location Map Preview */}
      <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center space-x-1.5">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'bn' ? 'মানচিত্রে নির্দিষ্ট অবস্থান' : 'Geographic Coordinates on Bangladesh Map'}</span>
        </h3>
        <MapView
          reports={[report]}
          center={[report.location.latitude, report.location.longitude]}
          zoom={15}
          height="280px"
          lang={lang}
        />
        <div className="text-[11px] text-gray-500 font-mono">
          GPS: {report.location.latitude.toFixed(5)}, {report.location.longitude.toFixed(5)} ({report.location.locality})
        </div>
      </div>

      {/* Status History & Audit Timeline */}
      <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
          {lang === 'bn' ? 'স্ট্যাটাস পরিবর্তন ও সমাধানের ইতিহাস' : 'Verified Status Lifecycle History'}
        </h3>

        <div className="space-y-4 pl-2">
          {history.map((h, idx) => (
            <div key={h.id || idx} className="relative pl-6 border-l-2 border-blue-200 space-y-1">
              <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
              <div className="flex items-center space-x-2 text-xs">
                <StatusBadge status={h.newStatus} lang={lang} />
                <span className="text-gray-500">•</span>
                <span className="font-semibold text-gray-800">{h.changedByUserName}</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded uppercase">
                  {h.changedByUserRole}
                </span>
                <span className="text-gray-400 text-[11px] ml-auto">
                  {formatBSTDate(h.timestamp, lang)}
                </span>
              </div>
              <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                {h.comment}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Notes from Operators */}
      <div className="bg-white rounded-md border border-gray-200 p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center justify-between">
          <span>{lang === 'bn' ? 'অপারেশনাল অগ্রগতির নোটসমূহ' : 'Municipal Operator Progress Updates'}</span>
          <span className="text-[11px] text-gray-400 font-normal">
            {notes.length} {lang === 'bn' ? 'টি আপডেট' : 'updates recorded'}
          </span>
        </h3>

        {notes.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            No public progress notes recorded yet by the municipal operator team.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map(n => (
              <div key={n.id} className="bg-gray-50 p-3 rounded border border-gray-200 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span className="font-bold text-gray-800">
                    {n.authorName} {n.organizationName ? `(${n.organizationName})` : ''}
                  </span>
                  <span>{formatBSTDate(n.createdAt, lang)}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{n.note}</p>
                {!n.isPublic && (
                  <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded font-bold">
                    Internal Operator Note
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Progress Note Form (Operators/Admins only) */}
        {isPrivilegedStaff && (
          <form onSubmit={handleAddProgressNote} className="pt-3 border-t border-gray-200 space-y-2">
            <label className="block text-xs font-bold text-gray-800">
              Add Operational Progress Note (Logged as {currentUser.name})
            </label>
            <textarea
              rows={2}
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="e.g. Procurement of materials complete. Road crew mobilized for night shift."
              className="w-full border border-gray-300 rounded p-2 text-xs"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={isPublicNote}
                  onChange={e => setIsPublicNote(e.target.checked)}
                />
                <span>Visible to Public Citizens</span>
              </label>
              <button
                type="submit"
                disabled={isSubmittingNote || !newNote.trim()}
                className="bg-[#0F2942] hover:bg-[#1E3A8A] text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-40"
              >
                Save Note
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Operator Workflow Controls (For Operators, Moderators, Admins) */}
      {isPrivilegedStaff && nextAllowedStatuses.length > 0 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-md p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-blue-700" />
            <span>Workflow Status Transition Panel ({currentUser.role.toUpperCase()})</span>
          </h3>

          <form onSubmit={handleStatusTransition} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Target Status:
                </label>
                <select
                  value={targetStatus}
                  onChange={e => setTargetStatus(e.target.value as ReportStatus)}
                  className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white"
                >
                  {nextAllowedStatuses.map(s => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Resolution Proof Photo URL (Optional):
                </label>
                <input
                  type="url"
                  value={resolutionPhoto}
                  onChange={e => setResolutionPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded p-1.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Official Action Explanation / Audit Reason <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={statusComment}
                onChange={e => setStatusComment(e.target.value)}
                placeholder="e.g. Verified by DNCC field supervisor; repaired asphalt patch laid."
                className="w-full border border-gray-300 rounded p-1.5 text-xs"
              />
            </div>

            <div className="text-right">
              <button
                type="submit"
                disabled={isUpdatingStatus || !statusComment.trim()}
                className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded text-xs font-bold shadow-xs disabled:opacity-40"
              >
                {isUpdatingStatus ? 'Updating...' : `Commit Status: ${targetStatus.toUpperCase()}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

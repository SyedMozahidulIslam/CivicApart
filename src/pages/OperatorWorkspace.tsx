import React, { useEffect, useState } from 'react';
import { Report, User } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { fetchReports, updateReportStatus, addProgressNote } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { formatBSTDate } from '../utils/bangladeshData';
import {
  Building2,
  Hammer,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  Upload,
  AlertCircle,
} from 'lucide-react';

interface Props {
  currentUser: User;
  lang: Language;
  onNavigate: (view: string, param?: string) => void;
}

export const OperatorWorkspace: React.FC<Props> = ({ currentUser, lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];

  const [assignedReports, setAssignedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionComment, setResolutionComment] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchReports({ limit: 50 });
      // Filter reports assigned to operator's organization, or active operational reports
      const assigned = res.data.filter(
        r =>
          r.assignedOrganizationId === currentUser.organizationId ||
          r.status === 'assigned' ||
          r.status === 'in_progress'
      );
      setAssignedReports(assigned);
    } catch (err) {
      console.error('Failed to load operator reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.organizationId]);

  const handleStartWork = async (reportId: string) => {
    try {
      await updateReportStatus(
        reportId,
        'in_progress',
        'Field work initiated. Remediation crew mobilized to site.'
      );
      setFeedback(`Ticket ${reportId} marked In Progress.`);
      loadData();
    } catch (err: any) {
      setFeedback(err.message || 'Action failed');
    }
  };

  const handleMarkResolved = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !resolutionComment.trim()) return;

    try {
      setIsSubmitting(true);
      await updateReportStatus(
        selectedReport.id,
        'resolved_pending_confirmation',
        resolutionComment.trim(),
        resolutionPhoto || undefined
      );

      // Also add public progress note
      await addProgressNote(
        selectedReport.id,
        `Remediation complete: ${resolutionComment.trim()}`,
        true,
        resolutionPhoto || undefined
      );

      setFeedback(`Report marked Resolved. Local community confirmation requested.`);
      setSelectedReport(null);
      setResolutionComment('');
      setResolutionPhoto('');
      loadData();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to submit resolution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-[#1C3D5A] text-white rounded-md p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-900">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-300" />
            <h1 className="text-xl font-black tracking-tight">
              {currentUser.organizationName || 'Municipal Authority Operations Workspace'}
            </h1>
          </div>
          <p className="text-xs text-blue-200 mt-1">
            Operator: {currentUser.name} • Active Field Dispatch & Ground Resolution Tracking
          </p>
        </div>

        <div className="text-xs bg-blue-950/70 border border-blue-800 px-3 py-1.5 rounded">
          Active Assigned Tickets: <strong>{assignedReports.length}</strong>
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-600 hover:text-emerald-800">
            ✕
          </button>
        </div>
      )}

      {/* Main Ticket Queue */}
      <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center justify-between">
          <span>Assigned Maintenance Queue</span>
          <span className="text-[11px] text-gray-400 font-normal">Dispatched by municipal authorities</span>
        </h2>

        {loading ? (
          <p className="text-xs text-gray-500 py-4 text-center">{t.common.loading}</p>
        ) : assignedReports.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center italic">
            No active tickets assigned to this division at the moment.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {assignedReports.map(report => (
              <div
                key={report.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 max-w-2xl">
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

                  <p className="text-xs text-gray-600 line-clamp-2">{report.description}</p>

                  <div className="text-[11px] text-gray-500 flex items-center space-x-2 pt-0.5">
                    <span>📍 {report.location.locality}, {report.location.division}</span>
                    <span>•</span>
                    <span>Lead: {report.assignedAssigneeName || 'Unassigned lead'}</span>
                    {report.targetResolutionDate && (
                      <>
                        <span>•</span>
                        <span className="text-amber-700 font-semibold">Target: {report.targetResolutionDate}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 pt-2 md:pt-0">
                  {report.status === 'assigned' && (
                    <button
                      onClick={() => handleStartWork(report.id)}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center space-x-1"
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>Start Work</span>
                    </button>
                  )}

                  {report.status === 'in_progress' && (
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}

                  <button
                    onClick={() => onNavigate('detail', report.id)}
                    className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-2.5 py-1.5 rounded font-semibold text-xs"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolution Submission Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md shadow-xl max-w-lg w-full p-6 space-y-4 border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Submit Ground Resolution Evidence</span>
              </h3>
              <span className="font-mono text-xs font-bold text-gray-500">{selectedReport.publicId}</span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Record what remediation work was carried out. CivicApart will notify local community residents to confirm that the issue has indeed been resolved on the ground.
            </p>

            <form onSubmit={handleMarkResolved} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Remediation Work Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionComment}
                  onChange={e => setResolutionComment(e.target.value)}
                  placeholder="e.g. Repaired road surface with hot mix asphalt; compacted and sealed 12m section."
                  className="w-full border border-gray-300 rounded p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Resolution Proof Photo URL (Optional):
                </label>
                <input
                  type="url"
                  value={resolutionPhoto}
                  onChange={e => setResolutionPhoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-gray-300 rounded p-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-3 py-1.5 border border-gray-300 rounded font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !resolutionComment.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded font-bold shadow-xs disabled:opacity-40"
                >
                  {isSubmitting ? 'Recording...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

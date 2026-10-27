import React, { useEffect, useState } from 'react';
import { Report, User } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { fetchReports } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { formatBSTDate } from '../utils/bangladeshData';
import {
  FileText,
  MapPin,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

interface Props {
  currentUser: User;
  lang: Language;
  onNavigate: (view: string, param?: string) => void;
}

export const CitizenDashboard: React.FC<Props> = ({ currentUser, lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];

  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserReports() {
      try {
        setLoading(true);
        const res = await fetchReports({ limit: 50 });
        const authored = res.data.filter(
          r => r.userId === currentUser.id || r.userName === currentUser.name
        );
        setMyReports(authored);
      } catch (err) {
        console.error('Failed to load citizen reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserReports();
  }, [currentUser.id]);

  const activeReports = myReports.filter(r => !['closed', 'rejected'].includes(r.status));
  const resolvedReports = myReports.filter(r => ['closed', 'resolved_pending_confirmation'].includes(r.status));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-md border border-gray-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-gray-900">{currentUser.name}</h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold capitalize">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-gray-500">{currentUser.email} • Citizen ID: {currentUser.id}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('report')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন সমস্যা জানান' : 'Report New Problem'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">Total Submissions</span>
          <span className="text-2xl font-black text-gray-900">{myReports.length}</span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Recorded civic submissions</span>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">Active in Resolution</span>
          <span className="text-2xl font-black text-amber-600">{activeReports.length}</span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Under review, assigned, or in progress</span>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">Resolved or Closed</span>
          <span className="text-2xl font-black text-emerald-600">{resolvedReports.length}</span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Ground resolution verified</span>
        </div>
      </div>

      <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
          {lang === 'bn' ? 'আমার জমা দেওয়া রিপোর্টসমূহ' : 'My Submitted Civic Reports'}
        </h2>

        {loading ? (
          <p className="text-xs text-gray-500 py-6 text-center">{t.common.loading}</p>
        ) : myReports.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <FileText className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs text-gray-600 font-medium">You have not submitted any civic reports yet.</p>
            <button
              onClick={() => onNavigate('report')}
              className="text-xs text-blue-700 hover:underline font-bold"
            >
              Report a local problem in your area
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {myReports.map(report => (
              <div
                key={report.id}
                onClick={() => onNavigate('detail', report.id)}
                className="py-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                      {report.publicId}
                    </span>
                    <StatusBadge status={report.status} lang={lang} />
                    <UrgencyBadge urgency={report.urgency} lang={lang} />
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 hover:text-blue-800 line-clamp-1">
                    {report.title}
                  </h3>

                  <div className="flex items-center space-x-3 text-[11px] text-gray-500">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{report.location.locality}, {report.location.division}</span>
                    </span>
                    <span>•</span>
                    <span>{formatBSTDate(report.createdAt, lang)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 text-xs">
                  <span className="font-semibold text-emerald-700 text-xs">
                    ✓ {report.confirmationsCount} confirmations
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onNavigate('detail', report.id);
                    }}
                    className="bg-[#0F2942] hover:bg-[#1E3A8A] text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1"
                  >
                    <span>Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

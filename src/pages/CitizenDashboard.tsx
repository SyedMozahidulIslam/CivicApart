import React, { useEffect, useState } from 'react';
import { Report, User, CivicNotification } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { fetchReports, fetchSavedReports, fetchNotifications, markNotificationRead } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { formatBSTDate } from '../utils/bangladeshData';
import {
  FileText,
  MapPin,
  PlusCircle,
  ArrowRight,
  Bookmark,
  Bell,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface Props {
  currentUser: User;
  lang: Language;
  onNavigate: (view: string, param?: string) => void;
}

export const CitizenDashboard: React.FC<Props> = ({ currentUser, lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<'my_reports' | 'saved' | 'notifications'>('my_reports');
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [savedReports, setSavedReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<CivicNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [reportsRes, savedData, notifsData] = await Promise.all([
          fetchReports({ limit: 100 }),
          fetchSavedReports().catch(() => []),
          fetchNotifications().catch(() => []),
        ]);

        const authored = reportsRes.data.filter(
          r => r.userId === currentUser.id || r.userName === currentUser.name
        );
        setMyReports(authored);
        setSavedReports(savedData);
        setNotifications(notifsData);
      } catch (err) {
        console.error('Failed to load citizen dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [currentUser.id, currentUser.name]);

  const activeReports = myReports.filter(r => !['closed', 'rejected'].includes(r.status));
  const resolvedReports = myReports.filter(r => ['closed', 'resolved_pending_confirmation'].includes(r.status));
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Citizen Header */}
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">Total Submissions</span>
          <span className="text-2xl font-black text-gray-900">{myReports.length}</span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Recorded civic reports authored by you</span>
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

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('my_reports')}
          className={`pb-2.5 border-b-2 flex items-center space-x-1.5 transition-colors ${
            activeTab === 'my_reports'
              ? 'border-emerald-600 text-emerald-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'আমার রিপোর্টসমূহ' : 'My Submissions'} ({myReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-2.5 border-b-2 flex items-center space-x-1.5 transition-colors ${
            activeTab === 'saved'
              ? 'border-emerald-600 text-emerald-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'সংরক্ষিত ও অনুসরণকৃত' : 'Saved & Followed'} ({savedReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-2.5 border-b-2 flex items-center space-x-1.5 transition-colors ${
            activeTab === 'notifications'
              ? 'border-emerald-600 text-emerald-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}</span>
          {unreadCount > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: My Reports */}
      {activeTab === 'my_reports' && (
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
      )}

      {/* TAB 2: Saved & Followed Reports */}
      {activeTab === 'saved' && (
        <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              {lang === 'bn' ? 'সংরক্ষিত সমস্যা ও আপডেট ট্র্যাকিং' : 'Saved Issues & Followed Updates'}
            </h2>
            <span className="text-xs text-gray-500">Issues you are tracking for resolution</span>
          </div>

          {loading ? (
            <p className="text-xs text-gray-500 py-6 text-center">{t.common.loading}</p>
          ) : savedReports.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Bookmark className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-600 font-medium">You haven&apos;t saved or followed any civic reports yet.</p>
              <button
                onClick={() => onNavigate('directory')}
                className="text-xs text-blue-700 hover:underline font-bold"
              >
                Browse open civic issues to follow
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {savedReports.map(report => (
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
                      <span>By: {report.userName}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 text-xs">
                    <span className="text-xs text-emerald-700 font-semibold">
                      ✓ {report.confirmationsCount} confirmations
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onNavigate('detail', report.id);
                      }}
                      className="bg-[#0F2942] hover:bg-[#1E3A8A] text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              {lang === 'bn' ? 'কার্যক্রম বিজ্ঞপ্তি' : 'Activity & Progress Notifications'}
            </h2>
            <span className="text-xs text-gray-500">Official status updates and ground notes</span>
          </div>

          {loading ? (
            <p className="text-xs text-gray-500 py-6 text-center">{t.common.loading}</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Bell className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-600 font-medium">No activity notifications at this time.</p>
              <p className="text-[11px] text-gray-400">You will receive notifications when reports you submit or follow change status.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    handleMarkAsRead(n.id);
                    onNavigate('detail', n.reportId);
                  }}
                  className={`p-3.5 rounded hover:bg-slate-50 transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                    !n.isRead ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-gray-900">{n.title}</span>
                      {!n.isRead && (
                        <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700">{n.message}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatBSTDate(n.createdAt, lang)}</span>
                      <span>•</span>
                      <span className="text-blue-700 font-medium">Ref: {n.reportTitle}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {!n.isRead && (
                      <button
                        onClick={e => handleMarkAsRead(n.id, e)}
                        title="Mark as read"
                        className="text-gray-400 hover:text-gray-700 p-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onNavigate('detail', n.reportId);
                      }}
                      className="text-xs text-[#0F2942] hover:underline flex items-center space-x-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

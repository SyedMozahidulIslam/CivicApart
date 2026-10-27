import React, { useEffect, useState } from 'react';
import { Report, PlatformStats, User } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { fetchReports, fetchAnalytics, submitCommunityFeedback } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { MapView } from '../components/MapView';
import { formatBSTDate } from '../utils/bangladeshData';
import {
  PlusCircle,
  FileText,
  Map as MapIcon,
  Clock,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface Props {
  lang: Language;
  onNavigate: (view: string, param?: string) => void;
  currentUser: User;
}

export const HomePage: React.FC<Props> = ({ lang, onNavigate, currentUser }) => {
  const t = TRANSLATIONS[lang];

  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [needConfirmReports, setNeedConfirmReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [reportsRes, analyticsData] = await Promise.all([
          fetchReports({ limit: 8, sort: 'recent' }),
          fetchAnalytics(),
        ]);

        setRecentReports(reportsRes.data.slice(0, 4));
        const needConf = reportsRes.data.filter(
          r => r.status === 'resolved_pending_confirmation' || r.status === 'submitted'
        );
        setNeedConfirmReports(needConf.length > 0 ? needConf.slice(0, 3) : reportsRes.data.slice(0, 3));
        setStats(analyticsData);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuickConfirm = async (reportId: string, type: 'still_exists' | 'seems_resolved') => {
    if (currentUser.role === 'visitor') {
      setFeedbackMessage({ id: reportId, text: t.common.loginRequired });
      return;
    }
    try {
      await submitCommunityFeedback(reportId, type);
      setFeedbackMessage({ id: reportId, text: t.common.votedThanks });
      setNeedConfirmReports(prev =>
        prev.map(r => (r.id === reportId ? { ...r, confirmationsCount: r.confirmationsCount + 1 } : r))
      );
    } catch (err: any) {
      setFeedbackMessage({ id: reportId, text: err.message || t.common.alreadyVoted });
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#0F2942] to-[#123352] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-[#1E3A8A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'bn' ? 'স্বচ্ছ নাগরিক প্ল্যাটফর্ম' : 'Verified Public Civic Resolution'}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                {t.hero.headline}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                {t.hero.subtext}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => onNavigate('report')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded font-bold text-sm flex items-center space-x-2 shadow-md transition-all active:scale-98"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.hero.reportBtn}</span>
                </button>

                <button
                  onClick={() => onNavigate('directory')}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-4 py-2.5 rounded font-semibold text-sm flex items-center space-x-2 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.hero.browseBtn}</span>
                </button>

                <button
                  onClick={() => onNavigate('map')}
                  className="bg-blue-900/60 hover:bg-blue-900 text-blue-200 border border-blue-700/60 px-4 py-2.5 rounded font-semibold text-sm flex items-center space-x-2 transition-colors"
                >
                  <MapIcon className="w-4 h-4 text-blue-300" />
                  <span>{t.hero.viewMapBtn}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                🛡️ {t.common.disclaimer}
              </p>
            </div>

            {/* Quick Metrics Strip */}
            <div className="lg:col-span-5 bg-[#0A1A2B]/90 rounded-md border border-slate-700 p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                <span>{lang === 'bn' ? 'সরাসরি প্ল্যাটফর্ম স্ট্যাটাস' : 'Live Platform Verification'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-center sm:text-left">
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-xs text-slate-400 block">{t.stats.totalReports}</span>
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {stats?.totalReports ?? '--'}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    {lang === 'bn' ? '৮টি বিভাগ সংযুক্ত' : 'Across 8 Divisions'}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-xs text-slate-400 block">{t.stats.resolvedRate}</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">
                    {stats ? `${Math.round((stats.resolvedReports / (stats.totalReports || 1)) * 100)}%` : '--'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {stats?.resolvedReports} {lang === 'bn' ? 'টি সমাধান নিশ্চিত' : 'resolved tickets'}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-xs text-slate-400 block">{t.stats.inProgress}</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-400">
                    {stats?.inProgressReports ?? '--'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {lang === 'bn' ? 'মেরামত কাজ চলছে' : 'Active remediation'}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-xs text-slate-400 block">{t.stats.confirmations}</span>
                  <span className="text-xl sm:text-2xl font-black text-blue-400">
                    {stats?.communityConfirmationsTotal ?? '--'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {lang === 'bn' ? 'স্বেচ্ছাসেবী নাগরিক ভোট' : 'Community validations'}
                  </span>
                </div>
              </div>

              <div className="text-right pt-1">
                <button
                  onClick={() => onNavigate('transparency')}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1"
                >
                  <span>{lang === 'bn' ? 'বিস্তারিত পরিসংখ্যান দেখুন' : 'Explore Full Public Transparency'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section: Live Map Preview */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'bn' ? 'লাইভ বাংলাদেশ ইস্যু ম্যাপ' : 'Live Bangladesh Problem Map'}</span>
              </h2>
              <p className="text-xs text-gray-500">
                {lang === 'bn'
                  ? 'মানচিত্রে সরাসরি পিন করা সাম্প্রতিক সমস্যাসমূহ দেখুন।'
                  : 'Geocoded reports across Dhaka, Chattogram, Sylhet, Rajshahi, and other cities.'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="text-xs font-bold text-blue-800 hover:text-blue-900 self-start sm:self-auto inline-flex items-center space-x-1"
            >
              <span>{lang === 'bn' ? 'পূর্ণাঙ্গ ম্যাপ ভিউ খুলুন' : 'Open Full Screen Map'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <MapView
            reports={recentReports}
            height="380px"
            lang={lang}
            onSelectReport={report => onNavigate('detail', report.id)}
          />
        </section>

        {/* Section: Issues Needing Community Confirmation */}
        <section className="space-y-4">
          <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <span>{t.homeSections.needConfirmation}</span>
              </h2>
              <p className="text-xs text-gray-500">{t.homeSections.needConfirmationSub}</p>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">
              {lang === 'bn' ? 'নাগরিক অংশগ্রহণ' : 'Citizen Verification'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {needConfirmReports.map(report => (
              <div
                key={report.id}
                className="bg-white rounded-md border border-gray-200 p-4 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {report.publicId}
                    </span>
                    <StatusBadge status={report.status} lang={lang} />
                  </div>

                  <h3
                    className="font-bold text-sm text-gray-900 hover:text-blue-800 cursor-pointer line-clamp-2"
                    onClick={() => onNavigate('detail', report.id)}
                  >
                    {report.title}
                  </h3>

                  <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">
                      {report.location.locality}, {report.location.division}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2">
                    {report.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium text-emerald-700">
                      ✓ {report.confirmationsCount} {lang === 'bn' ? 'জন নিশ্চিত করেছেন' : 'confirmations'}
                    </span>
                    <button
                      onClick={() => onNavigate('detail', report.id)}
                      className="text-blue-700 hover:underline font-semibold"
                    >
                      {t.common.viewDetails}
                    </button>
                  </div>

                  {feedbackMessage?.id === report.id ? (
                    <div className="text-[11px] bg-emerald-50 text-emerald-800 p-1.5 rounded font-medium text-center">
                      {feedbackMessage.text}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleQuickConfirm(report.id, 'still_exists')}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 px-2 rounded font-medium text-center transition-colors border border-slate-200"
                      >
                        {t.common.confirmStillExists}
                      </button>
                      <button
                        onClick={() => handleQuickConfirm(report.id, 'seems_resolved')}
                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-1.5 px-2 rounded font-medium text-center transition-colors border border-emerald-200"
                      >
                        {t.common.confirmResolved}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Recently Reported Issues */}
        <section className="space-y-4">
          <div className="border-b border-gray-200 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-700" />
                <span>{t.homeSections.recentIssues}</span>
              </h2>
              <p className="text-xs text-gray-500">{t.homeSections.recentIssuesSub}</p>
            </div>
            <button
              onClick={() => onNavigate('directory')}
              className="text-xs font-bold text-blue-800 hover:text-blue-900 inline-flex items-center space-x-1"
            >
              <span>{t.homeSections.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentReports.map(report => (
              <div
                key={report.id}
                onClick={() => onNavigate('detail', report.id)}
                className="bg-white rounded-md border border-gray-200 p-4 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer flex gap-4"
              >
                {report.images && report.images.length > 0 ? (
                  <img
                    src={report.images[0]}
                    alt={report.title}
                    className="w-24 h-24 object-cover rounded shrink-0 bg-gray-100 border border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded bg-slate-100 border border-slate-200 shrink-0 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <FileText className="w-6 h-6 mb-1 opacity-40" />
                    <span>No image</span>
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-bold text-gray-500">
                        {report.publicId}
                      </span>
                      <StatusBadge status={report.status} lang={lang} />
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 line-clamp-1 hover:text-blue-800">
                      {report.title}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 mt-2 border-t border-gray-100">
                    <span className="truncate max-w-[160px]">
                      📍 {report.location.locality}
                    </span>
                    <span className="shrink-0 text-gray-400">
                      {formatBSTDate(report.createdAt, lang)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: How CivicApart Works */}
        <section className="bg-slate-50 border border-slate-200 rounded-md p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1">
            <h2 className="text-xl font-bold text-gray-900">
              {t.homeSections.howItWorksTitle}
            </h2>
            <p className="text-xs text-gray-600">
              {lang === 'bn'
                ? 'নাগরিক অভিযোগ জমা থেকে শুরু করে যাচাই ও কাজের সমাপ্তি পর্যন্ত একটি স্বচ্ছ চক্র।'
                : 'A transparent, community-anchored resolution lifecycle designed for civic accountability.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded border border-gray-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-bold text-sm text-gray-900">{t.homeSections.step1Title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{t.homeSections.step1Desc}</p>
            </div>

            <div className="bg-white p-4 rounded border border-gray-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-bold text-sm text-gray-900">{t.homeSections.step2Title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{t.homeSections.step2Desc}</p>
            </div>

            <div className="bg-white p-4 rounded border border-gray-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-bold text-sm text-gray-900">{t.homeSections.step3Title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{t.homeSections.step3Desc}</p>
            </div>

            <div className="bg-white p-4 rounded border border-gray-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                4
              </div>
              <h3 className="font-bold text-sm text-gray-900">{t.homeSections.step4Title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{t.homeSections.step4Desc}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { PlatformStats } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { fetchAnalytics } from '../services/api';
import { CATEGORIES, STATUS_META } from '../utils/bangladeshData';
import {
  BarChart2,
  PieChart,
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Shield,
  Info,
} from 'lucide-react';

interface Props {
  lang: Language;
}

export const TransparencyPage: React.FC<Props> = ({ lang }) => {
  const t = TRANSLATIONS[lang];

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await fetchAnalytics();
        setStats(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500 space-y-2">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">{t.common.loading}</p>
      </div>
    );
  }

  const resolutionPercentage =
    stats.totalReports > 0
      ? Math.round((stats.resolvedReports / stats.totalReports) * 100)
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {lang === 'bn' ? 'উন্মুক্ত নাগরিক স্বচ্ছতা ও পরিসংখ্যান' : 'Public Transparency & Resolution Analytics'}
          </h1>
        </div>
        <p className="text-xs text-gray-500 mt-1 max-w-2xl">
          {lang === 'bn'
            ? 'সকল মেট্রিক্স ডাটাবেজের প্রকৃত রিপোর্ট এবং কমিউনিটি ভোটের ভিত্তিতে সরাসরি গণনা করা হয়েছে। কোনো কাল্পনিক সংখ্যা বা সরকার দাবি প্রদর্শন করা হয় না।'
            : 'All metrics are computed live from authentic database submissions and community confirmations. No fabricated figures or unverified government endorsements.'}
        </p>
      </div>

      {/* Top Counters Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-md border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">{t.stats.totalReports}</span>
          <span className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 block">
            {stats.totalReports}
          </span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Across Bangladesh municipalities</span>
        </div>

        <div className="bg-white p-5 rounded-md border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">{t.stats.resolvedRate}</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">
            {resolutionPercentage}%
          </span>
          <span className="text-[11px] text-gray-400 block mt-0.5">
            {stats.resolvedReports} resolved / confirmed tickets
          </span>
        </div>

        <div className="bg-white p-5 rounded-md border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">{t.stats.inProgress}</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
            {stats.inProgressReports}
          </span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Active remediation underway</span>
        </div>

        <div className="bg-white p-5 rounded-md border border-gray-200 shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block">{t.stats.avgDays}</span>
          <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 block">
            {stats.averageResolutionDays} Days
          </span>
          <span className="text-[11px] text-gray-400 block mt-0.5">Average verified turnaround</span>
        </div>
      </div>

      {/* Two Columns: Category Breakdown & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-md border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            Reports by Civic Category
          </h2>

          <div className="space-y-3">
            {CATEGORIES.map(cat => {
              const count = stats.categoryBreakdown[cat.key] || 0;
              const pct = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
              return (
                <div key={cat.key} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-semibold">{lang === 'bn' ? cat.bn : cat.en}</span>
                    <span className="font-mono text-gray-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      className="h-full rounded-full transition-all"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Lifecycle Distribution */}
        <div className="bg-white p-6 rounded-md border border-gray-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            Status Lifecycle Distribution
          </h2>

          <div className="space-y-2.5">
            {Object.entries(STATUS_META).map(([statusKey, meta]) => {
              const count = stats.statusBreakdown[statusKey as any] || 0;
              const pct = stats.totalReports > 0 ? Math.round((count / stats.totalReports) * 100) : 0;
              return (
                <div key={statusKey} className="p-2.5 rounded border border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      style={{ backgroundColor: meta.color }}
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                    ></span>
                    <div>
                      <span className="font-bold text-gray-800">
                        {lang === 'bn' ? meta.bn : meta.en}
                      </span>
                      <span className="text-[10px] text-gray-500 block">
                        {lang === 'bn' ? meta.descriptionBn : meta.descriptionEn}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-gray-800 shrink-0">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Division Distribution */}
      <div className="bg-white p-6 rounded-md border border-gray-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
          Reports by Administrative Division
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {Object.entries(stats.divisionBreakdown).map(([divName, count]) => (
            <div key={divName} className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
              <span className="text-gray-500 block text-[11px] font-bold uppercase">{divName}</span>
              <span className="text-xl font-black text-[#0F2942] block mt-1">{count}</span>
              <span className="text-[10px] text-gray-400">active reports</span>
            </div>
          ))}
        </div>
      </div>

      {/* Explanatory Methodology Card */}
      <div className="bg-blue-50 border border-blue-200 p-5 rounded-md text-xs text-blue-900 space-y-2">
        <h3 className="font-bold flex items-center space-x-1.5 text-blue-950">
          <Info className="w-4 h-4 text-blue-700" />
          <span>Transparency Methodology & Integrity Note</span>
        </h3>
        <p className="leading-relaxed">
          CivicApart distinguishes between <em>Operator-Reported Resolution</em> (the stage where an authorized crew uploads proof that work is finished) and <em>Community-Confirmed Closure</em> (where local citizens independently confirm the problem is gone). If a resolved issue receives 3+ subsequent reports that the problem persists, the ticket is automatically reopened.
        </p>
      </div>
    </div>
  );
};

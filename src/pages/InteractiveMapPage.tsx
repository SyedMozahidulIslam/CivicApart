import React, { useEffect, useState } from 'react';
import { Report, IssueCategory, ReportStatus } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { fetchReports } from '../services/api';
import { MapView } from '../components/MapView';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { BANGLADESH_DIVISIONS, CATEGORIES, formatBSTDate } from '../utils/bangladeshData';
import {
  MapPin,
  Filter,
  Layers,
  ChevronRight,
  Maximize2,
  Compass,
} from 'lucide-react';

interface Props {
  lang: Language;
  onNavigate: (view: string, param?: string) => void;
}

export const InteractiveMapPage: React.FC<Props> = ({ lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Filters
  const [category, setCategory] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>([23.8103, 90.4125]); // Dhaka
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [activeDivision, setActiveDivision] = useState<string>('Dhaka');

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await fetchReports({
          category: category !== 'all' ? category : undefined,
          status: status !== 'all' ? status : undefined,
          limit: 100, // Show all active pins on map
        });
        setReports(res.data);
      } catch (err) {
        console.error('Failed to load map reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [category, status]);

  const handleSelectDivision = (divName: string) => {
    const divData = BANGLADESH_DIVISIONS.find(d => d.name === divName);
    if (divData) {
      setActiveDivision(divName);
      setMapCenter([divData.centerLat, divData.centerLng]);
      setMapZoom(12);
    }
  };

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    if (report.location?.latitude && report.location?.longitude) {
      setMapCenter([report.location.latitude, report.location.longitude]);
      setMapZoom(16);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Title & Division Switcher */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
              <Compass className="w-6 h-6 text-emerald-600" />
              <span>{lang === 'bn' ? 'বাংলাদেশ ইন্টারেক্টিভ নাগরিক ম্যাপ' : 'Interactive Bangladesh Problem Map'}</span>
            </h1>
            <p className="text-xs text-gray-500">
              {lang === 'bn'
                ? 'বাংলাদেশের বিভিন্ন প্রান্তের জমা হওয়া সমস্যাসমূহ সরাসরি মানচিত্রে দেখুন।'
                : 'Live OpenStreetMap coordinates of reported municipal issues with category pins.'}
            </p>
          </div>

          {/* Report Problem Quick Link */}
          <button
            onClick={() => onNavigate('report')}
            className="self-start sm:self-auto bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded text-xs font-bold transition-colors"
          >
            + {t.nav.report}
          </button>
        </div>

        {/* Division Quick Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-gray-500 shrink-0 text-[11px] uppercase">
            {lang === 'bn' ? 'বিভাগ:' : 'Divisions:'}
          </span>
          {BANGLADESH_DIVISIONS.map(d => (
            <button
              key={d.name}
              onClick={() => handleSelectDivision(d.name)}
              className={`px-3 py-1 rounded font-semibold shrink-0 transition-colors ${
                activeDivision === d.name
                  ? 'bg-[#0F2942] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {lang === 'bn' ? d.nameBn : d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Control Bar: Filters */}
      <div className="bg-white p-3 rounded-md border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="border border-gray-300 rounded p-1.5 bg-white text-xs"
          >
            <option value="all">{t.common.allCategories}</option>
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>
                {lang === 'bn' ? c.bn : c.en}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border border-gray-300 rounded p-1.5 bg-white text-xs"
          >
            <option value="all">{t.common.allStatuses}</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved_pending_confirmation">Resolved (Pending Conf.)</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="text-gray-500 font-medium">
          {reports.length} {lang === 'bn' ? 'টি পিন প্রদর্শিত হচ্ছে' : 'markers active'}
        </div>
      </div>

      {/* Main Map & Side Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Canvas */}
        <div className="lg:col-span-8">
          <MapView
            reports={reports}
            selectedReportId={selectedReport?.id}
            onSelectReport={report => handleSelectReport(report)}
            center={mapCenter}
            zoom={mapZoom}
            height="560px"
            lang={lang}
          />
        </div>

        {/* Side Panel: Selected Issue or Recent Pin List */}
        <div className="lg:col-span-4 bg-white rounded-md border border-gray-200 shadow-xs p-4 flex flex-col justify-between max-h-[560px] overflow-y-auto space-y-4">
          {selectedReport ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-mono text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                  {selectedReport.publicId}
                </span>
                <StatusBadge status={selectedReport.status} lang={lang} />
              </div>

              {selectedReport.images && selectedReport.images.length > 0 && (
                <img
                  src={selectedReport.images[0]}
                  alt={selectedReport.title}
                  className="w-full h-36 object-cover rounded bg-gray-100 border border-gray-200"
                />
              )}

              <div>
                <h3 className="font-bold text-sm text-gray-900 leading-tight">
                  {selectedReport.title}
                </h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-3">
                  {selectedReport.description}
                </p>
              </div>

              <div className="text-xs space-y-1 bg-gray-50 p-2.5 rounded border border-gray-200">
                <div className="flex items-center space-x-1 text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="font-medium truncate">
                    {selectedReport.location.locality}, {selectedReport.location.division}
                  </span>
                </div>
                {selectedReport.location.landmark && (
                  <div className="text-[11px] text-gray-500 pl-4">
                    Landmark: {selectedReport.location.landmark}
                  </div>
                )}
                <div className="text-[11px] text-gray-500 pl-4 font-mono">
                  GPS: {selectedReport.location.latitude.toFixed(4)}, {selectedReport.location.longitude.toFixed(4)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <UrgencyBadge urgency={selectedReport.urgency} lang={lang} />
                <span className="text-emerald-700 font-semibold">
                  ✓ {selectedReport.confirmationsCount} confirmations
                </span>
              </div>

              <button
                onClick={() => onNavigate('detail', selectedReport.id)}
                className="w-full bg-[#0F2942] hover:bg-[#1E3A8A] text-white py-2 rounded text-xs font-bold transition-colors shadow-xs"
              >
                {lang === 'bn' ? 'সম্পূর্ণ বিবরণ ও টাইমলাইন দেখুন' : 'View Full Report & Timeline'}
              </button>

              <button
                onClick={() => setSelectedReport(null)}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1"
              >
                {lang === 'bn' ? 'তালিকায় ফিরে যান' : 'Back to nearby list'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">
                {lang === 'bn' ? 'ম্যাপের সমস্যা তালিকা' : 'Active Issues in Focus'}
              </h3>

              <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
                {reports.slice(0, 10).map(r => (
                  <div
                    key={r.id}
                    onClick={() => handleSelectReport(r)}
                    className="p-2.5 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-gray-500">{r.publicId}</span>
                      <StatusBadge status={r.status} lang={lang} />
                    </div>
                    <div className="font-bold text-xs text-gray-900 line-clamp-1">{r.title}</div>
                    <div className="text-[11px] text-gray-500 flex items-center justify-between">
                      <span className="truncate max-w-[150px]">📍 {r.location.locality}</span>
                      <span className="font-semibold text-emerald-700">✓ {r.confirmationsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

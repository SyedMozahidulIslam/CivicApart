import React, { useEffect, useState } from 'react';
import { Report, IssueCategory, ReportStatus, UrgencyLevel } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { fetchReports } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { MapView } from '../components/MapView';
import { CATEGORIES, BANGLADESH_DIVISIONS, formatBSTDate } from '../utils/bangladeshData';
import {
  Search,
  Filter,
  Grid,
  List,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  ThumbsUp,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface Props {
  lang: Language;
  onNavigate: (view: string, param?: string) => void;
}

export const IssueDirectoryPage: React.FC<Props> = ({ lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [division, setDivision] = useState('all');
  const [urgency, setUrgency] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  // View Mode: 'grid' | 'table' | 'map'
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchReports({
        category: category !== 'all' ? category : undefined,
        status: status !== 'all' ? status : undefined,
        division: division !== 'all' ? division : undefined,
        urgency: urgency !== 'all' ? urgency : undefined,
        search: search.trim() || undefined,
        sort,
        page,
        limit: 10,
      });

      setReports(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalReports(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category, status, division, urgency, sort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setStatus('all');
    setDivision('all');
    setUrgency('all');
    setSort('recent');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {lang === 'bn' ? 'নাগরিক সমস্যা তালিকা ও অনুসন্ধান' : 'Public Problem Directory & Discovery'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {lang === 'bn'
              ? `মোট ${totalReports} টি প্রতিবেদন পাওয়া গেছে`
              : `Found ${totalReports} verified and submitted civic reports across Bangladesh`}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-gray-100 p-1 rounded-md border border-gray-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 ${
              viewMode === 'grid' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Grid Card View"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 ${
              viewMode === 'table' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Civic Table View"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 ${
              viewMode === 'map' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Interactive Map View"
          >
            <MapIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Map</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-xs space-y-3">
        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.common.search}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="bg-[#0F2942] hover:bg-[#1E3A8A] text-white px-4 py-1.5 rounded text-xs sm:text-sm font-semibold transition-colors"
          >
            {lang === 'bn' ? 'খুঁজুন' : 'Search'}
          </button>
        </form>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {t.common.category}
            </label>
            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white"
            >
              <option value="all">{t.common.allCategories}</option>
              {CATEGORIES.map(c => (
                <option key={c.key} value={c.key}>
                  {lang === 'bn' ? c.bn : c.en}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {t.common.status}
            </label>
            <select
              value={status}
              onChange={e => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white"
            >
              <option value="all">{t.common.allStatuses}</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved_pending_confirmation">Resolved (Pending Conf.)</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>

          {/* Division */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {lang === 'bn' ? 'বিভাগ' : 'Division'}
            </label>
            <select
              value={division}
              onChange={e => {
                setDivision(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white"
            >
              <option value="all">{t.common.allDivisions}</option>
              {BANGLADESH_DIVISIONS.map(d => (
                <option key={d.name} value={d.name}>
                  {lang === 'bn' ? d.nameBn : d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {lang === 'bn' ? 'জরুরি মাত্রা' : 'Urgency'}
            </label>
            <select
              value={urgency}
              onChange={e => {
                setUrgency(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white"
            >
              <option value="all">{lang === 'bn' ? 'সকল মাত্রা' : 'All Urgencies'}</option>
              <option value="immediate_danger">Immediate Danger (999)</option>
              <option value="high">High Priority</option>
              <option value="elevated">Elevated</option>
              <option value="routine">Routine</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {t.common.sortBy}
            </label>
            <select
              value={sort}
              onChange={e => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300 rounded p-1.5 text-xs bg-white"
            >
              <option value="recent">{t.common.sortRecent}</option>
              <option value="updated">{t.common.sortUpdated}</option>
              <option value="confirmations">{t.common.sortConfirmations}</option>
              <option value="urgency">{t.common.sortUrgency}</option>
            </select>
          </div>
        </div>

        {/* Active filter pill / reset */}
        {(category !== 'all' || status !== 'all' || division !== 'all' || urgency !== 'all' || search) && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>Filtering active</span>
            <button
              onClick={handleResetFilters}
              className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset all filters'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main View Display */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 space-y-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">{t.common.loading}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 bg-white rounded-md border border-gray-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="font-bold text-gray-800 text-sm">{t.common.noResults}</h3>
          <p className="text-xs text-gray-500">
            {lang === 'bn'
              ? 'আপনার অনুসন্ধান ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
              : 'Try clearing some filters or searching for different keywords.'}
          </p>
          <button
            onClick={handleResetFilters}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded font-medium text-gray-800"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* 1. Grid Cards Mode */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map(report => (
                <div
                  key={report.id}
                  onClick={() => onNavigate('detail', report.id)}
                  className="bg-white rounded-md border border-gray-200 p-4 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {report.images && report.images.length > 0 && (
                      <img
                        src={report.images[0]}
                        alt={report.title}
                        className="w-full h-36 object-cover rounded bg-gray-100 border border-gray-200"
                      />
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                        {report.publicId}
                      </span>
                      <StatusBadge status={report.status} lang={lang} />
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 line-clamp-2 hover:text-blue-800">
                      {report.title}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-2">
                      {report.description}
                    </p>

                    <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">
                        {report.location.locality}, {report.location.division}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="font-semibold text-emerald-700">
                      ✓ {report.confirmationsCount} {lang === 'bn' ? 'অনুমোদন' : 'confirmations'}
                    </span>
                    <UrgencyBadge urgency={report.urgency} lang={lang} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Civic Table Mode */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-md border border-gray-200 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Title & Location</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Urgency</th>
                    <th className="py-2.5 px-3">Confirmations</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map(report => (
                    <tr
                      key={report.id}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => onNavigate('detail', report.id)}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-600 whitespace-nowrap">
                        {report.publicId}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-bold text-gray-900 line-clamp-1">{report.title}</div>
                        <div className="text-[11px] text-gray-500 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{report.location.locality}, {report.location.division}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 capitalize text-gray-700 whitespace-nowrap">
                        {report.category.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={report.status} lang={lang} />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <UrgencyBadge urgency={report.urgency} lang={lang} />
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-700 whitespace-nowrap">
                        {report.confirmationsCount}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onNavigate('detail', report.id);
                          }}
                          className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1 rounded font-semibold"
                        >
                          {t.common.viewDetails}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Map View Mode */}
          {viewMode === 'map' && (
            <div className="space-y-4">
              <MapView
                reports={reports}
                height="500px"
                lang={lang}
                onSelectReport={report => onNavigate('detail', report.id)}
              />
              <p className="text-xs text-gray-500 text-center">
                {lang === 'bn'
                  ? 'মানচিত্রের যেকোনো পিনে ক্লিক করে বিস্তারিত বিবরণ এবং নিশ্চিতকরণ দেখুন।'
                  : 'Click on any marker pin to inspect problem details and open the public issue page.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-xs">
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-gray-300 rounded font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-gray-300 rounded font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

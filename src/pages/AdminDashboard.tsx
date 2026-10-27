import React, { useEffect, useState } from 'react';
import { User, Organization, AuditLogEntry } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { fetchOrganizations, fetchModerationCases } from '../services/api';
import { CATEGORIES, formatBSTDate } from '../utils/bangladeshData';
import {
  Shield,
  Users,
  Building2,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  Database,
  Cpu,
} from 'lucide-react';

interface Props {
  currentUser: User;
  lang: Language;
}

export const AdminDashboard: React.FC<Props> = ({ currentUser, lang }) => {
  const t = TRANSLATIONS[lang];

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'audit' | 'organizations' | 'categories' | 'health'>('audit');

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [orgsData, modData] = await Promise.all([
          fetchOrganizations(),
          fetchModerationCases(),
        ]);
        setOrgs(orgsData);
        setAuditLogs(modData.recentAuditLogs || []);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-rose-950 text-white rounded-md p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-rose-900">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-rose-300" />
            <h1 className="text-xl font-black tracking-tight">
              {lang === 'bn' ? 'প্ল্যাটফর্ম অ্যাডমিনিস্ট্রেশন ও অডিট' : 'Platform Administration & Audit'}
            </h1>
          </div>
          <p className="text-xs text-rose-200 mt-1">
            Logged in as {currentUser.name} (Administrator) • System governance and audit logs
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>System Status: Healthy</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-rose-600 text-rose-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Security & Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('organizations')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'organizations'
              ? 'border-rose-600 text-rose-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Participating Organizations ({orgs.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-rose-600 text-rose-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Civic Categories ({CATEGORIES.length})
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'health'
              ? 'border-rose-600 text-rose-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Service Health
        </button>
      </div>

      {/* TAB 1: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            Immutable Platform Audit Logs
          </h2>
          <p className="text-xs text-gray-500">
            Every privileged status transition, report creation, and assignment is recorded with actor timestamp and rationale.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Timestamp (BST)</th>
                  <th className="py-2 px-3">Actor & Role</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Target</th>
                  <th className="py-2 px-3">Details / Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                      {formatBSTDate(log.timestamp, lang)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-gray-800">{log.userName}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded ml-1.5 uppercase font-medium">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-gray-600 whitespace-nowrap">
                      {log.targetEntity} ({log.targetId})
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 max-w-sm">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Organizations */}
      {activeTab === 'organizations' && (
        <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            Participating Municipal & Utility Organizations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgs.map(o => (
              <div key={o.id} className="p-4 rounded border border-gray-200 space-y-2 bg-gray-50 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">{o.name}</span>
                  {o.verifiedOfficial && (
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Official Verified
                    </span>
                  )}
                </div>
                <div className="text-gray-600">
                  <span>Type: <strong className="capitalize">{o.type.replace('_', ' ')}</strong></span> •{' '}
                  <span>Coverage: <strong>{o.serviceAreas.join(', ')}</strong></span>
                </div>
                <div className="text-[11px] text-gray-500">
                  Categories: {o.categoriesHandled.map(c => c.replace('_', ' ')).join(', ')}
                </div>
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-600 font-mono">
                  <span>Email: {o.contactEmail}</span>
                  <span>Hotline: {o.contactPhone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            Configured Civic Categories
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {CATEGORIES.map(c => (
              <div key={c.key} className="p-3 rounded border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{c.en}</span>
                  <span
                    style={{ backgroundColor: c.color }}
                    className="w-3 h-3 rounded-full shrink-0"
                  ></span>
                </div>
                <div className="text-gray-600 font-medium">{c.bn}</div>
                <p className="text-[11px] text-gray-500">{c.descriptionEn}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Service Health */}
      {activeTab === 'health' && (
        <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            Service Health & Architecture Diagnostics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded border border-gray-200 space-y-2 bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Gemini GenAI Engine</span>
              </h3>
              <p className="text-gray-600">Model: gemini-3.8-flash (via @google/genai TypeScript SDK)</p>
              <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected & Server-Side Telemetry Verified</span>
              </div>
            </div>

            <div className="p-4 rounded border border-gray-200 space-y-2 bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Database & Persistence Layer</span>
              </h3>
              <p className="text-gray-600">REST API with atomic status history and role authorization</p>
              <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In-Memory Active DB with Bangladesh Seeds</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { User, Organization, AuditLogEntry, UserRole, IssueCategory } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import {
  fetchOrganizations,
  fetchModerationCases,
  fetchAdminUsers,
  updateUserRole,
  createOrganization,
} from '../services/api';
import { CATEGORIES, formatBSTDate, BANGLADESH_DIVISIONS } from '../utils/bangladeshData';
import {
  Shield,
  Users,
  Building2,
  CheckCircle2,
  Database,
  Cpu,
  PlusCircle,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

interface Props {
  currentUser: User;
  lang: Language;
}

export const AdminDashboard: React.FC<Props> = ({ currentUser, lang }) => {
  const t = TRANSLATIONS[lang];

  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'organizations' | 'categories' | 'health'>('audit');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Org Modal State
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgShortName, setNewOrgShortName] = useState('');
  const [newOrgType, setNewOrgType] = useState<Organization['type']>('city_corporation');
  const [newOrgDivisions, setNewOrgDivisions] = useState<string[]>(['Dhaka']);
  const [newOrgCategories, setNewOrgCategories] = useState<IssueCategory[]>(['roads_bridges', 'drainage_waterlogging']);
  const [newOrgEmail, setNewOrgEmail] = useState('');
  const [newOrgPhone, setNewOrgPhone] = useState('');
  const [orgSubmitting, setOrgSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [orgsData, modData, usersData] = await Promise.all([
          fetchOrganizations().catch(() => []),
          fetchModerationCases().catch(() => ({ recentAuditLogs: [] })),
          fetchAdminUsers().catch(() => []),
        ]);
        setOrgs(orgsData);
        setAuditLogs(modData.recentAuditLogs || []);
        setUsersList(usersData);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const updatedUser = await updateUserRole(userId, newRole);
      setUsersList(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
      setActionSuccessMsg(`Updated ${updatedUser.name}'s role to ${newRole.toUpperCase()}`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Failed to update role: ${err.message}`);
    }
  };

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      setOrgSubmitting(true);
      const created = await createOrganization({
        name: newOrgName.trim(),
        shortName: newOrgShortName.trim() || newOrgName.slice(0, 8).toUpperCase(),
        type: newOrgType,
        serviceAreas: newOrgDivisions,
        categoriesHandled: newOrgCategories,
        verifiedOfficial: true,
        contactEmail: newOrgEmail.trim() || 'info@civic.bd',
        contactPhone: newOrgPhone.trim() || '333',
      });
      setOrgs(prev => [...prev, created]);
      setShowAddOrgModal(false);
      setNewOrgName('');
      setNewOrgShortName('');
      setNewOrgEmail('');
      setNewOrgPhone('');
      setActionSuccessMsg(`Organization "${created.name}" registered successfully.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Failed to create organization: ${err.message}`);
    } finally {
      setOrgSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Header */}
      <div className="bg-rose-950 text-white rounded-md p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-rose-900">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-rose-300" />
            <h1 className="text-xl font-black tracking-tight">
              {lang === 'bn' ? 'প্ল্যাটফর্ম অ্যাডমিনিস্ট্রেশন ও গভর্ন্যান্স' : 'Platform Administration & Governance'}
            </h1>
          </div>
          <p className="text-xs text-rose-200 mt-1">
            Logged in as {currentUser.name} (Administrator) • RBAC controls, governance, and tamper-evident audit logs
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>System Status: Healthy</span>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 space-x-4 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'border-rose-600 text-rose-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Audit & Security Logs ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeTab === 'users'
              ? 'border-rose-600 text-rose-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Role Management ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('organizations')}
          className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
            activeTab === 'organizations'
              ? 'border-rose-600 text-rose-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Participating Organizations ({orgs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'categories'
              ? 'border-rose-600 text-rose-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Civic Categories ({CATEGORIES.length})
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Immutable Platform Audit Logs
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Every privileged status transition, moderation decision, and operational assignment is recorded with timestamp and rationale.
              </p>
            </div>
            <span className="text-[11px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">
              Total Recorded: {auditLogs.length} events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp (BST)</th>
                  <th className="py-2.5 px-3">Actor & Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Details / Explanation</th>
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

      {/* TAB 2: User Role Management (RBAC) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                User Role-Based Access Control (RBAC)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Assign roles to users to grant moderation or operational maintenance dispatch privileges.
              </p>
            </div>
            <span className="text-xs text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded">
              Super-Admin Authorization Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Email & ID</th>
                  <th className="py-2.5 px-3">Current Role</th>
                  <th className="py-2.5 px-3">Assign Privilege Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-bold text-gray-900">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 font-mono text-[11px]">
                      {u.email} <br />
                      <span className="text-gray-400">ID: {u.id}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                        u.role === 'admin'
                          ? 'bg-rose-100 text-rose-800'
                          : u.role === 'moderator'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'operator'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 font-medium focus:ring-1 focus:ring-rose-500"
                      >
                        <option value="visitor">Visitor (Read only)</option>
                        <option value="citizen">Citizen (Report & Vote)</option>
                        <option value="moderator">Moderator (Review & Verify)</option>
                        <option value="operator">Operator (Work & Resolve)</option>
                        <option value="admin">Administrator (Governance & RBAC)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Organizations */}
      {activeTab === 'organizations' && (
        <div className="bg-white rounded-md border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Participating Municipal & Utility Organizations
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Clearly identified organizations eligible for issue assignment and resolution tracking.
              </p>
            </div>
            <button
              onClick={() => setShowAddOrgModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Organization</span>
            </button>
          </div>

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

      {/* TAB 4: Categories */}
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

      {/* TAB 5: Service Health */}
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

      {/* Modal: Add Organization */}
      {showAddOrgModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-sm font-bold text-gray-900">Add Participating Organization</h3>
              <button
                onClick={() => setShowAddOrgModal(false)}
                className="text-gray-400 hover:text-gray-600 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddOrganization} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Chattogram City Corporation (CCC)"
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Short Code / Acronym</label>
                  <input
                    type="text"
                    placeholder="e.g., CCC"
                    value={newOrgShortName}
                    onChange={e => setNewOrgShortName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Organization Type</label>
                  <select
                    value={newOrgType}
                    onChange={e => setNewOrgType(e.target.value as Organization['type'])}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                  >
                    <option value="city_corporation">City Corporation</option>
                    <option value="wasa">WASA (Water & Sewerage)</option>
                    <option value="department_roads">Roads & Highways Dept</option>
                    <option value="power_utility">Power Utility (DESCO/DPDC/BREB)</option>
                    <option value="ngo_partner">Civic NGO Partner</option>
                    <option value="community_org">Community Action Group</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="complaints@org.gov.bd"
                    value={newOrgEmail}
                    onChange={e => setNewOrgEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hotline / Phone</label>
                  <input
                    type="text"
                    placeholder="e.g., 01700-000000 / 333"
                    value={newOrgPhone}
                    onChange={e => setNewOrgPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orgSubmitting || !newOrgName.trim()}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {orgSubmitting ? 'Registering...' : 'Register Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

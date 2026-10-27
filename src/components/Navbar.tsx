import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import {
  FileText,
  Map as MapIcon,
  PlusCircle,
  BarChart2,
  Shield,
  Menu,
  X,
  User as UserIcon,
  Check,
  ChevronDown,
  AlertTriangle,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
  lang: Language;
  onToggleLang: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentView,
  onNavigate,
  currentUser,
  onSwitchRole,
  lang,
  onToggleLang,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const t = TRANSLATIONS[lang];

  const rolesList: { role: UserRole; label: string; desc: string }[] = [
    { role: 'visitor', label: 'Public Visitor', desc: 'Read-only public directory, map, transparency' },
    { role: 'citizen', label: 'Registered Citizen', desc: 'Report problems, confirm existing issues, save reports' },
    { role: 'moderator', label: 'Community Moderator', desc: 'Review queue, check duplicates, verify or reject' },
    { role: 'operator', label: 'Municipal Operator', desc: 'DNCC engineering workspace, progress notes, resolutions' },
    { role: 'admin', label: 'Platform Administrator', desc: 'User roles, organizations, configuration, audit logs' },
  ];

  const navLinks = [
    { id: 'home', label: t.nav.home, icon: null },
    { id: 'directory', label: t.nav.directory, icon: FileText },
    { id: 'map', label: t.nav.map, icon: MapIcon },
    { id: 'transparency', label: t.nav.transparency, icon: BarChart2 },
    { id: 'guidelines', label: t.nav.guidelines, icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0F2942] text-white shadow-md border-b border-[#1E3A8A]">
      <div className="bg-[#B91C1C] text-white text-[11px] md:text-xs py-1 px-4 flex items-center justify-between font-medium">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-1.5 truncate">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-yellow-300" />
            <span className="font-bold">{t.emergencyBanner.title}</span>
            <span className="truncate">{t.emergencyBanner.text}</span>
          </div>
          <div className="hidden sm:flex items-center space-x-3 shrink-0 pl-3">
            <span className="bg-red-800/80 px-2 py-0.5 rounded text-[11px]">Emergency: 999</span>
            <span className="bg-red-800/80 px-2 py-0.5 rounded text-[11px]">Helpdesk: 333</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="w-9 h-9 rounded bg-emerald-600 flex items-center justify-center font-bold text-lg text-white shadow-xs group-hover:bg-emerald-500 transition-colors">
              CA
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-white">
                  Civic<span className="text-emerald-400">Apart</span>
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                  Bangladesh
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden md:block leading-none">
                {t.tagline}
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(link => {
              const isActive = currentView === link.id;
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-[#1E3A8A] text-white font-semibold'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4 opacity-80" />}
                  <span>{link.label}</span>
                </button>
              );
            })}

            {currentUser.role === 'moderator' && (
              <button
                onClick={() => onNavigate('moderation')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentView === 'moderation'
                    ? 'bg-purple-900 text-purple-100 font-semibold border border-purple-500'
                    : 'text-purple-200 hover:bg-purple-950/60'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-purple-300" />
                <span>{t.nav.moderatorWorkspace}</span>
              </button>
            )}

            {currentUser.role === 'operator' && (
              <button
                onClick={() => onNavigate('operations')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentView === 'operations'
                    ? 'bg-amber-900 text-amber-100 font-semibold border border-amber-500'
                    : 'text-amber-200 hover:bg-amber-950/60'
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-300" />
                <span>{t.nav.operatorWorkspace}</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentView === 'admin'
                    ? 'bg-rose-900 text-rose-100 font-semibold border border-rose-500'
                    : 'text-rose-200 hover:bg-rose-950/60'
                }`}
              >
                <Shield className="w-4 h-4 text-rose-300" />
                <span>{t.nav.adminWorkspace}</span>
              </button>
            )}

            {currentUser.role === 'citizen' && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentView === 'dashboard'
                    ? 'bg-emerald-900 text-emerald-100 font-semibold border border-emerald-500'
                    : 'text-emerald-200 hover:bg-emerald-950/60'
                }`}
              >
                <UserIcon className="w-4 h-4 text-emerald-300" />
                <span>{t.nav.citizenDashboard}</span>
              </button>
            )}
          </nav>

          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={onToggleLang}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Switch language between English and বাংলা"
            >
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>

            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-1.5 text-xs bg-[#1E3A8A]/90 hover:bg-[#1E3A8A] text-slate-100 px-2.5 py-1.5 rounded border border-blue-700 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-medium capitalize">{currentUser.role}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {roleDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white text-gray-800 rounded-md shadow-xl border border-gray-200 py-1.5 z-50"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                    {lang === 'bn' ? 'সরাসরি রোল টেস্ট করুন' : 'Switch Demo User Role'}
                  </div>
                  {rolesList.map(item => (
                    <button
                      key={item.role}
                      onClick={() => {
                        onSwitchRole(item.role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-start space-x-2 text-xs hover:bg-blue-50 transition-colors ${
                        currentUser.role === item.role ? 'bg-blue-50/80 font-semibold text-blue-900' : ''
                      }`}
                    >
                      <div className="pt-0.5">
                        {currentUser.role === item.role ? (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <div className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold">{item.label}</div>
                        <div className="text-[11px] text-gray-500 font-normal">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('report')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded text-sm font-semibold flex items-center space-x-1.5 shadow-xs transition-all active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.nav.report}</span>
            </button>
          </div>

          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={onToggleLang}
              className="px-2 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-200 border border-slate-700"
            >
              {lang === 'en' ? 'বাং' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded text-slate-200 hover:text-white hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A1D30] border-t border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
                currentView === link.id ? 'bg-[#1E3A8A] text-white' : 'text-slate-300'
              }`}
            >
              {link.label}
            </button>
          ))}

          {currentUser.role === 'moderator' && (
            <button
              onClick={() => {
                onNavigate('moderation');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded text-sm text-purple-300 bg-purple-950/50"
            >
              {t.nav.moderatorWorkspace}
            </button>
          )}

          {currentUser.role === 'operator' && (
            <button
              onClick={() => {
                onNavigate('operations');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded text-sm text-amber-300 bg-amber-950/50"
            >
              {t.nav.operatorWorkspace}
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded text-sm text-rose-300 bg-rose-950/50"
            >
              {t.nav.adminWorkspace}
            </button>
          )}

          {currentUser.role === 'citizen' && (
            <button
              onClick={() => {
                onNavigate('dashboard');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded text-sm text-emerald-300 bg-emerald-950/50"
            >
              {t.nav.citizenDashboard}
            </button>
          )}

          <div className="pt-2 border-t border-slate-800 flex flex-col space-y-2">
            <button
              onClick={() => {
                onNavigate('report');
                setMobileMenuOpen(false);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-sm font-semibold flex items-center justify-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.nav.report}</span>
            </button>

            <div className="pt-2">
              <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                {lang === 'bn' ? 'রোল নির্বাচন করুন:' : 'Switch Role:'}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {rolesList.map(r => (
                  <button
                    key={r.role}
                    onClick={() => {
                      onSwitchRole(r.role);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-xs px-2 py-1.5 rounded border text-left ${
                      currentUser.role === r.role
                        ? 'bg-blue-600 border-blue-400 text-white font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { Phone, Shield } from 'lucide-react';

interface Props {
  lang: Language;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<Props> = ({ lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];

  return (
    <footer className="bg-[#0B1E32] text-slate-300 border-t border-slate-800 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center font-bold text-sm text-white">
                CA
              </div>
              <span className="font-bold text-lg text-white">
                Civic<span className="text-emerald-400">Apart</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.subtagline}
            </p>
            <p className="text-xs text-slate-400">
              {t.tagline}
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              Bangladesh Standard Time (BST) UTC+6
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              {lang === 'bn' ? 'প্রধান লিঙ্ক' : 'Platform Navigation'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('directory')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t.nav.directory}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('map')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t.nav.map}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('report')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t.nav.report}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('transparency')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t.nav.transparency}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              {lang === 'bn' ? 'নীতিমালা ও তথ্য' : 'Guidelines & Trust'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('guidelines')}
                  className="hover:text-emerald-400 transition-colors flex items-center space-x-1"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.nav.guidelines}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('guidelines')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {lang === 'bn' ? 'নাগরিক যাচাইয়ের নিয়মাবলী' : 'Community Verification Rules'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('guidelines')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {lang === 'bn' ? 'ব্যক্তিগত তথ্যের গোপনীয়তা' : 'Privacy & Reporter Protection'}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Phone className="w-3.5 h-3.5 text-red-400" />
              <span>{lang === 'bn' ? 'জরুরি হেল্পলাইনসমূহ' : 'Bangladesh Hotlines'}</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                <span className="text-white font-bold block">999 — National Emergency</span>
                <span className="text-[11px] text-slate-400">Police, Fire Service, Ambulance</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                <span className="text-white font-bold block">333 — Government Info & Grievances</span>
                <span className="text-[11px] text-slate-400">Municipal Services & Upazila Desk</span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                <span className="block">DNCC Control Room: 16106</span>
                <span className="block">Dhaka WASA Helpline: 16162</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p className="text-center sm:text-left mb-2 sm:mb-0">
            {t.common.disclaimer}
          </p>
          <div className="flex items-center space-x-4">
            <span>© 2026 CivicApart</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Built for Bangladesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

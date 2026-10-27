import React from 'react';
import { Language, TRANSLATIONS } from '../utils/i18n';
import {
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  CheckCircle2,
  Phone,
  FileCheck,
  Scale,
} from 'lucide-react';

interface Props {
  lang: Language;
}

export const GuidelinesAndPrivacyPage: React.FC<Props> = ({ lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-xs sm:text-sm text-gray-700 leading-relaxed">
      {/* Title */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center space-x-2">
          <Shield className="w-6 h-6 text-emerald-600" />
          <span>{lang === 'bn' ? 'রিপোর্টিং নীতিমালা ও নিরাপত্তা নির্দেশিকা' : 'Reporting Guidelines & Safety Policy'}</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {t.appName} — {t.subtagline}
        </p>
      </div>

      {/* Emergency Notice Box */}
      <div className="bg-red-50 border-l-4 border-red-600 p-5 rounded-r-md space-y-2">
        <h2 className="text-sm font-bold text-red-900 flex items-center space-x-1.5">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>{t.emergencyBanner.title}</span>
        </h2>
        <p className="text-xs text-red-800 leading-relaxed">
          CivicApart is a public tracking and resolution tool, <strong>NOT an emergency response dispatch service</strong>. If you witness an active electrical short circuit, sparking cables, an open deep manhole with imminent fall danger, a gas line rupture, or a structural collapse, please <strong>immediately call 999 (National Emergency Service)</strong> or <strong>333 (National Helpdesk)</strong>.
        </p>
      </div>

      {/* Section 1: What to Report */}
      <div className="bg-white p-6 rounded-md border border-gray-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span>What You Can Report on CivicApart</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <h3 className="font-bold text-emerald-800 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recommended Civic Submissions:</span>
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Potholes, broken road asphalt, damaged culverts, bridges</li>
              <li>Waterlogging after rainfall and blocked storm drains</li>
              <li>Uncollected municipal garbage heaps and overflowing dumpsters</li>
              <li>Damaged or dark streetlight fixtures and exposed junction covers</li>
              <li>Broken sidewalk paving slabs and footpath obstructions</li>
              <li>WASA potable water supply leaks and pipeline ruptures</li>
              <li>Damaged playground equipment in public municipal parks</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-red-800 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>Prohibited Submissions:</span>
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Private domestic boundary disputes or neighbor arguments</li>
              <li>Defamation, harassment, hate speech, or political accusations</li>
              <li>Commercial advertisements or product endorsements</li>
              <li>Personal phone numbers, National ID numbers, or passport photos</li>
              <li>Fabricated or AI-generated fake damage photographs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2: Privacy and Reporter Protection */}
      <div className="bg-white p-6 rounded-md border border-gray-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Privacy & Personal Data Protection</span>
        </h2>

        <p className="text-xs text-gray-600 leading-relaxed">
          CivicApart is built on the principle of transparency for civic infrastructure while protecting individual citizen privacy.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-1">
            <span className="font-bold text-gray-900 flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Publicly Visible:</span>
            </span>
            <ul className="list-disc pl-5 space-y-0.5 text-gray-600 text-[11px]">
              <li>Problem title, description, and category</li>
              <li>Locality, division, and coordinates on the public map</li>
              <li>Evidence photographs uploaded by the reporter</li>
              <li>Status history timeline and public progress notes</li>
              <li>First name or pseudonym of reporter</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-1">
            <span className="font-bold text-gray-900 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-red-600" />
              <span>Kept Strictly Private:</span>
            </span>
            <ul className="list-disc pl-5 space-y-0.5 text-gray-600 text-[11px]">
              <li>Full citizen phone numbers (masked: +880 1711-***567)</li>
              <li>Email address of reporting citizen</li>
              <li>Exact home address if reported inside residential compounds</li>
              <li>Internal contractor operational notes between city staff</li>
              <li>Moderator case review deliberations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3: Community Verification Rules */}
      <div className="bg-white p-6 rounded-md border border-gray-200 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center space-x-2">
          <Scale className="w-4 h-4 text-purple-600" />
          <span>Community Verification Rules & Ethics</span>
        </h2>

        <p className="text-xs text-gray-600 leading-relaxed">
          Community confirmations are evidence, not absolute proof. To prevent manipulation:
        </p>

        <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
          <li><strong>One vote per citizen per report:</strong> Duplicate votes from the same account are blocked on the server.</li>
          <li><strong>Resolution is not unilateral:</strong> When an operator marks an issue resolved, it enters <em>Resolved (Pending Confirmation)</em> status. Local residents confirm or dispute ground reality.</li>
          <li><strong>Automatic Reopening:</strong> If 3 or more citizens indicate that a problem persists after being marked resolved, the ticket is reopened automatically.</li>
        </ul>
      </div>
    </div>
  );
};

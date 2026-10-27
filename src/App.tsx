/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Language } from './utils/i18n';
import { fetchCurrentUser, switchUserRole } from './services/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { IssueDirectoryPage } from './pages/IssueDirectoryPage';
import { InteractiveMapPage } from './pages/InteractiveMapPage';
import { ReportProblemPage } from './pages/ReportProblemPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ModeratorWorkspace } from './pages/ModeratorWorkspace';
import { OperatorWorkspace } from './pages/OperatorWorkspace';
import { AdminDashboard } from './pages/AdminDashboard';
import { TransparencyPage } from './pages/TransparencyPage';
import { GuidelinesAndPrivacyPage } from './pages/GuidelinesAndPrivacyPage';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('en');

  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-citizen-1',
    name: 'Tanvir Hossain',
    email: 'tanvir@example.com',
    role: 'citizen',
    phone: '+880 1711-234567',
    reputationScore: 12,
    createdAt: '2026-02-10T10:00:00Z',
  });

  // Load initial session user & read initial URL hash
  useEffect(() => {
    async function initUser() {
      try {
        const u = await fetchCurrentUser();
        if (u) setCurrentUser(u);
      } catch (err) {
        console.warn('Could not fetch session user, using default:', err);
      }
    }
    initUser();

    // Parse URL hash routing
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash.startsWith('detail/')) {
        const id = hash.replace('detail/', '');
        setSelectedReportId(id);
        setCurrentView('detail');
      } else if (hash) {
        setCurrentView(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'detail' && param) {
      setSelectedReportId(param);
      setCurrentView('detail');
      window.location.hash = `#/detail/${param}`;
    } else {
      setSelectedReportId(null);
      setCurrentView(view);
      window.location.hash = `#/${view}`;
    }
  };

  const handleSwitchRole = async (newRole: UserRole) => {
    try {
      const updatedUser = await switchUserRole(newRole);
      setCurrentUser(updatedUser);
      // Auto-navigate to appropriate workspace if switching to moderator/operator/admin
      if (newRole === 'moderator') handleNavigate('moderation');
      else if (newRole === 'operator') handleNavigate('operations');
      else if (newRole === 'admin') handleNavigate('admin');
      else if (newRole === 'citizen') handleNavigate('dashboard');
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const toggleLanguage = () => {
    setLang(l => (l === 'en' ? 'bn' : 'en'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Top Shared Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        lang={lang}
        onToggleLang={toggleLanguage}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            lang={lang}
            onNavigate={handleNavigate}
            currentUser={currentUser}
          />
        )}

        {currentView === 'directory' && (
          <IssueDirectoryPage
            lang={lang}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'map' && (
          <InteractiveMapPage
            lang={lang}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'report' && (
          <ReportProblemPage
            lang={lang}
            onNavigate={handleNavigate}
            currentUser={currentUser}
          />
        )}

        {currentView === 'detail' && selectedReportId && (
          <IssueDetailPage
            reportId={selectedReportId}
            lang={lang}
            onNavigate={handleNavigate}
            currentUser={currentUser}
          />
        )}

        {currentView === 'dashboard' && (
          <CitizenDashboard
            currentUser={currentUser}
            lang={lang}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'moderation' && (
          <ModeratorWorkspace
            currentUser={currentUser}
            lang={lang}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'operations' && (
          <OperatorWorkspace
            currentUser={currentUser}
            lang={lang}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            lang={lang}
          />
        )}

        {currentView === 'transparency' && (
          <TransparencyPage
            lang={lang}
          />
        )}

        {currentView === 'guidelines' && (
          <GuidelinesAndPrivacyPage
            lang={lang}
          />
        )}
      </main>

      {/* Shared Civic Footer */}
      <Footer lang={lang} onNavigate={handleNavigate} />
    </div>
  );
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionStatus,
  calculateDuplicateScore,
  evaluateUrgencyRules,
  ALLOWED_TRANSITIONS,
} from './statusWorkflow';
import { Report } from '../types';

test('Status transitions: Public visitor cannot change any status', () => {
  const result = canTransitionStatus('submitted', 'under_review', 'visitor');
  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /Visitors have read-only/);
});

test('Status transitions: Citizen cannot transition report status', () => {
  const result = canTransitionStatus('submitted', 'under_review', 'citizen');
  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /Citizens cannot directly modify/);
});

test('Status transitions: Disallowed workflow transitions fail', () => {
  // e.g. submitted directly to closed without review or resolution
  const result = canTransitionStatus('submitted', 'closed', 'admin');
  assert.equal(result.allowed, false);
  assert.match(result.reason || '', /not permitted by platform lifecycle/);
});

test('Status transitions: Moderator can verify and reject reports under review', () => {
  const verifyRes = canTransitionStatus('under_review', 'verified', 'moderator');
  assert.equal(verifyRes.allowed, true);

  const rejectRes = canTransitionStatus('under_review', 'rejected', 'moderator');
  assert.equal(rejectRes.allowed, true);
});

test('Status transitions: Operator can take assigned report and advance to in_progress', () => {
  const inProgressRes = canTransitionStatus('assigned', 'in_progress', 'operator');
  assert.equal(inProgressRes.allowed, true);

  const resolvedRes = canTransitionStatus('in_progress', 'resolved_pending_confirmation', 'operator');
  assert.equal(resolvedRes.allowed, true);
});

test('Urgency rules: Detects immediate danger for live wire or open manhole', () => {
  const alert1 = evaluateUrgencyRules('Live electric wire dangling near bus stand', 'Sparking wires on sidewalk in Mirpur-10');
  assert.equal(alert1.level, 'immediate_danger');
  assert.equal(alert1.isEmergencyAlert, true);
  assert.match(alert1.rationale, /Critical safety hazard/);

  const alertBangla = evaluateUrgencyRules('রাস্তায় খোলা ম্যানহোল', 'ধানমন্ডি ২৭ এ পথচারীদের বিপদ');
  assert.equal(alertBangla.level, 'immediate_danger');
});

test('Urgency rules: Detects high priority for sewage overflow or school block', () => {
  const alert = evaluateUrgencyRules('Sewage overflow in front of school gate', 'Children unable to enter due to filthy water');
  assert.equal(alert.level, 'high');
  assert.equal(alert.isEmergencyAlert, false);
});

test('Duplicate score: Identifies high proximity and matching category', () => {
  const mockExisting: Report = {
    id: 'rep-1',
    publicId: 'CA-BD-001',
    title: 'Massive pothole on Mirpur Road',
    description: 'Deep road crater causing traffic jam near Dhanmondi 27',
    category: 'roads_bridges',
    status: 'in_progress',
    urgency: 'elevated',
    location: {
      division: 'Dhaka',
      district: 'Dhaka',
      locality: 'Dhanmondi 27',
      latitude: 23.754,
      longitude: 90.375,
    },
    images: [],
    userId: 'u1',
    userName: 'Tanvir',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    confirmationsCount: 5,
    resolvedVotesCount: 0,
    flagsCount: 0,
    isCommunityVerified: true,
  };

  const newReport = {
    title: 'Deep pothole road damage',
    description: 'Road damage and crater near Dhanmondi 27 Mirpur road',
    category: 'roads_bridges' as const,
    lat: 23.7542, // ~25 meters away
    lng: 90.3751,
  };

  const result = calculateDuplicateScore(newReport, mockExisting);
  assert.ok(result.score >= 0.7, `Expected score >= 0.7, got ${result.score}`);
  assert.ok(result.reasons.some(r => r.includes('Same civic problem category')));
  assert.ok(result.reasons.some(r => r.includes('Within 100m')));
});

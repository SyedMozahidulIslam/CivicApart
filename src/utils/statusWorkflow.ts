import { ReportStatus, UserRole, UrgencyLevel, IssueCategory, Report } from '../types';

/**
 * Valid transitions map for the civic report lifecycle
 */
export const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  submitted: ['under_review', 'rejected'],
  under_review: ['verified', 'rejected', 'submitted'],
  verified: ['assigned', 'in_progress', 'rejected'],
  assigned: ['in_progress', 'verified'],
  in_progress: ['resolved_pending_confirmation', 'assigned'],
  resolved_pending_confirmation: ['closed', 'reopened'],
  closed: ['reopened'],
  rejected: ['under_review', 'reopened'],
  reopened: ['under_review', 'in_progress'],
};

/**
 * Checks if a status transition is permitted given the current status, target status, and actor's role.
 * Enforces strict backend authorization rules:
 * - Public visitors cannot transition any status
 * - Citizens cannot transition status (they can only submit or report community feedback)
 * - Moderators can: review, verify, reject, link duplicates
 * - Operators can: accept assignment, mark in_progress, submit resolution evidence for confirmation
 * - Admins can perform any transition with a documented reason
 */
export function canTransitionStatus(
  currentStatus: ReportStatus,
  targetStatus: ReportStatus,
  actorRole: UserRole,
  isAssignedOperator: boolean = false
): { allowed: boolean; reason?: string } {
  if (actorRole === 'visitor') {
    return { allowed: false, reason: 'Visitors have read-only access.' };
  }

  if (actorRole === 'citizen') {
    return {
      allowed: false,
      reason: 'Citizens cannot directly modify report workflow statuses. Please submit community verification feedback instead.',
    };
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Status transition from "${currentStatus}" to "${targetStatus}" is not permitted by platform lifecycle.`,
    };
  }

  if (actorRole === 'moderator') {
    // Moderators can review, verify, reject, reopen
    const moderatorAllowed: ReportStatus[] = ['under_review', 'verified', 'rejected', 'reopened'];
    if (!moderatorAllowed.includes(targetStatus)) {
      return {
        allowed: false,
        reason: 'Moderators cannot perform operational assignments or close tickets without operator action.',
      };
    }
    return { allowed: true };
  }

  if (actorRole === 'operator') {
    // Operators work on assigned tickets, advance to in_progress, and submit for resolution
    if (['assigned', 'in_progress', 'resolved_pending_confirmation'].includes(targetStatus)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Operators can only advance tickets in their active work pipeline.',
    };
  }

  if (actorRole === 'admin') {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Unauthorized role.' };
}

/**
 * Pure heuristic function to detect duplicate candidates based on:
 * - Title and description token overlap (Jaccard similarity)
 * - Category matching
 * - Geographic proximity (Haversine distance in meters)
 */
export function calculateDuplicateScore(
  newReport: { title: string; description: string; category: IssueCategory; lat: number; lng: number },
  existingReport: Report
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // 1. Category exact match
  if (newReport.category === existingReport.category) {
    score += 0.25;
    reasons.push('Same civic problem category');
  }

  // 2. Geographic distance
  const distanceKm = haversineDistance(
    newReport.lat,
    newReport.lng,
    existingReport.location.latitude,
    existingReport.location.longitude
  );

  if (distanceKm <= 0.1) {
    // within 100 meters
    score += 0.45;
    reasons.push(`Within 100m of existing report (${(distanceKm * 1000).toFixed(0)}m away)`);
  } else if (distanceKm <= 0.5) {
    // within 500 meters
    score += 0.3;
    reasons.push(`Within 500m of existing report (${(distanceKm * 1000).toFixed(0)}m away)`);
  } else if (distanceKm <= 2.0) {
    score += 0.1;
    reasons.push(`Nearby location (${distanceKm.toFixed(1)}km away)`);
  }

  // 3. Text token similarity
  const text1 = `${newReport.title} ${newReport.description}`.toLowerCase();
  const text2 = `${existingReport.title} ${existingReport.description}`.toLowerCase();
  
  const tokens1 = new Set(text1.split(/\s+/).filter(w => w.length > 3));
  const tokens2 = new Set(text2.split(/\s+/).filter(w => w.length > 3));
  
  let intersection = 0;
  tokens1.forEach(t => {
    if (tokens2.has(t)) intersection++;
  });
  
  const union = new Set([...tokens1, ...tokens2]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  if (jaccard > 0.3) {
    score += 0.3;
    reasons.push('High descriptive keyword similarity');
  } else if (jaccard > 0.15) {
    score += 0.15;
    reasons.push('Moderate keyword overlap');
  }

  return {
    score: Math.min(1, Math.round(score * 100) / 100),
    reasons,
  };
}

/**
 * Haversine formula to compute great-circle distance between two points in km
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Evaluates urgency based on keywords indicating live danger, open manholes, exposed wires, gas leaks
 */
export function evaluateUrgencyRules(title: string, description: string): {
  level: UrgencyLevel;
  rationale: string;
  isEmergencyAlert: boolean;
} {
  const text = `${title} ${description}`.normalize('NFC').toLowerCase();

  const immediateDangerKeywords = [
    'electric shock',
    'live wire',
    'electric wire',
    'live electric wire',
    'exposed cable',
    'exposed wire',
    'open manhole',
    'manhole',
    'bridge collapse',
    'gas leak',
    'explosion hazard',
    'fire hazard',
    'deep sinkhole',
    'ম্যানহোল',
    'বিদ্যুৎস্পৃষ্ট',
    'গ্যাস লিকেজ',
    'তার ছিঁড়ে',
    'খোলা ম্যানহোল',
  ].map(k => k.normalize('NFC').toLowerCase());

  const highPriorityKeywords = [
    'flooded house',
    'waterlogging hospital',
    'blocked school entrance',
    'sewage overflow',
    'culvert collapsed',
    'water contaminated',
    'blackout streetlight',
    'unsafe crossing',
    'ড্রেন উপচে',
    'পয়ঃনিষ্কাশন',
    'বিপজ্জনক পারাপার',
    'পানির অভাব',
    'ময়লার স্তূপ',
  ].map(k => k.normalize('NFC').toLowerCase());

  for (const kw of immediateDangerKeywords) {
    if (text.includes(kw)) {
      return {
        level: 'immediate_danger',
        rationale: `Critical safety hazard detected ("${kw}"). Call 999 or municipal emergency desk immediately.`,
        isEmergencyAlert: true,
      };
    }
  }

  for (const kw of highPriorityKeywords) {
    if (text.includes(kw)) {
      return {
        level: 'high',
        rationale: `High impact on public mobility and hygiene detected ("${kw}"). Expedited review recommended.`,
        isEmergencyAlert: false,
      };
    }
  }

  if (text.includes('broken') || text.includes('garbage pile') || text.includes('pothole') || text.includes('ময়লা')) {
    return {
      level: 'elevated',
      rationale: 'Active community inconvenience reported with visible public disruption.',
      isEmergencyAlert: false,
    };
  }

  return {
    level: 'routine',
    rationale: 'Standard municipal maintenance or localized municipal issue.',
    isEmergencyAlert: false,
  };
}

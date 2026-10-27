export type UserRole = 'visitor' | 'citizen' | 'moderator' | 'operator' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  organizationId?: string;
  organizationName?: string;
  reputationScore?: number;
  createdAt: string;
}

export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved_pending_confirmation'
  | 'closed'
  | 'rejected'
  | 'reopened';

export type UrgencyLevel = 'routine' | 'elevated' | 'high' | 'immediate_danger';

export type IssueCategory =
  | 'roads_bridges'
  | 'drainage_waterlogging'
  | 'waste_sanitation'
  | 'streetlighting'
  | 'pedestrian_footpath'
  | 'water_supply'
  | 'public_parks'
  | 'illegal_encroachment'
  | 'other';

export interface ReportLocation {
  division: string;
  district: string;
  cityCorporationOrUpazila?: string;
  wardOrUnion?: string;
  locality: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isApproximate?: boolean;
}

export interface StatusHistoryEntry {
  id: string;
  reportId: string;
  previousStatus: ReportStatus | null;
  newStatus: ReportStatus;
  changedByUserId: string;
  changedByUserName: string;
  changedByUserRole: UserRole;
  timestamp: string;
  comment: string;
  resolutionPhotoUrl?: string;
  isPublic: boolean;
}

export interface CommunityFeedback {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  type: 'still_exists' | 'seems_resolved' | 'suspicious';
  comment?: string;
  timestamp: string;
}

export interface ProgressNote {
  id: string;
  reportId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  organizationName?: string;
  note: string;
  isPublic: boolean;
  createdAt: string;
  photoUrl?: string;
}

export interface Report {
  id: string;
  publicId: string;
  title: string;
  description: string;
  category: IssueCategory;
  subcategory?: string;
  status: ReportStatus;
  urgency: UrgencyLevel;
  urgencyReason?: string;
  location: ReportLocation;
  images: string[];
  userId: string;
  userName: string;
  userPhoneMasked?: string;
  createdAt: string;
  updatedAt: string;
  confirmationsCount: number;
  resolvedVotesCount: number;
  flagsCount: number;
  isCommunityVerified: boolean;
  assignedOrganizationId?: string;
  assignedOrganizationName?: string;
  assignedAssigneeName?: string;
  targetResolutionDate?: string;
  aiAssistance?: {
    categorizedByAI: boolean;
    suggestedCategory?: IssueCategory;
    suggestedUrgency?: UrgencyLevel;
    urgencyRationale?: string;
    duplicateScore?: number;
    descriptionImproved?: boolean;
    moderationFlag?: boolean;
    moderationReason?: string;
  };
  duplicateOfReportId?: string;
  relatedReportIds?: string[];
  rejectionReason?: string;
  moderationNotes?: string;
  isHidden?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  shortName: string;
  type: 'city_corporation' | 'wasa' | 'department_roads' | 'power_utility' | 'ngo_partner' | 'community_org';
  serviceAreas: string[];
  categoriesHandled: IssueCategory[];
  verifiedOfficial: boolean;
  contactEmail: string;
  contactPhone: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetEntity: string;
  targetId: string;
  details: string;
}

export interface PlatformStats {
  totalReports: number;
  resolvedReports: number;
  inProgressReports: number;
  pendingReviewReports: number;
  verifiedReports: number;
  averageResolutionDays: number;
  categoryBreakdown: Record<IssueCategory, number>;
  statusBreakdown: Record<ReportStatus, number>;
  divisionBreakdown: Record<string, number>;
  communityConfirmationsTotal: number;
}

export interface CivicNotification {
  id: string;
  userId: string;
  reportId: string;
  reportTitle: string;
  title: string;
  message: string;
  type: 'status_change' | 'progress_note' | 'info_requested' | 'community_vote';
  isRead: boolean;
  createdAt: string;
}


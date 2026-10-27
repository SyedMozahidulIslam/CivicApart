import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  Report,
  User,
  UserRole,
  ReportStatus,
  UrgencyLevel,
  IssueCategory,
  StatusHistoryEntry,
  CommunityFeedback,
  ProgressNote,
  Organization,
  AuditLogEntry,
} from './src/types';
import {
  canTransitionStatus,
  calculateDuplicateScore,
  evaluateUrgencyRules,
} from './src/utils/statusWorkflow';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-Memory Database Store (with Seed Data for Bangladesh)
const users: Record<string, User> = {
  'usr-citizen-1': {
    id: 'usr-citizen-1',
    name: 'Tanvir Hossain',
    email: 'tanvir@example.com',
    role: 'citizen',
    phone: '+880 1711-234567',
    reputationScore: 12,
    createdAt: '2026-02-10T10:00:00Z',
  },
  'usr-moderator-1': {
    id: 'usr-moderator-1',
    name: 'Nusrat Jahan',
    email: 'nusrat.mod@civicapart.bd',
    role: 'moderator',
    phone: '+880 1819-987654',
    reputationScore: 98,
    createdAt: '2026-01-15T09:00:00Z',
  },
  'usr-operator-1': {
    id: 'usr-operator-1',
    name: 'Engr. Rafiqul Islam (DNCC)',
    email: 'rafiqul@dncc.gov.bd',
    role: 'operator',
    organizationId: 'org-dncc-roads',
    organizationName: 'Dhaka North City Corp - Civil Engineering',
    phone: '+880 1912-345678',
    reputationScore: 85,
    createdAt: '2026-01-20T08:30:00Z',
  },
  'usr-admin-1': {
    id: 'usr-admin-1',
    name: 'Admin Coordinator (CivicApart)',
    email: 'admin@civicapart.bd',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00Z',
  },
  'usr-visitor-1': {
    id: 'usr-visitor-1',
    name: 'Anonymous Public Visitor',
    email: 'visitor@example.com',
    role: 'visitor',
    createdAt: new Date().toISOString(),
  },
};

let currentSessionUserId = 'usr-citizen-1';

const organizations: Organization[] = [
  {
    id: 'org-dncc-roads',
    name: 'Dhaka North City Corporation — Engineering & Roads',
    shortName: 'DNCC Roads',
    type: 'city_corporation',
    serviceAreas: ['Dhaka'],
    categoriesHandled: ['roads_bridges', 'pedestrian_footpath'],
    verifiedOfficial: true,
    contactEmail: 'engineering@dncc.gov.bd',
    contactPhone: '16106',
  },
  {
    id: 'org-dwasa',
    name: 'Dhaka Water Supply and Sewerage Authority (DWASA)',
    shortName: 'Dhaka WASA',
    type: 'wasa',
    serviceAreas: ['Dhaka', 'Narayanganj'],
    categoriesHandled: ['drainage_waterlogging', 'water_supply'],
    verifiedOfficial: true,
    contactEmail: 'hotline@dwasa.org.bd',
    contactPhone: '16162',
  },
  {
    id: 'org-dscc-waste',
    name: 'Dhaka South City Corporation — Waste Management Dept',
    shortName: 'DSCC Waste',
    type: 'city_corporation',
    serviceAreas: ['Dhaka'],
    categoriesHandled: ['waste_sanitation'],
    verifiedOfficial: true,
    contactEmail: 'waste@dscc.gov.bd',
    contactPhone: '02-9556014',
  },
  {
    id: 'org-desco-lighting',
    name: 'Dhaka Electric Supply Company Limited (DESCO)',
    shortName: 'DESCO',
    type: 'power_utility',
    serviceAreas: ['Dhaka', 'Gazipur'],
    categoriesHandled: ['streetlighting'],
    verifiedOfficial: true,
    contactEmail: 'callcenter@desco.org.bd',
    contactPhone: '16120',
  },
  {
    id: 'org-ccc-engineering',
    name: 'Chattogram City Corporation — Engineering Division',
    shortName: 'CCC Engineering',
    type: 'city_corporation',
    serviceAreas: ['Chattogram'],
    categoriesHandled: ['roads_bridges', 'drainage_waterlogging'],
    verifiedOfficial: true,
    contactEmail: 'info@ccc.gov.bd',
    contactPhone: '031-630241',
  },
];

let reports: Report[] = [
  {
    id: 'rep-001',
    publicId: 'CA-BD-2026-001',
    title: 'Severe crater potholes causing traffic standstill near Mirpur 10 roundabout',
    description: 'Multiple deep potholes right across the road heading towards Kazipara. Motorcyclists and rickshaws are tipping over, causing severe bottlenecks during rush hour.',
    category: 'roads_bridges',
    subcategory: 'Broken Asphalt & Cratering',
    status: 'in_progress',
    urgency: 'high',
    urgencyReason: 'High impact on main arterial commuter route and recurrent vehicle axle damage.',
    location: {
      division: 'Dhaka',
      district: 'Dhaka',
      cityCorporationOrUpazila: 'Dhaka North City Corporation (DNCC)',
      wardOrUnion: 'Ward 14',
      locality: 'Mirpur 10 to Kazipara Road',
      landmark: 'Near Mirpur 10 Fire Station',
      latitude: 23.8069,
      longitude: 90.3687,
    },
    images: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
    ],
    userId: 'usr-citizen-1',
    userName: 'Tanvir Hossain',
    userPhoneMasked: '+880 1711-***567',
    createdAt: '2026-10-20T08:30:00Z',
    updatedAt: '2026-10-24T14:15:00Z',
    confirmationsCount: 28,
    resolvedVotesCount: 2,
    flagsCount: 0,
    isCommunityVerified: true,
    assignedOrganizationId: 'org-dncc-roads',
    assignedOrganizationName: 'DNCC Roads',
    assignedAssigneeName: 'Sub-Assistant Engineer (Zone 4)',
    targetResolutionDate: '2026-11-02',
    aiAssistance: {
      categorizedByAI: true,
      suggestedCategory: 'roads_bridges',
      suggestedUrgency: 'high',
      urgencyRationale: 'Disruption of major traffic artery with risk to rickshaws.',
      duplicateScore: 0.1,
    },
  },
  {
    id: 'rep-002',
    publicId: 'CA-BD-2026-002',
    title: 'Clogged storm drain causing knee-deep waterlogging on Dhanmondi 27',
    description: 'Drain inlet is completely blocked with discarded construction bags and plastic debris. Even moderate rainfall submerges the footpath and forces school students to walk in dirty water.',
    category: 'drainage_waterlogging',
    subcategory: 'Clogged Storm Drain',
    status: 'resolved_pending_confirmation',
    urgency: 'elevated',
    urgencyReason: 'Public health and sanitation concern right outside school and hospital.',
    location: {
      division: 'Dhaka',
      district: 'Dhaka',
      cityCorporationOrUpazila: 'Dhaka North City Corporation (DNCC)',
      wardOrUnion: 'Ward 31',
      locality: 'Dhanmondi 27 (Old), Road 16',
      landmark: 'Opposite to Meena Bazar / Genetic Plaza',
      latitude: 23.7541,
      longitude: 90.3752,
    },
    images: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60',
    ],
    userId: 'usr-citizen-1',
    userName: 'Tanvir Hossain',
    userPhoneMasked: '+880 1711-***567',
    createdAt: '2026-10-18T11:00:00Z',
    updatedAt: '2026-10-25T16:00:00Z',
    confirmationsCount: 19,
    resolvedVotesCount: 14,
    flagsCount: 0,
    isCommunityVerified: true,
    assignedOrganizationId: 'org-dwasa',
    assignedOrganizationName: 'Dhaka WASA',
    assignedAssigneeName: 'Drainage Jet Team 3',
    aiAssistance: {
      categorizedByAI: true,
      suggestedCategory: 'drainage_waterlogging',
      suggestedUrgency: 'elevated',
    },
  },
  {
    id: 'rep-003',
    publicId: 'CA-BD-2026-003',
    title: 'Exposed live electrical cable dangling from damaged streetlight pole',
    description: 'During a recent storm the bracket broke. A loose live wire is sparking when touched by tree branches near the primary school footpath. Immediate threat of electrocution.',
    category: 'streetlighting',
    subcategory: 'Exposed Live Electrical Cable',
    status: 'assigned',
    urgency: 'immediate_danger',
    urgencyReason: 'Active electrocution hazard near pedestrian pathway. Call 999 advisory issued.',
    location: {
      division: 'Dhaka',
      district: 'Dhaka',
      cityCorporationOrUpazila: 'Dhaka North City Corporation (DNCC)',
      wardOrUnion: 'Ward 19',
      locality: 'Gulshan 2, Road 54',
      landmark: 'Behind Gulshan Central Park',
      latitude: 23.7925,
      longitude: 90.4158,
    },
    images: [
      'https://images.unsplash.com/photo-1508873696983-2df57036476b?w=800&auto=format&fit=crop&q=60',
    ],
    userId: 'usr-citizen-1',
    userName: 'Kazi Farhan',
    createdAt: '2026-10-26T04:20:00Z',
    updatedAt: '2026-10-26T07:10:00Z',
    confirmationsCount: 42,
    resolvedVotesCount: 0,
    flagsCount: 0,
    isCommunityVerified: true,
    assignedOrganizationId: 'org-desco-lighting',
    assignedOrganizationName: 'DESCO',
    assignedAssigneeName: 'Emergency Power Rapid Response Unit 2',
    targetResolutionDate: '2026-10-27',
    aiAssistance: {
      categorizedByAI: true,
      suggestedCategory: 'streetlighting',
      suggestedUrgency: 'immediate_danger',
      urgencyRationale: 'Sparking wire near school requires urgent cutoff.',
    },
  },
  {
    id: 'rep-004',
    publicId: 'CA-BD-2026-004',
    title: 'Overflowing municipal secondary transfer station spilling onto main road',
    description: 'Waste has not been collected for three days. Rotting municipal garbage is spilling onto the roadway, producing noxious stench and blocking pedestrian passage.',
    category: 'waste_sanitation',
    subcategory: 'Uncollected Solid Waste',
    status: 'under_review',
    urgency: 'high',
    urgencyReason: 'Public health crisis and road encroachment by rotting waste.',
    location: {
      division: 'Dhaka',
      district: 'Dhaka',
      cityCorporationOrUpazila: 'Dhaka South City Corporation (DSCC)',
      wardOrUnion: 'Ward 26',
      locality: 'Chawkbazar, Old Dhaka',
      landmark: 'Near Shahi Mosque Corner',
      latitude: 23.7188,
      longitude: 90.3982,
    },
    images: [
      'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=60',
    ],
    userId: 'usr-citizen-1',
    userName: 'Shahed Ahmed',
    createdAt: '2026-10-26T14:00:00Z',
    updatedAt: '2026-10-26T14:00:00Z',
    confirmationsCount: 11,
    resolvedVotesCount: 0,
    flagsCount: 0,
    isCommunityVerified: false,
  },
  {
    id: 'rep-005',
    publicId: 'CA-BD-2026-005',
    title: 'Major tidal waterlogging along Agrabad commercial access road',
    description: 'High tide overflow from Karnaphuli river canals is flooding Agrabad access road twice daily. Salt water is degrading asphalt and entering office lobbies.',
    category: 'drainage_waterlogging',
    subcategory: 'Tidal Canal Inundation',
    status: 'submitted',
    urgency: 'elevated',
    location: {
      division: 'Chattogram',
      district: 'Chattogram',
      cityCorporationOrUpazila: 'Chattogram City Corporation (CCC)',
      locality: 'Agrabad Commercial Area',
      landmark: 'Near World Trade Center',
      latitude: 22.3245,
      longitude: 91.8122,
    },
    images: [],
    userId: 'usr-citizen-1',
    userName: 'Imtiaz Chowdhury',
    createdAt: '2026-10-26T18:00:00Z',
    updatedAt: '2026-10-26T18:00:00Z',
    confirmationsCount: 8,
    resolvedVotesCount: 0,
    flagsCount: 0,
    isCommunityVerified: false,
  },
  {
    id: 'rep-006',
    publicId: 'CA-BD-2026-006',
    title: 'Broken footpath paving tiles with missing manhole ring slab',
    description: 'Several paving tiles are shattered and an open chamber has no warning cone. Pedestrians have suffered ankle sprains at night.',
    category: 'pedestrian_footpath',
    subcategory: 'Broken Sidewalk & Open Chamber',
    status: 'verified',
    urgency: 'high',
    location: {
      division: 'Sylhet',
      district: 'Sylhet',
      cityCorporationOrUpazila: 'Sylhet City Corporation (SCC)',
      locality: 'Zindabazar Point',
      landmark: 'Near Al-Hamra Shopping City',
      latitude: 24.8974,
      longitude: 91.8712,
    },
    images: [],
    userId: 'usr-citizen-1',
    userName: 'Fahim Rahman',
    createdAt: '2026-10-24T09:15:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
    confirmationsCount: 15,
    resolvedVotesCount: 0,
    flagsCount: 0,
    isCommunityVerified: true,
  },
  {
    id: 'rep-007',
    publicId: 'CA-BD-2026-007',
    title: 'Leaking clean water pipeline creating street swamp in Shaheb Bazar',
    description: 'Municipal pipeline ruptured below the street, wasting clean potable water and creating muddy slush in front of market stalls.',
    category: 'water_supply',
    subcategory: 'Ruptured Supply Main',
    status: 'closed',
    urgency: 'elevated',
    location: {
      division: 'Rajshahi',
      district: 'Rajshahi',
      cityCorporationOrUpazila: 'Rajshahi City Corporation (RCC)',
      locality: 'Shaheb Bazar Zero Point',
      landmark: 'North Market Lane',
      latitude: 24.3664,
      longitude: 88.6015,
    },
    images: [],
    userId: 'usr-citizen-1',
    userName: 'Moniruzzaman',
    createdAt: '2026-10-10T07:00:00Z',
    updatedAt: '2026-10-22T17:00:00Z',
    confirmationsCount: 18,
    resolvedVotesCount: 22,
    flagsCount: 0,
    isCommunityVerified: true,
    assignedOrganizationId: 'org-ccc-engineering',
    assignedOrganizationName: 'Rajshahi WASA & Municipal Works',
  },
];

const statusHistory: StatusHistoryEntry[] = [
  {
    id: 'hist-001',
    reportId: 'rep-001',
    previousStatus: null,
    newStatus: 'submitted',
    changedByUserId: 'usr-citizen-1',
    changedByUserName: 'Tanvir Hossain',
    changedByUserRole: 'citizen',
    timestamp: '2026-10-20T08:30:00Z',
    comment: 'Report submitted via CivicApart web platform with GPS coordinates.',
    isPublic: true,
  },
  {
    id: 'hist-002',
    reportId: 'rep-001',
    previousStatus: 'submitted',
    newStatus: 'under_review',
    changedByUserId: 'usr-moderator-1',
    changedByUserName: 'Nusrat Jahan (Moderator)',
    changedByUserRole: 'moderator',
    timestamp: '2026-10-20T11:00:00Z',
    comment: 'Location confirmed in DNCC Zone 4. Verified photographic evidence.',
    isPublic: true,
  },
  {
    id: 'hist-003',
    reportId: 'rep-001',
    previousStatus: 'under_review',
    newStatus: 'verified',
    changedByUserId: 'usr-moderator-1',
    changedByUserName: 'Nusrat Jahan (Moderator)',
    changedByUserRole: 'moderator',
    timestamp: '2026-10-21T09:30:00Z',
    comment: 'Over 15 community confirmations received. Promoted to verified civic issue.',
    isPublic: true,
  },
  {
    id: 'hist-004',
    reportId: 'rep-001',
    previousStatus: 'verified',
    newStatus: 'assigned',
    changedByUserId: 'usr-admin-1',
    changedByUserName: 'Admin Coordinator',
    changedByUserRole: 'admin',
    timestamp: '2026-10-22T14:00:00Z',
    comment: 'Ticket routed to DNCC Roads Division (Zone 4 Engineering team).',
    isPublic: true,
  },
  {
    id: 'hist-005',
    reportId: 'rep-001',
    previousStatus: 'assigned',
    newStatus: 'in_progress',
    changedByUserId: 'usr-operator-1',
    changedByUserName: 'Engr. Rafiqul Islam (DNCC)',
    changedByUserRole: 'operator',
    timestamp: '2026-10-24T14:15:00Z',
    comment: 'Asphalt patching crew mobilized. Work scheduled for night hours to minimize commuter congestion.',
    isPublic: true,
  },
  {
    id: 'hist-006',
    reportId: 'rep-002',
    previousStatus: 'in_progress',
    newStatus: 'resolved_pending_confirmation',
    changedByUserId: 'usr-operator-1',
    changedByUserName: 'Engr. Rafiqul Islam (DNCC)',
    changedByUserRole: 'operator',
    timestamp: '2026-10-25T16:00:00Z',
    comment: 'DWASA suction excavator cleared 4.5 tons of silt from the main storm culvert. Now awaiting resident verification.',
    isPublic: true,
  },
  {
    id: 'hist-007',
    reportId: 'rep-007',
    previousStatus: 'resolved_pending_confirmation',
    newStatus: 'closed',
    changedByUserId: 'usr-admin-1',
    changedByUserName: 'Admin Coordinator',
    changedByUserRole: 'admin',
    timestamp: '2026-10-22T17:00:00Z',
    comment: 'Closed following over 20 affirmative community confirmations that the pipeline was sealed and dry.',
    isPublic: true,
  },
];

const communityFeedbacks: CommunityFeedback[] = [
  {
    id: 'fb-001',
    reportId: 'rep-001',
    userId: 'usr-citizen-2',
    userName: 'Kazi Farhan',
    type: 'still_exists',
    comment: 'Passed Mirpur 10 this morning, crater is still wide open and rickshaws are stuck.',
    timestamp: '2026-10-25T08:15:00Z',
  },
  {
    id: 'fb-002',
    reportId: 'rep-002',
    userId: 'usr-citizen-3',
    userName: 'Sumaiya Binte',
    type: 'seems_resolved',
    comment: 'Walked through Dhanmondi 27 after today rain, water drained quickly into the cleaned inlet!',
    timestamp: '2026-10-26T12:30:00Z',
  },
];

const progressNotes: ProgressNote[] = [
  {
    id: 'note-001',
    reportId: 'rep-001',
    authorId: 'usr-operator-1',
    authorName: 'Engr. Rafiqul Islam',
    authorRole: 'operator',
    organizationName: 'DNCC Roads',
    note: 'Procurement of cold asphalt mix and stone chips completed. Team on site from 11:30 PM.',
    isPublic: true,
    createdAt: '2026-10-24T16:00:00Z',
  },
  {
    id: 'note-002',
    reportId: 'rep-001',
    authorId: 'usr-operator-1',
    authorName: 'Engr. Rafiqul Islam',
    authorRole: 'operator',
    organizationName: 'DNCC Roads',
    note: 'Internal note: Subcontractor delayed by diesel delivery. Contacted site supervisor.',
    isPublic: false,
    createdAt: '2026-10-25T01:00:00Z',
  },
];

const auditLogs: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-20T08:30:00Z',
    userId: 'usr-citizen-1',
    userName: 'Tanvir Hossain',
    userRole: 'citizen',
    action: 'CREATE_REPORT',
    targetEntity: 'Report',
    targetId: 'rep-001',
    details: 'Submitted new road damage report at Mirpur 10',
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-22T14:00:00Z',
    userId: 'usr-admin-1',
    userName: 'Admin Coordinator',
    userRole: 'admin',
    action: 'ASSIGN_REPORT',
    targetEntity: 'Report',
    targetId: 'rep-001',
    details: 'Assigned to DNCC Roads Division',
  },
];

// Helper to sanitize reports for public visitors (protect personal phone / private notes)
function sanitizeReportForPublic(report: Report, requesterRole: UserRole): Report {
  if (['admin', 'moderator', 'operator'].includes(requesterRole)) {
    return report;
  }
  // Public visitors & ordinary citizens do not see sensitive contact info or internal notes
  const copy = { ...report };
  if (requesterRole === 'visitor') {
    delete copy.userPhoneMasked;
  }
  return copy;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '15mb' }));

  // ===================== API ROUTES =====================

  // Auth: Current User
  app.get('/api/auth/current', (req: Request, res: Response) => {
    const user = users[currentSessionUserId] || users['usr-visitor-1'];
    res.json({ success: true, user });
  });

  // Auth: Role Switcher for Testing & Demonstration
  app.post('/api/auth/switch-role', (req: Request, res: Response) => {
    const { role } = req.body;
    let targetId = 'usr-citizen-1';
    if (role === 'moderator') targetId = 'usr-moderator-1';
    else if (role === 'operator') targetId = 'usr-operator-1';
    else if (role === 'admin') targetId = 'usr-admin-1';
    else if (role === 'visitor') targetId = 'usr-visitor-1';
    else targetId = 'usr-citizen-1';

    currentSessionUserId = targetId;
    res.json({ success: true, user: users[currentSessionUserId] });
  });

  // GET Reports (Directory, Filtering, Search, Sorting, Pagination)
  app.get('/api/reports', (req: Request, res: Response) => {
    const {
      category,
      status,
      division,
      urgency,
      search,
      sort = 'recent',
      page = '1',
      limit = '10',
    } = req.query;

    const currentUser = users[currentSessionUserId] || users['usr-visitor-1'];

    let filtered = reports.filter(r => !r.isHidden);

    if (category && category !== 'all') {
      filtered = filtered.filter(r => r.category === category);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    if (division && division !== 'all') {
      filtered = filtered.filter(r => r.location.division === division);
    }
    if (urgency && urgency !== 'all') {
      filtered = filtered.filter(r => r.urgency === urgency);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        r =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.publicId.toLowerCase().includes(q) ||
          r.location.locality.toLowerCase().includes(q) ||
          (r.location.landmark && r.location.landmark.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sort === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'updated') {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sort === 'confirmations') {
      filtered.sort((a, b) => b.confirmationsCount - a.confirmationsCount);
    } else if (sort === 'urgency') {
      const urgencyRank: Record<UrgencyLevel, number> = {
        immediate_danger: 4,
        high: 3,
        elevated: 2,
        routine: 1,
      };
      filtered.sort((a, b) => urgencyRank[b.urgency] - urgencyRank[a.urgency]);
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const total = filtered.length;
    const paginated = filtered
      .slice((pageNum - 1) * limitNum, pageNum * limitNum)
      .map(r => sanitizeReportForPublic(r, currentUser.role));

    res.json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  });

  // GET Single Report Details
  app.get('/api/reports/:id', (req: Request, res: Response) => {
    const currentUser = users[currentSessionUserId] || users['usr-visitor-1'];
    const report = reports.find(r => r.id === req.params.id || r.publicId === req.params.id);

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    const history = statusHistory
      .filter(h => h.reportId === report.id && (h.isPublic || ['admin', 'moderator', 'operator'].includes(currentUser.role)))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const notes = progressNotes
      .filter(n => n.reportId === report.id && (n.isPublic || ['admin', 'moderator', 'operator'].includes(currentUser.role)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const feedbacks = communityFeedbacks
      .filter(f => f.reportId === report.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      data: sanitizeReportForPublic(report, currentUser.role),
      history,
      notes,
      feedbacks,
    });
  });

  // POST: Create New Report (Citizen flow with server-side validation)
  app.post('/api/reports', (req: Request, res: Response) => {
    const currentUser = users[currentSessionUserId] || users['usr-citizen-1'];
    if (currentUser.role === 'visitor') {
      res.status(403).json({ success: false, error: 'Visitors must register or sign in to submit reports.' });
      return;
    }

    const {
      title,
      description,
      category,
      subcategory,
      location,
      images = [],
      urgencyReason,
      aiAssistance,
    } = req.body;

    // Strict input validation
    if (!title || title.trim().length < 5) {
      res.status(400).json({ success: false, error: 'Report title must be at least 5 characters.' });
      return;
    }
    if (!description || description.trim().length < 15) {
      res.status(400).json({ success: false, error: 'Please provide a detailed description of at least 15 characters.' });
      return;
    }
    if (!location || !location.division || !location.locality) {
      res.status(400).json({ success: false, error: 'Location division and locality are required.' });
      return;
    }

    // Evaluate initial urgency rules
    const urgencyCheck = evaluateUrgencyRules(title, description);

    const reportId = `rep-${Date.now()}`;
    const publicId = `CA-BD-${new Date().getFullYear()}-${String(reports.length + 1).padStart(4, '0')}`;
    const timestamp = new Date().toISOString();

    const newReport: Report = {
      id: reportId,
      publicId,
      title: title.trim(),
      description: description.trim(),
      category: category || 'other',
      subcategory: subcategory || undefined,
      status: 'submitted',
      urgency: urgencyCheck.level,
      urgencyReason: urgencyReason || urgencyCheck.rationale,
      location: {
        division: location.division,
        district: location.district || location.division,
        cityCorporationOrUpazila: location.cityCorporationOrUpazila,
        wardOrUnion: location.wardOrUnion,
        locality: location.locality,
        landmark: location.landmark,
        latitude: Number(location.latitude) || 23.8103,
        longitude: Number(location.longitude) || 90.4125,
        isApproximate: Boolean(location.isApproximate),
      },
      images: Array.isArray(images) ? images : [],
      userId: currentUser.id,
      userName: currentUser.name,
      userPhoneMasked: currentUser.phone ? currentUser.phone.replace(/(\+\d{3}\s\d{4}-)\d{3}(\d{3})/, '$1***$2') : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
      confirmationsCount: 1, // Author confirms existence
      resolvedVotesCount: 0,
      flagsCount: 0,
      isCommunityVerified: false,
      aiAssistance: aiAssistance || {
        categorizedByAI: false,
        suggestedUrgency: urgencyCheck.level,
        urgencyRationale: urgencyCheck.rationale,
      },
    };

    reports.unshift(newReport);

    // Initial status history entry
    statusHistory.push({
      id: `hist-${Date.now()}`,
      reportId: newReport.id,
      previousStatus: null,
      newStatus: 'submitted',
      changedByUserId: currentUser.id,
      changedByUserName: currentUser.name,
      changedByUserRole: currentUser.role,
      timestamp,
      comment: 'Initial report submitted via web portal.',
      isPublic: true,
    });

    // Audit log
    auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CREATE_REPORT',
      targetEntity: 'Report',
      targetId: newReport.id,
      details: `Created report ${publicId}: "${newReport.title}" in ${newReport.location.locality}, ${newReport.location.division}`,
    });

    res.status(201).json({ success: true, data: newReport });
  });

  // PATCH: Transition Status (Strict permissions and transition rules)
  app.patch('/api/reports/:id/status', (req: Request, res: Response) => {
    const currentUser = users[currentSessionUserId] || users['usr-visitor-1'];
    const report = reports.find(r => r.id === req.params.id);

    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    const { targetStatus, comment, resolutionPhotoUrl } = req.body;
    if (!targetStatus) {
      res.status(400).json({ success: false, error: 'Target status is required' });
      return;
    }

    // Role check and workflow verification
    const check = canTransitionStatus(report.status, targetStatus as ReportStatus, currentUser.role);
    if (!check.allowed) {
      res.status(403).json({ success: false, error: check.reason });
      return;
    }

    if (targetStatus === 'rejected' && (!comment || comment.trim().length < 5)) {
      res.status(400).json({ success: false, error: 'A mandatory rejection reason is required.' });
      return;
    }

    const prevStatus = report.status;
    report.status = targetStatus as ReportStatus;
    report.updatedAt = new Date().toISOString();

    if (targetStatus === 'verified') {
      report.isCommunityVerified = true;
    }
    if (targetStatus === 'rejected') {
      report.rejectionReason = comment;
    }

    // Status history
    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      reportId: report.id,
      previousStatus: prevStatus,
      newStatus: targetStatus as ReportStatus,
      changedByUserId: currentUser.id,
      changedByUserName: currentUser.name,
      changedByUserRole: currentUser.role,
      timestamp: report.updatedAt,
      comment: comment || `Status moved from ${prevStatus} to ${targetStatus}`,
      resolutionPhotoUrl,
      isPublic: true,
    };
    statusHistory.push(historyEntry);

    // Audit log
    auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp: report.updatedAt,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'TRANSITION_STATUS',
      targetEntity: 'Report',
      targetId: report.id,
      details: `Status transitioned from ${prevStatus} to ${targetStatus}. Comment: ${comment || 'None'}`,
    });

    res.json({ success: true, data: report, historyEntry });
  });

  // POST: Community Verification Feedback ("Still exists" or "Seems fixed")
  app.post('/api/reports/:id/feedback', (req: Request, res: Response) => {
    const currentUser = users[currentSessionUserId] || users['usr-visitor-1'];
    if (currentUser.role === 'visitor') {
      res.status(403).json({ success: false, error: 'Visitors must sign in to record verification feedback.' });
      return;
    }

    const report = reports.find(r => r.id === req.params.id);
    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    const { type, comment } = req.body;
    if (!['still_exists', 'seems_resolved', 'suspicious'].includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid feedback type' });
      return;
    }

    // Prevent duplicate feedback from the same user
    const existing = communityFeedbacks.find(
      f => f.reportId === report.id && f.userId === currentUser.id
    );

    if (existing) {
      res.status(400).json({
        success: false,
        error: 'You have already submitted community feedback for this report.',
      });
      return;
    }

    const feedbackEntry: CommunityFeedback = {
      id: `fb-${Date.now()}`,
      reportId: report.id,
      userId: currentUser.id,
      userName: currentUser.name,
      type,
      comment,
      timestamp: new Date().toISOString(),
    };
    communityFeedbacks.push(feedbackEntry);

    // Update tallies
    if (type === 'still_exists') {
      report.confirmationsCount += 1;
      // If a resolved ticket gets 3+ "still exists" confirmations from citizens, reopen it
      if (['resolved_pending_confirmation', 'closed'].includes(report.status) && report.confirmationsCount >= 3) {
        const oldStatus = report.status;
        report.status = 'reopened';
        report.updatedAt = new Date().toISOString();
        statusHistory.push({
          id: `hist-${Date.now()}`,
          reportId: report.id,
          previousStatus: oldStatus,
          newStatus: 'reopened',
          changedByUserId: 'system',
          changedByUserName: 'Community Verification Engine',
          changedByUserRole: 'moderator',
          timestamp: report.updatedAt,
          comment: 'Multiple community residents reported the problem still persists after resolution declaration.',
          isPublic: true,
        });
      }
    } else if (type === 'seems_resolved') {
      report.resolvedVotesCount += 1;
    } else if (type === 'suspicious') {
      report.flagsCount += 1;
    }

    report.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: feedbackEntry,
      confirmationsCount: report.confirmationsCount,
      resolvedVotesCount: report.resolvedVotesCount,
      status: report.status,
    });
  });

  // POST: Progress Note (Operators & Authorities)
  app.post('/api/reports/:id/progress-notes', (req: Request, res: Response) => {
    const currentUser = users[currentSessionUserId] || users['usr-visitor-1'];
    if (!['operator', 'admin', 'moderator'].includes(currentUser.role)) {
      res.status(403).json({ success: false, error: 'Only authorized operators or staff can add progress notes.' });
      return;
    }

    const report = reports.find(r => r.id === req.params.id);
    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    const { note, isPublic = true, photoUrl } = req.body;
    if (!note || note.trim().length < 5) {
      res.status(400).json({ success: false, error: 'Note must be at least 5 characters.' });
      return;
    }

    const newNote: ProgressNote = {
      id: `note-${Date.now()}`,
      reportId: report.id,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      organizationName: currentUser.organizationName,
      note: note.trim(),
      isPublic: Boolean(isPublic),
      createdAt: new Date().toISOString(),
      photoUrl,
    };

    progressNotes.push(newNote);
    report.updatedAt = new Date().toISOString();

    res.status(201).json({ success: true, data: newNote });
  });

  // PATCH: Assign Report (Admin or Operator Lead)
  app.patch('/api/reports/:id/assign', (req: Request, res: Response) => {
    const currentUser = users[currentSessionUserId] || users['usr-visitor-1'];
    if (!['admin', 'moderator'].includes(currentUser.role)) {
      res.status(403).json({ success: false, error: 'Only administrators or moderators can assign reports.' });
      return;
    }

    const report = reports.find(r => r.id === req.params.id);
    if (!report) {
      res.status(404).json({ success: false, error: 'Report not found' });
      return;
    }

    const { organizationId, assigneeName, targetResolutionDate } = req.body;
    const org = organizations.find(o => o.id === organizationId);

    report.assignedOrganizationId = organizationId;
    report.assignedOrganizationName = org ? org.name : organizationId;
    report.assignedAssigneeName = assigneeName || undefined;
    report.targetResolutionDate = targetResolutionDate || undefined;
    if (report.status === 'verified' || report.status === 'submitted') {
      report.status = 'assigned';
    }
    report.updatedAt = new Date().toISOString();

    auditLogs.push({
      id: `aud-${Date.now()}`,
      timestamp: report.updatedAt,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'ASSIGN_REPORT',
      targetEntity: 'Report',
      targetId: report.id,
      details: `Assigned to ${report.assignedOrganizationName} (${assigneeName || 'Unassigned lead'})`,
    });

    res.json({ success: true, data: report });
  });

  // GET: Public Transparency & Live Aggregated Analytics
  app.get('/api/analytics', (req: Request, res: Response) => {
    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => ['closed', 'resolved_pending_confirmation'].includes(r.status)).length;
    const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
    const pendingReviewReports = reports.filter(r => ['submitted', 'under_review'].includes(r.status)).length;
    const verifiedReports = reports.filter(r => r.isCommunityVerified).length;

    const categoryBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    const divisionBreakdown: Record<string, number> = {};
    let communityConfirmationsTotal = 0;

    reports.forEach(r => {
      categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + 1;
      statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
      divisionBreakdown[r.location.division] = (divisionBreakdown[r.location.division] || 0) + 1;
      communityConfirmationsTotal += r.confirmationsCount;
    });

    // Approximate average resolution duration in days for closed reports
    let totalClosedDays = 0;
    let closedCount = 0;
    reports
      .filter(r => r.status === 'closed')
      .forEach(r => {
        const created = new Date(r.createdAt).getTime();
        const updated = new Date(r.updatedAt).getTime();
        const days = Math.max(1, (updated - created) / (1000 * 60 * 60 * 24));
        totalClosedDays += days;
        closedCount++;
      });

    const averageResolutionDays = closedCount > 0 ? Math.round((totalClosedDays / closedCount) * 10) / 10 : 4.5;

    res.json({
      success: true,
      data: {
        totalReports,
        resolvedReports,
        inProgressReports,
        pendingReviewReports,
        verifiedReports,
        averageResolutionDays,
        categoryBreakdown,
        statusBreakdown,
        divisionBreakdown,
        communityConfirmationsTotal,
      },
    });
  });

  // GET: Moderation Queue & Flagged Cases
  app.get('/api/moderation/cases', (req: Request, res: Response) => {
    const currentUser = users[currentSessionUserId] || users['usr-visitor-1'];
    if (!['moderator', 'admin'].includes(currentUser.role)) {
      res.status(403).json({ success: false, error: 'Moderator access required.' });
      return;
    }

    const pendingReview = reports.filter(r => ['submitted', 'under_review'].includes(r.status));
    const flagged = reports.filter(r => r.flagsCount > 0 || r.aiAssistance?.moderationFlag);
    const conflicting = reports.filter(r => r.status === 'resolved_pending_confirmation' && r.confirmationsCount > 0);

    res.json({
      success: true,
      pendingReview,
      flagged,
      conflicting,
      recentAuditLogs: auditLogs.slice(-20).reverse(),
    });
  });

  // GET: Participating Organizations
  app.get('/api/organizations', (req: Request, res: Response) => {
    res.json({ success: true, data: organizations });
  });

  // ===================== GEMINI AI INTEGRATIONS (SERVER-SIDE) =====================

  // AI: Report Categorization & Subcategory Assistance
  app.post('/api/gemini/categorize', async (req: Request, res: Response) => {
    const { title, description } = req.body;
    if (!title && !description) {
      res.status(400).json({ success: false, error: 'Title or description required' });
      return;
    }

    // Heuristic fallback if Gemini is not configured
    const defaultHeuristic = () => {
      const t = `${title} ${description}`.toLowerCase();
      let cat: IssueCategory = 'other';
      let subcat = 'General civic issue';
      if (t.includes('road') || t.includes('pothole') || t.includes('bridge') || t.includes('রাস্তা')) {
        cat = 'roads_bridges';
        subcat = 'Pothole or Road Surface Damage';
      } else if (t.includes('water') || t.includes('drain') || t.includes('flood') || t.includes('জলাবদ্ধ')) {
        cat = 'drainage_waterlogging';
        subcat = 'Blocked Drain or Stagnant Water';
      } else if (t.includes('garbage') || t.includes('waste') || t.includes('trash') || t.includes('ময়লা')) {
        cat = 'waste_sanitation';
        subcat = 'Uncollected Solid Waste';
      } else if (t.includes('light') || t.includes('lamp') || t.includes('বাতি')) {
        cat = 'streetlighting';
        subcat = 'Defective Streetlight Pole';
      } else if (t.includes('footpath') || t.includes('sidewalk') || t.includes('ফুটপাত')) {
        cat = 'pedestrian_footpath';
        subcat = 'Broken Sidewalk Slab';
      }
      return {
        category: cat,
        subcategory: subcat,
        keywords: ['civic', 'bangladesh', cat],
        summary: title ? title.slice(0, 100) : 'Civic problem report',
      };
    };

    if (!aiClient) {
      res.json({ success: true, source: 'heuristic', data: defaultHeuristic() });
      return;
    }

    try {
      const prompt = `Analyze this civic issue report from Bangladesh:
Title: "${title || ''}"
Description: "${description || ''}"

Classify into one of these exact categories:
roads_bridges, drainage_waterlogging, waste_sanitation, streetlighting, pedestrian_footpath, water_supply, public_parks, illegal_encroachment, other.

Return JSON in this format:
{
  "category": "<one of exact category keys above>",
  "subcategory": "<concise specific subcategory in English>",
  "keywords": ["keyword1", "keyword2"],
  "summary": "<1-sentence factual summary>"
}`;

      const aiResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              subcategory: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING },
            },
            required: ['category', 'subcategory', 'keywords', 'summary'],
          },
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{}');
      res.json({ success: true, source: 'gemini', data: parsed });
    } catch (err: any) {
      console.warn('Gemini categorization error, falling back to heuristics:', err.message);
      res.json({ success: true, source: 'fallback', data: defaultHeuristic() });
    }
  });

  // AI: Description Improvement
  app.post('/api/gemini/improve-description', async (req: Request, res: Response) => {
    const { rawDescription, title } = req.body;
    if (!rawDescription || rawDescription.trim().length < 5) {
      res.status(400).json({ success: false, error: 'Description is too short to improve.' });
      return;
    }

    if (!aiClient) {
      // Clean fallback: remove excess whitespace and capitalize
      const polished = rawDescription.trim().replace(/\s+/g, ' ');
      res.json({
        success: true,
        source: 'fallback',
        improvedText: polished.charAt(0).toUpperCase() + polished.slice(1),
      });
      return;
    }

    try {
      const prompt = `You are a civic engineering editor for CivicApart Bangladesh.
Improve this citizen report into a clear, concise, objective, and factual description suitable for municipal technicians.
CRITICAL RULES:
1. Do NOT invent new facts, witnesses, dates, injuries, or locations not present in the original input.
2. Maintain English or Bengali depending on the user's primary language.
3. Remove emotional rants or irrelevant commentary, preserving all specific technical details (measurements, road names, landmarks, duration).

Title: "${title || ''}"
Citizen's Draft: "${rawDescription}"

Output ONLY the improved description text, nothing else.`;

      const aiResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const improvedText = aiResponse.text?.trim() || rawDescription;
      res.json({ success: true, source: 'gemini', improvedText });
    } catch (err: any) {
      console.warn('Gemini improve-description error:', err.message);
      res.json({ success: true, source: 'fallback', improvedText: rawDescription });
    }
  });

  // AI: Candidate Duplicate Detection (Comparing against active database reports)
  app.post('/api/gemini/check-duplicates', (req: Request, res: Response) => {
    const { title, description, category, lat, lng } = req.body;

    const candidateMatches = reports
      .filter(r => r.status !== 'closed' && r.status !== 'rejected')
      .map(existing => {
        const result = calculateDuplicateScore(
          {
            title: title || '',
            description: description || '',
            category: category || 'other',
            lat: Number(lat) || 23.8103,
            lng: Number(lng) || 90.4125,
          },
          existing
        );
        return {
          report: sanitizeReportForPublic(existing, 'citizen'),
          score: result.score,
          reasons: result.reasons,
        };
      })
      .filter(m => m.score >= 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    res.json({
      success: true,
      hasDuplicates: candidateMatches.length > 0,
      candidates: candidateMatches,
    });
  });

  // AI: Moderation Check (Flags PII, obscenity, or abusive spam)
  app.post('/api/gemini/moderate', async (req: Request, res: Response) => {
    const { text } = req.body;
    if (!text) {
      res.json({ success: true, flagged: false });
      return;
    }

    // Heuristic regex check for raw national ID or private credit card numbers
    const containsNIDorCard = /\b\d{10,17}\b/.test(text);

    if (!aiClient) {
      res.json({
        success: true,
        flagged: containsNIDorCard,
        reason: containsNIDorCard ? 'Potential sensitive identification number detected' : null,
      });
      return;
    }

    try {
      const prompt = `Review this public civic report submission for safety:
"${text}"

Check if this text contains:
1. Direct hate speech, severe harassment, or abusive slurs.
2. Private personal identity numbers (passports, national ID cards, bank accounts).
3. Commercial spam or advertisement irrelevant to municipal civic issues.

Return JSON:
{
  "flagged": true | false,
  "reason": "<short explanation if flagged, or null>"
}`;

      const aiResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              flagged: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
            },
            required: ['flagged'],
          },
        },
      });

      const parsed = JSON.parse(aiResponse.text || '{"flagged": false}');
      res.json({ success: true, source: 'gemini', ...parsed });
    } catch (err: any) {
      res.json({ success: true, source: 'fallback', flagged: containsNIDorCard });
    }
  });

  // Service Health Endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'CivicApart',
      version: '1.0.0',
      geminiConnected: Boolean(aiClient),
      reportsCount: reports.length,
      organizationsCount: organizations.length,
      timestamp: new Date().toISOString(),
    });
  });

  // Serve static files in production or mount Vite in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicApart full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();

import { IssueCategory, UrgencyLevel, ReportStatus } from '../types';

export interface CategoryMeta {
  key: IssueCategory;
  en: string;
  bn: string;
  descriptionEn: string;
  descriptionBn: string;
  iconName: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: 'roads_bridges',
    en: 'Broken / Damaged Roads & Bridges',
    bn: 'ভাঙ্গা রাস্তা ও ক্ষতিগ্রস্ত সেতু',
    descriptionEn: 'Potholes, broken asphalt, damaged bridges, missing culvert covers',
    descriptionBn: 'খানাখন্দ, ভাঙ্গা পিচ, ক্ষতিগ্রস্ত ব্রিজ ও কালভার্ট',
    iconName: 'Construction',
    color: '#D97706',
  },
  {
    key: 'drainage_waterlogging',
    en: 'Waterlogging & Drainage',
    bn: 'জলাবদ্ধতা ও ড্রেনেজ সমস্যা',
    descriptionEn: 'Clogged storm drains, water stagnation after rain, open canals',
    descriptionBn: 'আবদ্ধ ড্রেন, বৃষ্টির পর জমে থাকা পানি, ড্রেনেজের ব্যর্থতা',
    iconName: 'Waves',
    color: '#0284C7',
  },
  {
    key: 'waste_sanitation',
    en: 'Uncollected Garbage & Sanitation',
    bn: 'অপরিচ্ছন্ন বর্জ্য ও ডাস্টবিন',
    descriptionEn: 'Overflowing dumpsters, illegal trash heaps, uncollected roadside waste',
    descriptionBn: 'ডাস্টবিন উপচে পড়া ময়লা, রাস্তার ধারের স্তূপ, দুর্গন্ধ',
    iconName: 'Trash2',
    color: '#DC2626',
  },
  {
    key: 'streetlighting',
    en: 'Damaged / Inactive Streetlights',
    bn: 'অকেজো সড়ক বাতি',
    descriptionEn: 'Burnt-out lamps, dark streets, broken light poles, exposed junction boxes',
    descriptionBn: 'নষ্ট বাতি, অন্ধকার রাস্তা, ভাঙ্গা পোল, অরক্ষিত বিদ্যুৎ লাইন',
    iconName: 'Lightbulb',
    color: '#CA8A04',
  },
  {
    key: 'pedestrian_footpath',
    en: 'Footpaths & Pedestrian Safety',
    bn: 'ফুটপাত ও পথচারী নিরাপত্তা',
    descriptionEn: 'Broken sidewalk slabs, blocked footpaths, missing zebra crossings',
    descriptionBn: 'ভাঙ্গা ফুটপাত, পথচারী পারাপারে ঝুঁকি, ফুটপাত দখল',
    iconName: 'Footprints',
    color: '#059669',
  },
  {
    key: 'water_supply',
    en: 'WASA Water Supply & Leaks',
    bn: 'ওয়াসা পানি সরবরাহ ও পাইপ লিকেজ',
    descriptionEn: 'Broken water mains, foul water supply, low water pressure',
    descriptionBn: 'ওয়াসার পাইপ ফেটে যাওয়া, ময়লা পানি, পানির সংকট',
    iconName: 'Droplets',
    color: '#2563EB',
  },
  {
    key: 'public_parks',
    en: 'Public Parks & Playgrounds',
    bn: 'পাবলিক পার্ক ও খেলার মাঠ',
    descriptionEn: 'Damaged play equipment, broken benches, neglected open spaces',
    descriptionBn: 'ভাঙ্গা বেঞ্চ, খেলার অনুপযোগী মাঠ, পার্কের অবহেলা',
    iconName: 'Trees',
    color: '#16A34A',
  },
  {
    key: 'illegal_encroachment',
    en: 'Illegal Road / Canal Encroachment',
    bn: 'অবৈধ দখল ও প্রতিবন্ধকতা',
    descriptionEn: 'Construction materials blocking roads, encroached canals, illegal sheds',
    descriptionBn: 'রাস্তায় রাখা নির্মাণসামগ্রী, খাল দখল, অবৈধ স্থাপনা',
    iconName: 'ShieldAlert',
    color: '#9333EA',
  },
  {
    key: 'other',
    en: 'Other Municipal Issues',
    bn: 'অন্যান্য পৌর সমস্যা',
    descriptionEn: 'Other local civic, environmental, or municipal concerns',
    descriptionBn: 'অন্যান্য নাগরিক ও পরিবেশগত সমস্যা',
    iconName: 'AlertCircle',
    color: '#4B5563',
  },
];

export interface DivisionData {
  name: string;
  nameBn: string;
  centerLat: number;
  centerLng: number;
  districts: {
    name: string;
    nameBn: string;
    cityCorporationsOrUpazilas: string[];
    landmarks: { name: string; nameBn: string; lat: number; lng: number }[];
  }[];
}

export const BANGLADESH_DIVISIONS: DivisionData[] = [
  {
    name: 'Dhaka',
    nameBn: 'ঢাকা',
    centerLat: 23.8103,
    centerLng: 90.4125,
    districts: [
      {
        name: 'Dhaka',
        nameBn: 'ঢাকা',
        cityCorporationsOrUpazilas: [
          'Dhaka North City Corporation (DNCC)',
          'Dhaka South City Corporation (DSCC)',
          'Savar Upazila',
          'Dhamrai Upazila',
          'Keraniganj Upazila',
        ],
        landmarks: [
          { name: 'Mirpur 10 Roundabout', nameBn: 'মিরপুর ১০ গোলচত্বর', lat: 23.8069, lng: 90.3687 },
          { name: 'Dhanmondi 27', nameBn: 'ধানমন্ডি ২৭', lat: 23.7541, lng: 90.3752 },
          { name: 'Gulshan 2 Circle', nameBn: 'গুলশান ২ সার্কেল', lat: 23.7925, lng: 90.4158 },
          { name: 'Motijheel Commercial Area', nameBn: 'মতিঝিল বাণিজ্যিক এলাকা', lat: 23.7335, lng: 90.4178 },
          { name: 'Uttara Sector 7', nameBn: 'উত্তরা সেক্টর ৭', lat: 23.8728, lng: 90.3984 },
          { name: 'Farmgate Bus Stop', nameBn: 'ফার্মগেট বাস স্টপ', lat: 23.7571, lng: 90.3892 },
          { name: 'Old Dhaka (Chawkbazar)', nameBn: 'চকবাজার, পুরান ঢাকা', lat: 23.7188, lng: 90.3982 },
          { name: 'Mohakhali Wireless Gate', nameBn: 'মহাখালী ওয়ারলেস গেট', lat: 23.7781, lng: 90.4047 },
        ],
      },
      {
        name: 'Gazipur',
        nameBn: 'গাজীপুর',
        cityCorporationsOrUpazilas: ['Gazipur City Corporation (GCC)', 'Tongi', 'Kaliakair', 'Sreepur'],
        landmarks: [
          { name: 'Chowrasta Gazipur', nameBn: 'গাজীপুর চৌরাস্তা', lat: 23.9999, lng: 90.3842 },
          { name: 'Tongi Station Road', nameBn: 'টঙ্গী স্টেশন রোড', lat: 23.8967, lng: 90.4011 },
        ],
      },
      {
        name: 'Narayanganj',
        nameBn: 'নারায়ণগঞ্জ',
        cityCorporationsOrUpazilas: ['Narayanganj City Corporation (NCC)', 'Siddhirganj', 'Fatullah'],
        landmarks: [
          { name: 'Chashara Narayanganj', nameBn: 'চাষাড়া, নারায়ণগঞ্জ', lat: 23.6238, lng: 90.5000 },
        ],
      },
    ],
  },
  {
    name: 'Chattogram',
    nameBn: 'চট্টগ্রাম',
    centerLat: 22.3569,
    centerLng: 91.7832,
    districts: [
      {
        name: 'Chattogram',
        nameBn: 'চট্টগ্রাম',
        cityCorporationsOrUpazilas: ['Chattogram City Corporation (CCC)', 'Hathazari', 'Sitakunda', 'Patiya'],
        landmarks: [
          { name: 'Agrabad Commercial Area', nameBn: 'আগ্রাবাদ বাণিজ্যিক এলাকা', lat: 22.3245, lng: 91.8122 },
          { name: 'GEC Circle', nameBn: 'জিইসি মোড়', lat: 22.3592, lng: 91.8219 },
          { name: 'Muradpur Intersection', nameBn: 'মুরাদপুর মোড়', lat: 22.3705, lng: 91.8354 },
          { name: 'Chawkbazar Chattogram', nameBn: 'চকবাজার, চট্টগ্রাম', lat: 22.3587, lng: 91.8385 },
        ],
      },
    ],
  },
  {
    name: 'Sylhet',
    nameBn: 'সিলেট',
    centerLat: 24.8949,
    centerLng: 91.8687,
    districts: [
      {
        name: 'Sylhet',
        nameBn: 'সিলেট',
        cityCorporationsOrUpazilas: ['Sylhet City Corporation (SCC)', 'Beanibazar', 'Golapganj'],
        landmarks: [
          { name: 'Zindabazar Point', nameBn: 'জিন্দাবাজার পয়েন্ট', lat: 24.8974, lng: 91.8712 },
          { name: 'Amberkhana Point', nameBn: 'আম্বরখানা পয়েন্ট', lat: 24.9056, lng: 91.8681 },
          { name: 'Bandar Bazar', nameBn: 'বন্দর বাজার', lat: 24.8895, lng: 91.8702 },
        ],
      },
    ],
  },
  {
    name: 'Rajshahi',
    nameBn: 'রাজশাহী',
    centerLat: 24.3636,
    centerLng: 88.6241,
    districts: [
      {
        name: 'Rajshahi',
        nameBn: 'রাজশাহী',
        cityCorporationsOrUpazilas: ['Rajshahi City Corporation (RCC)', 'Paba', 'Bagmara'],
        landmarks: [
          { name: 'Shaheb Bazar Zero Point', nameBn: 'সাহেব বাজার জিরো পয়েন্ট', lat: 24.3664, lng: 88.6015 },
          { name: 'Talaimari More', nameBn: 'তালাইমারী মোড়', lat: 24.3621, lng: 88.6288 },
        ],
      },
    ],
  },
  {
    name: 'Khulna',
    nameBn: 'খুলনা',
    centerLat: 22.8456,
    centerLng: 89.5403,
    districts: [
      {
        name: 'Khulna',
        nameBn: 'খুলনা',
        cityCorporationsOrUpazilas: ['Khulna City Corporation (KCC)', 'Daulatpur', 'Khalishpur'],
        landmarks: [
          { name: 'Shibbari More', nameBn: 'শিববাড়ী মোড়', lat: 22.8193, lng: 89.5542 },
          { name: 'Dakbangla More', nameBn: 'ডাকবাংলো মোড়', lat: 22.8122, lng: 89.5638 },
        ],
      },
    ],
  },
  {
    name: 'Barishal',
    nameBn: 'বরিশাল',
    centerLat: 22.701,
    centerLng: 90.3535,
    districts: [
      {
        name: 'Barishal',
        nameBn: 'বরিশাল',
        cityCorporationsOrUpazilas: ['Barishal City Corporation (BCC)', 'Babuganj', 'Gournadi'],
        landmarks: [
          { name: 'Sadar Road Barishal', nameBn: 'সদর রোড, বরিশাল', lat: 22.7024, lng: 90.3702 },
          { name: 'Nathullabad Bus Terminal', nameBn: 'নথুল্লাবাদ বাস টার্মিনাল', lat: 22.7214, lng: 90.3512 },
        ],
      },
    ],
    },
  {
    name: 'Rangpur',
    nameBn: 'রংপুর',
    centerLat: 25.7439,
    centerLng: 89.2752,
    districts: [
      {
        name: 'Rangpur',
        nameBn: 'রংপুর',
        cityCorporationsOrUpazilas: ['Rangpur City Corporation (RpCC)', 'Gangachara', 'Pirgachha'],
        landmarks: [
          { name: 'Jahaj Company More', nameBn: 'জাহাজ কোম্পানি মোড়', lat: 25.7461, lng: 89.2483 },
        ],
      },
    ],
  },
  {
    name: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    centerLat: 24.7471,
    centerLng: 90.4203,
    districts: [
      {
        name: 'Mymensingh',
        nameBn: 'ময়মনসিংহ',
        cityCorporationsOrUpazilas: ['Mymensingh City Corporation (MCC)', 'Muktagachha', 'Trishal'],
        landmarks: [
          { name: 'Ganginar Par Mymensingh', nameBn: 'গাঙ্গিনার পাড়', lat: 24.7562, lng: 90.4075 },
        ],
      },
    ],
  },
];

/**
 * Format timestamp in Bangladesh Standard Time (BST, UTC+6)
 */
export function formatBSTDate(dateStr: string, locale: 'en' | 'bn' = 'en'): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    // Use Intl DateTimeFormat with Asia/Dhaka timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    const formatted = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', options).format(date);
    return `${formatted} BST`;
  } catch (err) {
    return dateStr;
  }
}

export const STATUS_META: Record<
  ReportStatus,
  {
    en: string;
    bn: string;
    color: string;
    bg: string;
    border: string;
    descriptionEn: string;
    descriptionBn: string;
  }
> = {
  submitted: {
    en: 'Submitted',
    bn: 'জমা দেওয়া হয়েছে',
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    descriptionEn: 'Report received by platform. Awaiting initial community or moderator review.',
    descriptionBn: 'প্রতিবেদন জমা নেওয়া হয়েছে। প্রাথমিক যাচাইয়ের অপেক্ষায় আছে।',
  },
  under_review: {
    en: 'Under Review',
    bn: 'যাচাইাধীন',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    descriptionEn: 'Being evaluated by community moderators for validity, duplicates, and location accuracy.',
    descriptionBn: 'মডারেটর কর্তৃক অবস্থান ও সত্যতা যাচাই করা হচ্ছে।',
  },
  verified: {
    en: 'Verified',
    bn: 'যাচাইকৃত',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    descriptionEn: 'Independently confirmed as a genuine civic issue by community evidence or moderators.',
    descriptionBn: 'নাগরিক প্রমাণ বা মডারেটর দ্বারা সত্যতা প্রমাণিত।',
  },
  assigned: {
    en: 'Assigned',
    bn: 'দায়িত্বপ্রাপ্ত',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    descriptionEn: 'Routed to participating municipal authority or community maintenance team.',
    descriptionBn: 'দায়িত্বশীল সংস্থা বা স্বেচ্ছাসেবী দলের নিকট প্রেরিত।',
  },
  in_progress: {
    en: 'In Progress',
    bn: 'কাজ চলছে',
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    descriptionEn: 'Repair, clearance, or municipal remediation work is actively being carried out.',
    descriptionBn: 'মেরামত বা প্রতিকারের কাজ সক্রিয়ভাবে চলছে।',
  },
  resolved_pending_confirmation: {
    en: 'Resolved (Pending Confirmation)',
    bn: 'সমাধানকৃত (নিশ্চিতকরণ বাকি)',
    color: '#0D9488',
    bg: '#F0FDFA',
    border: '#99F6E4',
    descriptionEn: 'Marked resolved by operator. Now awaiting local community confirmation.',
    descriptionBn: 'সংস্থা সমাধান ঘোষণা করেছে। স্থানীয় বাসিন্দাদের অনুমোদনের অপেক্ষায় আছে।',
  },
  closed: {
    en: 'Closed',
    bn: 'বন্ধ / সমাপ্ত',
    color: '#4B5563',
    bg: '#F3F4F6',
    border: '#E5E7EB',
    descriptionEn: 'Successfully resolved and confirmed by community residents.',
    descriptionBn: 'সফলভাবে সমাধান সম্পন্ন এবং স্থানীয়দের দ্বারা নিশ্চিতকৃত।',
  },
  rejected: {
    en: 'Rejected',
    bn: 'প্রত্যাখ্যাত',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    descriptionEn: 'Report did not meet platform guidelines, was duplicate, or could not be verified.',
    descriptionBn: 'নীতিমালা বহির্ভূত, ডুপ্লিকেট বা প্রমাণবিহীন হওয়ায় বাতিল।',
  },
  reopened: {
    en: 'Reopened',
    bn: 'পুনরায় খোলা হয়েছে',
    color: '#BE123C',
    bg: '#FFF1F2',
    border: '#FECDD3',
    descriptionEn: 'Community feedback proved problem still exists despite resolution claim.',
    descriptionBn: 'নাগরিকরা জানিয়েছেন কাজটি যথাযথভাবে হয়নি, পুনরায় সক্রিয় করা হয়েছে।',
  },
};

export const URGENCY_META: Record<
  UrgencyLevel,
  {
    en: string;
    bn: string;
    color: string;
    bg: string;
    border: string;
    descriptionEn: string;
  }
> = {
  routine: {
    en: 'Routine',
    bn: 'সাধারণ',
    color: '#4B5563',
    bg: '#F3F4F6',
    border: '#E5E7EB',
    descriptionEn: 'Standard scheduled municipal maintenance issue.',
  },
  elevated: {
    en: 'Elevated',
    bn: 'উচ্চ গুরুত্ব',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    descriptionEn: 'Noticeable public inconvenience affecting regular movement or health.',
  },
  high: {
    en: 'High Priority',
    bn: 'জরুরি অগ্রাধিকার',
    color: '#EA580C',
    bg: '#FFF7ED',
    border: '#FED7AA',
    descriptionEn: 'Significant disruption (e.g. flooded school gates, sewage overspill).',
  },
  immediate_danger: {
    en: 'Immediate Danger',
    bn: 'তাৎক্ষণিক বিপদ',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    descriptionEn: 'Life-safety hazard (live electric wires, deep open manholes, collapsing bridge). Call 999 immediately.',
  },
};

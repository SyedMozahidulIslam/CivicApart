import React, { useState } from 'react';
import { User, IssueCategory, UrgencyLevel, Report } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import {
  createReport,
  aiCategorize,
  aiImproveDescription,
  aiCheckDuplicates,
} from '../services/api';
import { MapView } from '../components/MapView';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { CATEGORIES, BANGLADESH_DIVISIONS } from '../utils/bangladeshData';
import {
  Sparkles,
  MapPin,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  FileText,
  Navigation,
  ShieldAlert,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface Props {
  lang: Language;
  onNavigate: (view: string, param?: string) => void;
  currentUser: User;
}

export const ReportProblemPage: React.FC<Props> = ({ lang, onNavigate, currentUser }) => {
  const t = TRANSLATIONS[lang];

  // Wizard Step: 1 | 2 | 3 | 4 | 'success'
  const [step, setStep] = useState<number | 'success'>(1);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('roads_bridges');
  const [subcategory, setSubcategory] = useState('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [cityCorporationOrUpazila, setCityCorporationOrUpazila] = useState('Dhaka North City Corporation (DNCC)');
  const [locality, setLocality] = useState('');
  const [landmark, setLandmark] = useState('');
  const [lat, setLat] = useState(23.8103);
  const [lng, setLng] = useState(90.4125);
  const [isApproximate, setIsApproximate] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // AI & Submission States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<{ report: Report; score: number; reasons: string[] }[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<Report | null>(null);

  // Quick preset sample images for easy test submissions
  const samplePhotos = [
    { label: 'Pothole Crater', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60' },
    { label: 'Flooded Street', url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60' },
    { label: 'Broken Light Pole', url: 'https://images.unsplash.com/photo-1508873696983-2df57036476b?w=800&auto=format&fit=crop&q=60' },
    { label: 'Garbage Heap', url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=60' },
  ];

  // Helper: Trigger Gemini AI categorization
  const handleAiCategorize = async () => {
    if (!title && !description) {
      setAiNote('Please write a brief title or description first.');
      return;
    }
    try {
      setAiLoading(true);
      setAiNote(null);
      const res = await aiCategorize(title, description);
      if (res.category) {
        setCategory(res.category);
        if (res.subcategory) setSubcategory(res.subcategory);
        setAiNote(`AI suggested: ${res.category.replace('_', ' ')} — "${res.subcategory}"`);
      }
    } catch (err) {
      setAiNote('AI categorization temporarily unavailable. You can select manually.');
    } finally {
      setAiLoading(false);
    }
  };

  // Helper: Trigger Gemini AI description improvement
  const handleAiImproveDescription = async () => {
    if (!description || description.trim().length < 10) {
      setAiNote('Please write a draft description of at least 10 characters.');
      return;
    }
    try {
      setAiLoading(true);
      setAiNote(null);
      const improved = await aiImproveDescription(description, title);
      setDescription(improved);
      setAiNote('Description refined with factual civic clarity.');
    } catch (err) {
      setAiNote('AI text refinement temporarily unavailable.');
    } finally {
      setAiLoading(false);
    }
  };

  // Step 2: Use Device GPS Location
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setIsApproximate(false);
        setAiNote(`GPS coordinates captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      err => {
        alert('Could not retrieve location. Please click on the map to set coordinates.');
      }
    );
  };

  // Step 2: Quick preset landmark select
  const currentDivData = BANGLADESH_DIVISIONS.find(d => d.name === division) || BANGLADESH_DIVISIONS[0];
  const currentDistData = currentDivData.districts[0];

  const handleSelectLandmarkPreset = (lm: { name: string; lat: number; lng: number }) => {
    setLocality(lm.name);
    setLandmark(lm.name);
    setLat(lm.lat);
    setLng(lm.lng);
  };

  // Step 3: Handle photo file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImages(prev => [...prev, dataUrl]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Proceed to Step 4: Run AI duplicate check & review
  const handleProceedToStep4 = async () => {
    setStep(4);
    try {
      setIsCheckingDuplicates(true);
      const dupCheck = await aiCheckDuplicates({
        title,
        description,
        category,
        lat,
        lng,
      });
      setDuplicateCandidates(dupCheck.candidates || []);
    } catch (err) {
      console.warn('Duplicate pre-check skipped:', err);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const payload: Partial<Report> = {
        title,
        description,
        category,
        subcategory: subcategory || undefined,
        location: {
          division,
          district,
          cityCorporationOrUpazila,
          locality,
          landmark: landmark || undefined,
          latitude: lat,
          longitude: lng,
          isApproximate,
        },
        images,
        aiAssistance: {
          categorizedByAI: true,
          suggestedCategory: category,
          duplicateScore: duplicateCandidates.length > 0 ? duplicateCandidates[0].score : 0,
        },
      };

      const report = await createReport(payload);
      setCreatedReport(report);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen
  if (step === 'success' && createdReport) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-md border border-gray-200 p-8 shadow-sm text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-gray-900">
            {t.reportForm.successTitle}
          </h2>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-md space-y-1">
            <span className="text-xs text-gray-500 font-semibold">{t.reportForm.successId}</span>
            <div className="text-2xl font-mono font-black text-[#0F2942]">
              {createdReport.publicId}
            </div>
            <p className="text-xs text-emerald-700 font-medium pt-1">
              Initial status: <strong>Submitted</strong> (Awaiting Community & Moderator Verification)
            </p>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed max-w-lg mx-auto">
            {t.reportForm.successNote}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => onNavigate('detail', createdReport.id)}
              className="w-full sm:w-auto bg-[#0F2942] hover:bg-[#1E3A8A] text-white px-5 py-2.5 rounded font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>{t.reportForm.viewReportBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setStep(1);
                setTitle('');
                setDescription('');
                setImages([]);
                setLocality('');
                setCreatedReport(null);
              }}
              className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded font-semibold text-xs sm:text-sm transition-colors"
            >
              {t.reportForm.submitAnotherBtn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
          {lang === 'bn' ? 'নাগরিক সমস্যা রিপোর্ট করুন' : 'Report a Civic Problem'}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {lang === 'bn'
            ? 'প্রমাণ ও নির্দিষ্ট অবস্থানসহ জানান। কোনো জরুরি জীবনহানির আশঙ্কায় ৯৯৯ এ কল করুন।'
            : 'Submit local infrastructure, waterlogging, waste, or road damage for verified public tracking.'}
        </p>
      </div>

      {/* Progress Wizard Tabs */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold border-b border-gray-200 pb-3">
        <div className={`pb-1 border-b-2 ${step === 1 ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-400'}`}>
          {t.reportForm.step1}
        </div>
        <div className={`pb-1 border-b-2 ${step === 2 ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-400'}`}>
          {t.reportForm.step2}
        </div>
        <div className={`pb-1 border-b-2 ${step === 3 ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-400'}`}>
          {t.reportForm.step3}
        </div>
        <div className={`pb-1 border-b-2 ${step === 4 ? 'border-blue-600 text-blue-900' : 'border-transparent text-gray-400'}`}>
          {t.reportForm.step4}
        </div>
      </div>

      {/* AI or Alert Notice */}
      {aiNote && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-2 rounded text-xs flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{aiNote}</span>
          </div>
          <button onClick={() => setAiNote(null)} className="text-blue-500 hover:text-blue-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Problem Details */}
      {step === 1 && (
        <div className="bg-white p-5 rounded-md border border-gray-200 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t.reportForm.titleLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t.reportForm.titlePlaceholder}
              className="w-full border border-gray-300 rounded p-2 text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                {t.reportForm.descLabel} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAiImproveDescription}
                disabled={aiLoading}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>{aiLoading ? 'Analyzing...' : t.reportForm.aiImproveDesc}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t.reportForm.descPlaceholder}
              className="w-full border border-gray-300 rounded p-2 text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">
                  {t.reportForm.categoryLabel}
                </label>
                <button
                  type="button"
                  onClick={handleAiCategorize}
                  disabled={aiLoading}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>{t.reportForm.aiCategorize}</span>
                </button>
              </div>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as IssueCategory)}
                className="w-full border border-gray-300 rounded p-2 text-xs bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>
                    {lang === 'bn' ? c.bn : c.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.reportForm.subcategoryLabel}
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                placeholder="e.g. Broken pavement, exposed live wire"
                className="w-full border border-gray-300 rounded p-2 text-xs bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              disabled={title.trim().length < 5 || description.trim().length < 15}
              onClick={() => setStep(2)}
              className="bg-[#0F2942] hover:bg-[#1E3A8A] text-white px-5 py-2 rounded text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              <span>Next: Pinpoint Location</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Location */}
      {step === 2 && (
        <div className="bg-white p-5 rounded-md border border-gray-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.reportForm.divisionLabel}
              </label>
              <select
                value={division}
                onChange={e => setDivision(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-xs bg-white"
              >
                {BANGLADESH_DIVISIONS.map(d => (
                  <option key={d.name} value={d.name}>
                    {lang === 'bn' ? d.nameBn : d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.reportForm.districtLabel}
              </label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.reportForm.cityCorporationLabel}
              </label>
              <input
                type="text"
                value={cityCorporationOrUpazila}
                onChange={e => setCityCorporationOrUpazila(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.reportForm.localityLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={locality}
                onChange={e => setLocality(e.target.value)}
                placeholder={t.reportForm.localityPlaceholder}
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.reportForm.landmarkLabel}
              </label>
              <input
                type="text"
                value={landmark}
                onChange={e => setLandmark(e.target.value)}
                placeholder={t.reportForm.landmarkPlaceholder}
                className="w-full border border-gray-300 rounded p-2 text-xs"
              />
            </div>
          </div>

          {/* Quick preset landmarks */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
              {lang === 'bn' ? 'জনপ্রিয় স্থান বা ল্যান্ডমার্ক বেছে নিন:' : 'Popular Landmark Presets:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {currentDistData?.landmarks?.map(lm => (
                <button
                  key={lm.name}
                  type="button"
                  onClick={() => handleSelectLandmarkPreset(lm)}
                  className="bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-900 border border-gray-200 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                >
                  📍 {lang === 'bn' ? lm.nameBn : lm.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Map Picker */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">{t.reportForm.clickMapHint}</span>
              <button
                type="button"
                onClick={handleGetDeviceLocation}
                className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center space-x-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{t.reportForm.useCurrentLocation}</span>
              </button>
            </div>

            <MapView
              height="300px"
              center={[lat, lng]}
              zoom={14}
              isPickerMode={true}
              pickerLocation={{ lat, lng }}
              onLocationPick={loc => {
                setLat(loc.lat);
                setLng(loc.lng);
              }}
              lang={lang}
            />

            <div className="text-[11px] text-gray-500 font-mono">
              Selected GPS: {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={!locality.trim()}
              onClick={() => setStep(3)}
              className="bg-[#0F2942] hover:bg-[#1E3A8A] text-white px-5 py-2 rounded text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              <span>Next: Photo Evidence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Photo Evidence */}
      {step === 3 && (
        <div className="bg-white p-5 rounded-md border border-gray-200 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t.reportForm.photosLabel}
            </label>
            <p className="text-xs text-gray-500 mb-3">{t.reportForm.photosHint}</p>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="bg-[#0F2942] hover:bg-[#1E3A8A] text-white px-3.5 py-1.5 rounded text-xs font-semibold inline-block">
                  Choose Photo File
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-gray-400 mt-2">JPG, PNG, WebP up to 5MB</p>
            </div>
          </div>

          {/* Quick preset testing photos */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
              {lang === 'bn' ? 'নমুনা ছবি বেছে নিন (টেস্টিংয়ের জন্য):' : 'Or select sample civic photos for testing:'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {samplePhotos.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImages(prev => [...prev, s.url])}
                  className="border border-gray-200 hover:border-blue-500 rounded p-1.5 text-left text-xs bg-gray-50 hover:bg-blue-50/50 transition-colors"
                >
                  <img src={s.url} alt={s.label} className="w-full h-16 object-cover rounded mb-1" />
                  <span className="font-semibold text-[11px] block truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Attached photos list */}
          {images.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold text-gray-700 block mb-2">
                Attached Images ({images.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt="Evidence preview"
                      className="w-20 h-20 object-cover rounded border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 shadow-xs"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleProceedToStep4}
              className="bg-[#0F2942] hover:bg-[#1E3A8A] text-white px-5 py-2 rounded text-xs font-bold flex items-center space-x-1.5"
            >
              <span>Next: AI Review & Submit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: AI Pre-submission Check & Final Review */}
      {step === 4 && (
        <div className="bg-white p-5 rounded-md border border-gray-200 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            Review & Pre-Submission Analysis
          </h2>

          {/* AI Duplicate Detection Result */}
          {isCheckingDuplicates ? (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs flex items-center space-x-2 text-blue-800">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Checking active database for potential duplicate reports...</span>
            </div>
          ) : duplicateCandidates.length > 0 ? (
            <div className="bg-amber-50 border border-amber-300 p-3.5 rounded space-y-2">
              <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Possible Duplicate Report Detected</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                A similar civic issue was already reported nearby. Rather than creating a duplicate ticket, you can confirm the existing issue or proceed if this is a separate problem.
              </p>
              <div className="space-y-1.5 pt-1">
                {duplicateCandidates.map((dup, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded border border-amber-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-gray-600">{dup.report.publicId}</span>
                      <span className="font-bold text-gray-900 block">{dup.report.title}</span>
                      <span className="text-[10px] text-gray-500">
                        {dup.reasons.join(' • ')} ({(dup.score * 100).toFixed(0)}% match)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('detail', dup.report.id)}
                      className="text-xs bg-amber-600 text-white px-2.5 py-1 rounded font-semibold shrink-0"
                    >
                      View Existing
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-xs flex items-center space-x-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No existing duplicate reports detected in this locality.</span>
            </div>
          )}

          {/* Submission Summary */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-gray-500 font-medium">Title:</span>
              <span className="col-span-2 font-bold text-gray-900">{title}</span>

              <span className="text-gray-500 font-medium">Category:</span>
              <span className="col-span-2 capitalize text-gray-800">{category.replace('_', ' ')}</span>

              <span className="text-gray-500 font-medium">Location:</span>
              <span className="col-span-2 text-gray-800 font-medium">
                {locality}, {district}, {division}
              </span>

              <span className="text-gray-500 font-medium">Reporter:</span>
              <span className="col-span-2 text-gray-800">
                {currentUser.name} ({currentUser.email})
              </span>

              <span className="text-gray-500 font-medium">Photographs:</span>
              <span className="col-span-2 text-gray-800">{images.length} attached</span>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <span className="text-gray-500 font-medium block mb-1">Description:</span>
              <p className="text-gray-800 leading-relaxed bg-white p-2 rounded border border-gray-200">
                {description}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleFinalSubmit}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded text-xs sm:text-sm font-bold shadow-md flex items-center space-x-2 transition-all active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.reportForm.submitting}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.reportForm.submitBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

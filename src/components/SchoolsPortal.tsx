import React, { useState, useEffect } from 'react';
import { School, IdCardRequest, FormField } from '../types';
import { store } from '../supabase';
import { PhotoStudio } from './PhotoStudio';
import {
  Search,
  KeyRound,
  ArrowLeft,
  Upload,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SchoolsPortalProps {
  initialSchoolCode?: string | null;
  onNavigateHome: () => void;
  onNavigate?: (view: string) => void;
}

export const SchoolsPortal: React.FC<SchoolsPortalProps> = ({
  initialSchoolCode,
  onNavigateHome,
  onNavigate,
}) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  // Form states
  const [requestType, setRequestType] = useState<IdCardRequest['request_type']>('New admission');
  const [teacherName, setTeacherName] = useState('');
  const [notes, setNotes] = useState('');
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<IdCardRequest | null>(null);

  useEffect(() => {
    store.getSchools().then((list) => {
      setSchools(list);
      setLoading(false);

      if (initialSchoolCode) {
        const found = list.find(
          (s) => s.access_code.toUpperCase() === initialSchoolCode.toUpperCase()
        );
        if (found) {
          setSelectedSchool(found);
          setIsCodeVerified(true);
        }
      }
    });
  }, [initialSchoolCode]);

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact_name && s.contact_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    setEnteredCode('');
    setCodeError(false);
    setIsCodeVerified(false);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    if (enteredCode.trim().toUpperCase() === selectedSchool.access_code.toUpperCase()) {
      setIsCodeVerified(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 600;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const compressed = await compressImage(file);
    setPhotoDataUrl(compressed);
    setPhotoBlob(file);
  };

  const handleApplyEditedPhoto = (blob: Blob, url: string) => {
    setPhotoBlob(blob);
    setPhotoDataUrl(url);
    setIsPhotoEditorOpen(false);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    // Student primary name fallback
    const firstFieldKey = selectedSchool.form_fields[0]?.label || 'Student name';
    const studentName = dynamicValues[firstFieldKey] || 'Student';

    setSubmitting(true);

    try {
      const fullStudentData: Record<string, string> = {
        ...dynamicValues,
        'Class Teacher name': teacherName,
      };

      const newReq = await store.addRequest({
        school_id: selectedSchool.id,
        school_name: selectedSchool.name,
        request_type: requestType,
        student_name: studentName,
        student_data: fullStudentData,
        photo_data: photoDataUrl || undefined,
        photo_path: photoDataUrl || undefined,
        notes,
        status: 'Received',
      });

      setSubmitting(false);
      setSubmittedRequest(newReq);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
      alert('Could not submit request. Please try again or contact Ai Printers directly.');
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setSubmittedRequest(null);
    setDynamicValues({});
    setNotes('');
    setPhotoDataUrl('');
    setPhotoBlob(null);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1f6fd6] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs text-slate-500 font-medium">
          Ai Printers • School ID Cards Management
        </span>
      </div>

      {/* View 1: Submitted Success Modal */}
      {submittedRequest ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="font-outfit font-extrabold text-2xl text-slate-900">
            ID Card Request Submitted!
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Your request has been recorded in our production system under job ID:
          </p>

          <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 inline-block">
            <span className="text-xs text-slate-400 font-semibold block uppercase">
              Tracking / Job ID
            </span>
            <span className="font-mono font-bold text-2xl text-[#1f6fd6]">
              {submittedRequest.id}
            </span>
          </div>

          <div className="text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 mb-6">
            <div>
              <strong>School:</strong> {selectedSchool?.name}
            </div>
            <div>
              <strong>Student:</strong> {submittedRequest.student_name}
            </div>
            <div>
              <strong>Request Type:</strong> {submittedRequest.request_type}
            </div>
            <div>
              <strong>Status:</strong> <span className="text-amber-600 font-bold">Received</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/917020655113?text=${encodeURIComponent(
                `Hi Ai Printers, I submitted an ID Card Request for ${selectedSchool?.name}. Job ID: ${submittedRequest.id}, Student: ${submittedRequest.student_name} (${submittedRequest.request_type}).`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 rounded-xl bg-[#22c35e] hover:bg-[#1eb355] text-white text-xs font-bold shadow-md shadow-[#22c35e]/30 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Confirm on WhatsApp</span>
            </a>

            <button
              onClick={handleResetForAnother}
              className="px-5 py-3 rounded-xl bg-[#131c30] text-white text-xs font-bold hover:bg-[#1e2a47]"
            >
              Submit Another Student
            </button>
          </div>
        </div>
      ) : !selectedSchool ? (
        /* View 2: School Selection Directory */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
          {/* Quick Attendance Poster Maker Callout for Teachers */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-300 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-lg">
                🏆
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Monthly 100% Attendance Poster Maker for Teachers
                </h4>
                <p className="text-[11px] text-slate-600">
                  Upload classroom group photos, edit student names, and generate WhatsApp celebration flyers!
                </p>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('attendanceposter')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
              >
                Launch Poster Maker →
              </button>
            )}
          </div>

          <div className="max-w-xl mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1f6fd6] font-outfit">
              SCHOOL SELECTION
            </span>
            <h2 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#131c30] mt-1">
              Select Your School or College
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Choose your educational institution from the registered list below to submit student ID
              card printing requests.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search school name or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1f6fd6] text-sm text-slate-800 bg-slate-50 focus:bg-white"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-sm">No schools registered matching your search.</p>
              <p className="text-xs text-slate-400 mt-1">
                Contact Ai Printers to register your institution: +91 70206 55113
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSchools.map((school) => (
                <div
                  key={school.id}
                  onClick={() => handleSelectSchool(school)}
                  className="cursor-pointer group p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-[#1f6fd6] bg-[#fafbfd] hover:bg-white transition-all shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1f6fd6] font-outfit font-extrabold flex items-center justify-center text-base">
                      🏫
                    </div>
                    <div>
                      <h3 className="font-outfit font-bold text-base text-slate-900 group-hover:text-[#1f6fd6] transition-colors">
                        {school.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {school.contact_name ? `Contact: ${school.contact_name} • ` : ''}
                        {school.form_fields.length} ID fields configured
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#1f6fd6] group-hover:underline">
                    Select School →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !isCodeVerified ? (
        /* View 3: Access Code Gate */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm max-w-md mx-auto text-center">
          <button
            onClick={() => setSelectedSchool(null)}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-6 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change School</span>
          </button>

          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1f6fd6] flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7" />
          </div>

          <h3 className="font-outfit font-extrabold text-2xl text-slate-900">
            {selectedSchool.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Enter the private school authorization code provided by your administrative office.
          </p>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <input
                type="text"
                autoFocus
                placeholder="e.g. GVS-2026"
                value={enteredCode}
                onChange={(e) => {
                  setEnteredCode(e.target.value);
                  setCodeError(false);
                }}
                className={`w-full text-center tracking-widest uppercase font-mono font-bold text-lg px-4 py-3 rounded-xl border focus:outline-none transition-all ${
                  codeError
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-slate-300 focus:border-[#1f6fd6]'
                }`}
              />
              {codeError && (
                <p className="text-xs text-red-600 mt-1.5 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Incorrect school code. Please verify with school office.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#1f6fd6] hover:bg-[#1a5cb3] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Continue to Student Form
            </button>
          </form>
        </div>
      ) : (
        /* View 4: Full Teacher Request Form */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1f6fd6] text-[10px] font-bold">
                <span>🏫 Authorized Portal</span>
              </div>
              <h2 className="font-outfit font-extrabold text-2xl text-slate-900 mt-1">
                {selectedSchool.name}
              </h2>
              <p className="text-xs text-slate-500">
                Submit a new student admission, lost card replacement, or correction request.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedSchool(null);
                setIsCodeVerified(false);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 self-start sm:self-auto"
            >
              Switch School
            </button>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-6">
            {/* Request Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Request Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['New admission', 'Lost card', 'Damaged card', 'Correction'] as const).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRequestType(type)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                        requestType === type
                          ? 'bg-[#131c30] text-white border-[#131c30] shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Dynamic Custom Fields from School Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedSchool.form_fields.map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={dynamicValues[field.label] || ''}
                    onChange={(e) =>
                      setDynamicValues({
                        ...dynamicValues,
                        [field.label]: e.target.value,
                      })
                    }
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#1f6fd6] bg-slate-50/50 focus:bg-white"
                  />
                </div>
              ))}
            </div>

            {/* Photograph Upload & Photo Studio Integration */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Student Photograph *
              </label>

              {photoDataUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-[#1f6fd6] shadow-sm bg-white shrink-0">
                    <img
                      src={photoDataUrl}
                      alt="Student Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <p className="text-xs text-emerald-700 font-semibold flex items-center justify-center sm:justify-start gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Photo prepared for ID print</span>
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => setIsPhotoEditorOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-[#e6197f] border border-pink-200 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Re-adjust in Photo Studio</span>
                      </button>

                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold inline-block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        Replace Photo
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-[#1f6fd6] rounded-xl bg-white transition-all text-center">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-[#1f6fd6] mb-2" />
                    <span className="text-xs font-bold text-slate-800">
                      Tap or click to upload student photograph
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      JPG, PNG, or mobile camera capture
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Teacher Name & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Class Teacher Name *
                </label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g. Mrs. Sharma / Mr. Khan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#1f6fd6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Special Notes / Instructions
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special correction or urgent date..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#1f6fd6]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-[#1f6fd6] hover:bg-[#1a5cb3] text-white text-sm font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Submitting request...</span>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Submit ID Card Request</span>
                </>
              )}
            </button>
          </form>

          {/* Embedded Photo Studio Modal */}
          {isPhotoEditorOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-3xl my-auto">
                <PhotoStudio
                  initialFile={photoBlob as File}
                  embedded={true}
                  onApplyPhoto={handleApplyEditedPhoto}
                  onClose={() => setIsPhotoEditorOpen(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

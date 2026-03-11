
import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, ShieldCheck, ListChecks } from 'lucide-react';
import { User, Violation } from '../types';
import { STORAGE_KEY_VIOLATIONS } from '../constants';
import { analyzeTrafficMedia } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';

interface UploadSectionProps {
  user: User;
}

const UploadSection: React.FC<UploadSectionProps> = ({ user }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Violation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResults([]);
      setError(null);
    }
  };

  const processMedia = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = await fileToBase64(file);
      const mimeType = file.type;
      
      const aiResult = await analyzeTrafficMedia(base64Data, mimeType);
      
      if (!aiResult.detections || aiResult.detections.length === 0) {
        setError("No traffic violations detected in this media.");
        setIsProcessing(false);
        return;
      }

      const newViolations: Violation[] = aiResult.detections.map(det => ({
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        vehicleNumber: det.vehicleNumber,
        violationType: det.violationType,
        timestamp: new Date().toISOString(),
        location: 'Traffic Sector Unit 04', 
        mediaUrl: preview || '',
        status: 'pending',
        confidence: det.confidence,
        detectedBy: user.name,
        officerId: user.id // Save the login ID
      }));

      // Save to local storage
      const existing = localStorage.getItem(STORAGE_KEY_VIOLATIONS);
      const violations = existing ? JSON.parse(existing) : [];
      // Add all new detections to the top
      localStorage.setItem(STORAGE_KEY_VIOLATIONS, JSON.stringify([...newViolations, ...violations]));

      setResults(newViolations);
    } catch (err: any) {
      console.error(err);
      setError("AI Analysis failed. Ensure the plate and violation are visible in the frame.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResults([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className={`
        bg-white dark:bg-slate-900 border-2 border-dashed rounded-3xl p-12 transition-all text-center
        ${file ? 'border-blue-400 dark:border-blue-500' : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'}
      `}>
        {!file ? (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100 dark:border-blue-900/30">
              <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">CCTV Media Upload</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
              Process traffic footage for automatic multi-violation enforcement. Optimized for Indian HSRP and standard license plates.
            </p>
            <div className="pt-4">
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-100 dark:shadow-none"
              >
                Choose Media
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative inline-block max-w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl bg-slate-100 dark:bg-slate-800">
              {file.type.startsWith('image/') ? (
                <img src={preview!} alt="Preview" className="max-h-[400px] w-auto object-contain" />
              ) : (
                <video src={preview!} className="max-h-[400px]" controls />
              )}
              <button 
                onClick={reset}
                className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-full transition shadow-lg backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {results.length === 0 && (
              <div className="flex justify-center gap-4">
                <button 
                  onClick={processMedia}
                  disabled={isProcessing}
                  className={`
                    px-8 py-3 rounded-xl font-bold transition flex items-center gap-3
                    ${isProcessing 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none'
                    }
                  `}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {isProcessing ? 'AI Analyzing Media...' : 'Run Multi-Scan'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-center gap-4 text-red-700 dark:text-red-400">
          <AlertCircle className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-500">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-xl font-bold">Analysis Complete: {results.length} Found</h3>
            </div>
            <button 
              onClick={reset}
              className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
            >
              Process Next Media
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {results.map((result, index) => (
              <div 
                key={result.id} 
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  <div className="flex items-center gap-3 md:col-span-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/30">
                      {index + 1}
                    </div>
                    <ResultItem label="Vehicle Plate" value={result.vehicleNumber} highlight />
                  </div>
                  <div className="md:col-span-1">
                    <ResultItem label="Violation Type" value={result.violationType} color="text-red-600 dark:text-red-500" />
                  </div>
                  <div className="md:col-span-1">
                    <ResultItem label="Confidence" value={`${(result.confidence * 100).toFixed(1)}%`} />
                  </div>
                  <div className="flex justify-end md:col-span-1">
                    <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                       <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">System ID</p>
                       <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">{result.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex items-center gap-3">
            <ListChecks className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              All detected violations have been automatically logged to the <strong>Violation Hub</strong>. Officers can now review each case for final verification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultItem: React.FC<{ label: string, value: string, highlight?: boolean, color?: string }> = ({ label, value, highlight, color }) => (
  <div className="space-y-0.5">
    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
    <p className={`text-sm font-bold ${color || 'text-slate-900 dark:text-white'} ${highlight ? 'bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 inline-block' : ''}`}>
      {value}
    </p>
  </div>
);

export default UploadSection;

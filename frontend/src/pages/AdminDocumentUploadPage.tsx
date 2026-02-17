import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    FileText,
    Loader2,
    Sparkles,
    Users,
    ArrowLeft,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    FileUp,
    Layers,
    Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadDocument } from '../services/api';
import { DEPARTMENTS } from '../constants/departments';

export const AdminDocumentUploadPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [assignmentMode, setAssignmentMode] = useState<'ALL' | 'DEPARTMENT'>('ALL');
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleDepartmentToggle = (dept: string) => {
        setSelectedDepartments(prev =>
            prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
        );
    };

    const handleUpload = async () => {
        if (!file || !dueDate) {
            setError('Missing required fields: Please select a file and set a due date.');
            return;
        }
        if (assignmentMode === 'DEPARTMENT' && selectedDepartments.length === 0) {
            setError('Selection required: Please select at least one department.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const assignedRef = 'ALL';
            const departments = assignmentMode === 'DEPARTMENT' ? selectedDepartments : undefined;
            await uploadDocument(file, assignedRef, dueDate, departments);
            setSuccess('Document successfully uploaded and trainings assigned.');
            setFile(null);
            setDueDate('');
            setSelectedDepartments([]);
            setTimeout(() => navigate('/admin/dashboard'), 2000);
        } catch (err: any) {
            setError(err.message || 'Error occurred during upload and assignment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="tms-container py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="tms-heading-2 text-slate-900">Instant Training Launch</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Upload SOP & Assign to Teams</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="tms-container py-10 max-w-5xl flex-1">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden"
                >
                    <div className="p-10 border-b border-slate-50 relative overflow-hidden bg-slate-50/30">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            <FileUp className="w-32 h-32 text-blue-600 rotate-12" />
                        </div>
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-blue-100">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="tms-heading-2 text-slate-900">Configure Deployment</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Upload SOP and set target audience</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Step 1: Asset Selection */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg">1</div>
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Source Configuration</h3>
                            </div>

                            <div className="relative group">
                                <input
                                    type="file"
                                    id="file"
                                    accept=".pdf,.txt"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                />
                                <div className={`
                                    relative z-10 border-4 border-dashed rounded-[32px] p-12 transition-all duration-500
                                    flex flex-col items-center justify-center gap-5 text-center
                                    ${file ? 'border-blue-500 bg-blue-50/50 shadow-inner' : 'border-slate-100 bg-slate-50/50 hover:border-blue-400 hover:bg-slate-50 hover:shadow-xl'}
                                `}>
                                    <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center transition-all duration-500 ${file ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-110' : 'bg-white text-slate-300 shadow-sm group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                        {file ? <FileText className="w-10 h-10" /> : <FileUp className="w-10 h-10" />}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                            {file ? file.name : 'Select Primary Vector'}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {file ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF / OCR Optimized Documents'}
                                        </p>
                                    </div>
                                    {file && (
                                        <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                            <CheckCircle2 className="w-3 h-3" /> Metadata Validated
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] font-medium text-blue-700 leading-relaxed uppercase tracking-wide">
                                    AI Engine Notice: System will automatically parse the document structure to generate assessment questions in the background.
                                </p>
                            </div>
                        </div>

                        {/* Step 2: Targeting */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg">2</div>
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Deployment Targeting</h3>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setAssignmentMode('ALL')}
                                    className={`flex-1 p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 group relative overflow-hidden ${assignmentMode === 'ALL' ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-100' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 text-slate-600'}`}
                                >
                                    <div className={`p-4 rounded-2xl transition-all ${assignmentMode === 'ALL' ? 'bg-white/20' : 'bg-white shadow-sm group-hover:scale-110'}`}>
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Global Reach</span>
                                        {assignmentMode === 'ALL' && <div className="mt-1 h-1 w-8 bg-white mx-auto rounded-full opacity-60" />}
                                    </div>
                                </button>

                                <button
                                    onClick={() => setAssignmentMode('DEPARTMENT')}
                                    className={`flex-1 p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 group relative overflow-hidden ${assignmentMode === 'DEPARTMENT' ? 'border-emerald-600 bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 text-slate-600'}`}
                                >
                                    <div className={`p-4 rounded-2xl transition-all ${assignmentMode === 'DEPARTMENT' ? 'bg-white/20' : 'bg-white shadow-sm group-hover:scale-110'}`}>
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Unit Filter</span>
                                        {assignmentMode === 'DEPARTMENT' && <div className="mt-1 h-1 w-8 bg-white mx-auto rounded-full opacity-60" />}
                                    </div>
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {assignmentMode === 'DEPARTMENT' ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="border-2 border-slate-100 rounded-[28px] p-6 h-72 overflow-y-auto bg-slate-50/30 space-y-2 custom-scrollbar"
                                    >
                                        {DEPARTMENTS.map(dept => (
                                            <label
                                                key={dept}
                                                className={`flex items-center gap-4 p-4 rounded-[18px] border-2 cursor-pointer transition-all ${selectedDepartments.includes(dept) ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-white border-transparent hover:border-slate-200 text-slate-600'}`}
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDepartments.includes(dept)}
                                                        onChange={() => handleDepartmentToggle(dept)}
                                                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-all opacity-0 absolute"
                                                    />
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${selectedDepartments.includes(dept) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                                                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[4]" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-widest truncate">{dept}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center h-72 text-center p-8 bg-blue-50/30 rounded-[28px] border-2 border-dashed border-blue-100"
                                    >
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm mb-4">
                                            <Users className="w-8 h-8" />
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Universal Broadcast</h4>
                                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-wide max-w-[200px]">
                                            This training will be automatically assigned to all registered personnel across the enterprise.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg">3</div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Compliance Deadline</h3>
                                </div>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent pointer-events-none opacity-50" />
                        <div className="relative z-10 flex items-center gap-4">
                            {error && (
                                <div className="flex items-center gap-3 px-5 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{success}</span>
                                </div>
                            )}
                        </div>

                        <div className="relative z-10 flex gap-4 w-full md:w-auto">
                            <button
                                onClick={handleUpload}
                                disabled={loading || !file || !dueDate}
                                className={`
                                    flex-1 md:flex-none px-12 py-5 rounded-[20px] font-bold text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-4 transition-all active:scale-95
                                    ${loading || !file || !dueDate ? 'bg-slate-800 cursor-not-allowed text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white'}
                                `}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Launch Training
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

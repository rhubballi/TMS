import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateQuestions, submitAnswers, getSession } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    AlertCircle,
    Loader2,
    BookOpen,
    Shield,
    ChevronRight,
    ArrowLeft,
    Clock,
    FileText,
    HelpCircle,
    Activity,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    Brain
} from 'lucide-react';

export const AssessmentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<any>({
        shortAnswer: {},
        mcq: {},
        trueFalse: {}
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            generateAssessmentQuestions();
        }
    }, [id]);

    const generateAssessmentQuestions = async () => {
        try {
            setLoading(true);
            const sessionData = await getSession(id!);
            setQuestions(sessionData.questions);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setError('Assessment session not found. Please upload the document again.');
            } else {
                setError('Failed to load assessment questions');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!id) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-rose-100 max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-[30px] flex items-center justify-center text-rose-500 mx-auto border border-rose-100 shadow-inner">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Invalid Session</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 leading-relaxed opacity-70">The assessment integrity token is missing or invalid.</p>
                    </div>
                    <button onClick={() => navigate('/')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-12">
                <div className="text-center space-y-8 max-w-sm">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
                        <Activity className="w-20 h-20 text-blue-600 animate-pulse mx-auto opacity-30 relative z-10" />
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-900 font-black uppercase tracking-[0.3em] text-xs">Verifying Integrity</p>
                        <p className="text-[9px] text-slate-400 mt-3 font-bold uppercase tracking-widest italic opacity-60 leading-relaxed">Pulling high-fidelity question vectors from the document repository...</p>
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden max-w-[200px] mx-auto">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-full bg-blue-600"
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (!questions) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-rose-100 max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-[30px] flex items-center justify-center text-rose-500 mx-auto border border-rose-100 shadow-inner">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-rose-700 uppercase tracking-tight">Protocol Failure</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 leading-relaxed opacity-70">{error || 'Questions could not be synthesized from the document repository.'}</p>
                    </div>
                    <button onClick={() => navigate('/')} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-rose-500 transition-all active:scale-95">System Recovery</button>
                </div>
            </div>
        );
    }

    const handleShortAnswerChange = (index: number, value: string) => {
        setAnswers((prev: any) => ({
            ...prev,
            shortAnswer: { ...prev.shortAnswer, [index]: value }
        }));
    };

    const handleMcqChange = (index: number, value: string) => {
        setAnswers((prev: any) => ({
            ...prev,
            mcq: { ...prev.mcq, [index]: value }
        }));
    };

    const handleTfChange = (index: number, value: boolean) => {
        setAnswers((prev: any) => ({
            ...prev,
            trueFalse: { ...prev.trueFalse, [index]: value }
        }));
    };

    const handleSubmit = async () => {
        const shortCount = Object.keys(answers.shortAnswer).length;
        const mcqCount = Object.keys(answers.mcq).length;
        const tfCount = Object.keys(answers.trueFalse).length;

        const totalExpected = (questions.shortAnswer?.length || 0) + (questions.mcq?.length || 0) + (questions.trueFalse?.length || 0);
        const totalProvided = shortCount + mcqCount + tfCount;

        if (totalProvided < totalExpected) {
            setError(`Incomplete Record: ${totalExpected - totalProvided} validation fields remain empty. All parameters must be populated.`);
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const result = await submitAnswers({
                sessionId: id,
                answers
            });
            navigate('/result', { state: { result } });
        } catch (err) {
            console.error(err);
            setError('Submission Violated: Encryption error or session timeout. Please re-verify connectivity.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="tms-container py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="tms-heading-3 text-slate-900 leading-tight">Controlled Assessment</h1>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5 italic opacity-60">Integrity Session: {id.slice(0, 8)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="hidden sm:flex flex-col items-end">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authored State</p>
                            <p className="text-[10px] font-black text-blue-600 uppercase">Training Module</p>
                        </div>
                        <div className="w-px h-8 bg-slate-100 mx-2"></div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full shadow-sm">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest animate-pulse">Live Pulse</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="tms-container py-12 max-w-4xl flex-1 flex flex-col gap-12">
                {/* Hero Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[44px] shadow-2xl border border-slate-100 overflow-hidden relative group"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transition-transform duration-1000 group-hover:rotate-12 group-hover:scale-110">
                        <Brain className="w-64 h-64 text-blue-600" />
                    </div>
                    <div className="p-12 md:p-16 relative z-10 flex flex-col gap-6">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100">
                            <Sparkles className="w-3.5 h-3.5" />
                            Knowledge Extraction Protocol
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">Assessment <br />Module</h2>
                        <p className="text-slate-500 text-sm md:text-lg max-w-2xl font-medium leading-relaxed opacity-80">
                            This assessment generates high-fidelity data points to verify your comprehension of the regulated asset. Proceed with precision.
                        </p>
                    </div>
                    <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex flex-wrap gap-8 items-center px-12 italic">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Compliant Assessment</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Verified Asset Source</span>
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-16">
                    {/* Short Answer Section */}
                    {questions.shortAnswer?.length > 0 && (
                        <Section
                            title="Detailed Analysis"
                            description="Deconstruct complex requirements into concise responses."
                            icon={<FileText className="w-6 h-6 text-blue-600" />}
                        >
                            {questions.shortAnswer.map((q: any, i: number) => (
                                <div key={i} className="group mb-12 last:mb-0 animate-in fade-in slide-in-from-bottom-6 transition-all" style={{ animationDelay: `${i * 150}ms` }}>
                                    <label className="block mb-6">
                                        <div className="flex items-start gap-4">
                                            <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-blue-600 shrink-0 border border-white shadow-inner">{String(i + 1).padStart(2, '0')}</span>
                                            <span className="text-lg font-bold text-slate-800 leading-relaxed pt-1">{q}</span>
                                        </div>
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            rows={5}
                                            className="w-full bg-white border-2 border-slate-100 rounded-[28px] p-8 text-base font-medium text-slate-700 focus:border-blue-500 focus:bg-blue-50/10 transition-all outline-none shadow-xl shadow-slate-200/50 placeholder:text-slate-300 placeholder:italic placeholder:font-bold placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                                            placeholder="Authorized input required..."
                                            onChange={(e) => handleShortAnswerChange(i, e.target.value)}
                                        />
                                        <div className="absolute bottom-6 right-8 text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                            <Activity className="w-3 h-3 opacity-30" /> Input Verified
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Section>
                    )}

                    {/* MCQ Section */}
                    {questions.mcq?.length > 0 && (
                        <Section
                            title="Multiple Choice"
                            description="Isolate the optimal compliance vector from available paths."
                            icon={<ShieldCheck className="w-6 h-6 text-emerald-600" />}
                        >
                            {questions.mcq.map((q: any, i: number) => (
                                <div key={i} className="mb-16 last:mb-0 animate-in fade-in slide-in-from-bottom-6" style={{ animationDelay: `${i * 150}ms` }}>
                                    <div className="flex items-start gap-4 mb-8">
                                        <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-blue-600 shrink-0 border border-white shadow-inner">{String(i + 1).padStart(2, '0')}</span>
                                        <p className="text-lg font-bold text-slate-800 leading-relaxed pt-1">{q.question}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {q.options?.map((option: any, optIndex: number) => (
                                            <label key={optIndex} className={`
                                                relative flex items-center gap-5 p-6 rounded-[32px] border-2 cursor-pointer transition-all duration-500 group
                                                ${answers.mcq[i] === option
                                                    ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-200 text-white'
                                                    : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50/50 hover:-translate-y-1'}
                                            `}>
                                                <input
                                                    type="radio"
                                                    name={`mcq-${i}`}
                                                    value={option}
                                                    onChange={() => handleMcqChange(i, option)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all
                                                    ${answers.mcq[i] === option ? 'border-white bg-white/20 scale-110' : 'border-slate-100 bg-slate-50 group-hover:bg-white'}
                                                `}>
                                                    <span className={`text-xs font-black ${answers.mcq[i] === option ? 'text-white' : 'text-slate-300'}`}>
                                                        {String.fromCharCode(65 + optIndex)}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 pr-6">
                                                    <span className={`text-[13px] block font-bold transition-colors leading-snug ${answers.mcq[i] === option ? 'text-white' : 'text-slate-600'}`}>
                                                        {option}
                                                    </span>
                                                </div>
                                                {answers.mcq[i] === option && (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-4 right-6 text-white/50">
                                                        <CheckCircle className="w-5 h-5" />
                                                    </motion.div>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </Section>
                    )}

                    {/* True/False Section */}
                    {questions.trueFalse?.length > 0 && (
                        <Section
                            title="Knowledge Verification"
                            description="Confirm or negate objective audit statements."
                            icon={<Brain className="w-6 h-6 text-indigo-600" />}
                        >
                            {questions.trueFalse.map((q: any, i: number) => (
                                <div key={i} className="mb-8 last:mb-0 p-10 bg-slate-50/30 rounded-[40px] border border-slate-100/50 hover:bg-white transition-all duration-500 hover:shadow-xl group" style={{ animationDelay: `${i * 150}ms` }}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                                        <div className="flex items-start gap-5 flex-1">
                                            <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-blue-600 shrink-0 border border-white shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">{String(i + 1).padStart(2, '0')}</span>
                                            <p className="text-base font-bold text-slate-800 leading-relaxed pt-1 italic">"{q.question}"</p>
                                        </div>
                                        <div className="flex gap-4 shrink-0">
                                            {[true, false].map((val) => (
                                                <label key={val.toString()} className={`
                                                    flex flex-col items-center gap-3 cursor-pointer p-6 px-10 rounded-[28px] border-2 transition-all duration-500 w-32
                                                    ${answers.trueFalse[i] === val
                                                        ? (val ? 'bg-emerald-600 border-emerald-600 shadow-2xl shadow-emerald-100 text-white' : 'bg-rose-600 border-rose-600 shadow-2xl shadow-rose-100 text-white')
                                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}
                                                `}>
                                                    <input
                                                        type="radio"
                                                        name={`tf-${i}`}
                                                        onChange={() => handleTfChange(i, val)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-10 h-10 rounded-[18px] border-2 flex items-center justify-center shrink-0 transition-all
                                                        ${answers.trueFalse[i] === val
                                                            ? 'border-white/30 bg-white/20'
                                                            : 'border-slate-100 bg-slate-50'}
                                                    `}>
                                                        <div className={`w-3 h-3 rounded-full shadow-sm transition-all ${answers.trueFalse[i] === val ? 'bg-white scale-110' : 'bg-transparent border border-slate-200'}`} />
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${answers.trueFalse[i] === val ? 'text-white' : 'text-slate-400'}`}>
                                                        {val ? 'TRUE' : 'FALSE'}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Section>
                    )}
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[36px] flex items-center gap-6 shadow-2xl shadow-rose-100/50"
                        >
                            <div className="bg-rose-600 p-4 rounded-2xl text-white shadow-xl shadow-rose-200">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600 mb-1">Integrity Violation Alert</p>
                                <p className="text-base font-bold text-rose-700 leading-snug">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="pt-10 pb-20">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full relative group"
                    >
                        <div className={`
                            absolute inset-0 bg-blue-600 blur-[30px] rounded-[32px] opacity-20 group-hover:opacity-40 transition-opacity duration-500
                            ${submitting ? 'opacity-0' : ''}
                        `} />
                        <div className={`
                            relative py-8 px-12 rounded-[32px] text-white font-black text-sm uppercase tracking-[0.4em] transition-all duration-500 shadow-2xl flex items-center justify-center gap-6 overflow-hidden active:scale-95
                            ${submitting ? 'bg-slate-800' : 'bg-slate-900 group-hover:bg-blue-600 group-hover:-translate-y-2'}
                        `}>
                            {submitting ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                    <span>Transmitting Secure Ledger...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-6 h-6 text-blue-400 group-hover:text-white" />
                                    <span>Execute Final Compliance Submission</span>
                                    <ArrowRight className="w-6 h-6 opacity-40 group-hover:translate-x-2 transition-transform" />
                                </>
                            )}
                        </div>
                    </button>
                    <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-8 italic opacity-60">
                        Authorized Assessment Entry • Policy 44-A Enforcement: ENABLED
                    </p>
                </div>
            </main>
        </div>
    );
};

const Section: React.FC<{ title: string; description: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, description, icon, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        className="bg-white rounded-[44px] shadow-2xl border border-slate-100 overflow-hidden hover:shadow-blue-500/5 hover:border-blue-100 transition-all duration-700"
    >
        <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center gap-8">
            <div className="w-16 h-16 bg-white rounded-[22px] shadow-xl shadow-slate-200/50 flex items-center justify-center border border-slate-50">
                {icon}
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{title}</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5 opacity-70 italic leading-relaxed">{description}</p>
            </div>
        </div>
        <div className="p-10 md:p-14 bg-white">
            {children}
        </div>
    </motion.div>
);

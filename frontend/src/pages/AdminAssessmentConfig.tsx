import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Save,
    Plus,
    Trash2,
    AlertCircle,
    Lock,
    CheckCircle2,
    HelpCircle,
    ArrowLeft,
    ShieldCheck,
    Activity,
    Brain,
    ClipboardList,
    Layers,
    RotateCcw
} from 'lucide-react';
import { getAssessment, createAssessment, updateAssessment, getTrainings } from '../services/api';

interface Question {
    _id?: string;
    question_text: string;
    options: string[];
    correct_answer: string;
}

export const AdminAssessmentConfig: React.FC = () => {
    const { trainingId } = useParams<{ trainingId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [assessmentId, setAssessmentId] = useState<string | null>(null);
    const [passPercentage, setPassPercentage] = useState(80);
    const [maxAttempts, setMaxAttempts] = useState(3);
    const [questions, setQuestions] = useState<Question[]>([
        { question_text: '', options: ['', '', '', ''], correct_answer: '' }
    ]);
    const [isLocked, setIsLocked] = useState(false);
    const [trainingTitle, setTrainingTitle] = useState('');

    useEffect(() => {
        if (trainingId) {
            fetchData();
        }
    }, [trainingId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get training details for title
            const trainings = await getTrainings();
            const training = trainings.find((t: any) => t._id === trainingId);
            if (training) {
                setTrainingTitle(training.title);
            }

            try {
                const data = await getAssessment(trainingId!);
                if (data) {
                    setAssessmentId(data._id);
                    setPassPercentage(data.pass_percentage);
                    setMaxAttempts(data.max_attempts);
                    setIsLocked(data.isLocked);

                    if (data.questions && data.questions.length > 0) {
                        setQuestions(data.questions);
                    }
                }
            } catch (err: any) {
                if (err.response?.status !== 404) {
                    throw err;
                }
            }
        } catch (err: any) {
            setError('System error: Failed to retrieve assessment configuration parameters.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        if (isLocked) return;
        setQuestions([...questions, { question_text: '', options: ['', '', '', ''], correct_answer: '' }]);
    };

    const removeQuestion = (index: number) => {
        if (isLocked) return;
        if (questions.length === 1) return;
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        if (isLocked) return;
        const newQuestions = [...questions];
        (newQuestions[index] as any)[field] = value;
        setQuestions(newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        if (isLocked) return;
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) return;

        if (questions.some(q => !q.question_text || q.options.some(o => !o) || !q.correct_answer)) {
            setError('Validation failure: All fields including correct answers are mandatory.');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const payload = {
                trainingId,
                pass_percentage: passPercentage,
                max_attempts: maxAttempts,
                questions
            };

            if (assessmentId) {
                await updateAssessment(assessmentId, payload);
            } else {
                await createAssessment(payload);
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Transaction failure: Could not commit configuration to registry.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Activity className="w-12 h-12 text-blue-600 animate-pulse mx-auto opacity-50" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Assessment Settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="tms-container py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin/trainings')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="tms-heading-2 text-slate-900">Assessment Settings</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate max-w-xs">{trainingTitle || 'Training Module Assessment'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm"
                                >
                                    Settings Saved
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button
                            type="submit"
                            form="assessment-form"
                            disabled={saving || isLocked}
                            className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${isLocked
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                        >
                            {saving ? (
                                <Activity className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isLocked ? 'Immutable' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="tms-container py-10 max-w-5xl">
                {isLocked && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-amber-900 text-amber-100 p-8 rounded-[32px] border border-amber-800 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                            <Lock className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 flex items-start gap-5">
                            <div className="w-14 h-14 bg-amber-800 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight">Configuration Locked</h3>
                                <p className="text-xs font-medium text-amber-200/70 mt-2 leading-relaxed uppercase tracking-wide max-w-2xl">
                                    Notice: Assessment settings become locked once users have started taking the training.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {error && (
                    <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-700 shadow-sm">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                    </div>
                )}

                <form id="assessment-form" onSubmit={handleSubmit} className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100 hover:border-blue-100 transition-all group"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[22px] flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                    <Activity className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="tms-heading-3 text-slate-900">Passing Score</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Minimum score required to pass</p>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={passPercentage}
                                    onChange={(e) => setPassPercentage(parseInt(e.target.value))}
                                    disabled={isLocked}
                                    className="tms-input pl-6 pr-14 py-5 text-3xl font-black text-slate-900 selection:bg-blue-100"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">%</span>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100 hover:border-indigo-100 transition-all group"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[22px] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                    <RotateCcw className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="tms-heading-3 text-slate-900">Retry Attempts</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Maximum attempts allowed</p>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={maxAttempts}
                                    onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                                    disabled={isLocked}
                                    className="tms-input pl-6 py-5 text-3xl font-black text-slate-900 selection:bg-indigo-100"
                                />
                                <HelpCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-200" />
                            </div>
                        </motion.div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="tms-heading-2 text-slate-900">Assessment Questions</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{questions.length} ACTIVE QUESTIONS</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addQuestion}
                                disabled={isLocked}
                                className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4 text-blue-500" />
                                Add Question
                            </button>
                        </div>

                        <div className="space-y-6">
                            {questions.map((q, qIndex) => (
                                <motion.div
                                    key={qIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden group hover:border-blue-100 transition-all duration-500"
                                >
                                    <div className="px-10 py-6 bg-slate-50/50 flex justify-between items-center border-b border-slate-50 relative">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] bg-white px-4 py-1.5 rounded-full border border-blue-50 shadow-sm">Question {String(qIndex + 1).padStart(2, '0')}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(qIndex)}
                                            disabled={isLocked || questions.length === 1}
                                            className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-0"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-10 space-y-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Question Input</label>
                                            <textarea
                                                value={q.question_text}
                                                onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                                                disabled={isLocked}
                                                placeholder="Enter the question text..."
                                                className="tms-input min-h-[100px] text-lg font-bold selection:bg-blue-50 py-6 px-8 leading-relaxed rounded-[24px]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex} className="space-y-2 group/opt">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-50">
                                                        Option {String.fromCharCode(65 + oIndex)}
                                                    </label>
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                                            disabled={isLocked}
                                                            placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                                            className={`flex-1 tms-input py-4 px-6 font-bold transition-all ${q.correct_answer === opt && opt ? 'ring-2 ring-emerald-500/20 border-emerald-500 bg-emerald-50/10' : ''}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuestion(qIndex, 'correct_answer', opt)}
                                                            disabled={isLocked || !opt}
                                                            className={`flex-shrink-0 w-12 h-12 rounded-[18px] border-2 flex items-center justify-center transition-all duration-500 ${q.correct_answer === opt && opt
                                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-100 scale-110'
                                                                : 'bg-white border-slate-100 text-slate-200 hover:border-blue-200 hover:text-blue-500'
                                                                }`}
                                                            title="Set Correct Answer"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5 stroke-[3]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <AnimatePresence>
                                            {q.correct_answer && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="pt-6 border-t border-slate-50 flex items-center gap-4"
                                                >
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correct Answer:</span>
                                                    <span className="px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-emerald-100 uppercase tracking-widest">
                                                        {q.correct_answer}
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Award,
    Calendar,
    AlertTriangle,
    ArrowLeft,
    ShieldCheck,
    Clock,
    ArrowRight,
    Search,
    Download,
    Filter,
    Activity,
    CheckCircle2,
    Shield,
    RotateCcw,
    SearchX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTrainingHistory } from '../services/api';

interface HistoryRecord {
    _id: string;
    trainingTitle: string;
    trainingCode: string;
    trainingMaster?: any;
    training?: any;
    status: string;
    assessmentAttempts: number;
    score: number;
    passed: boolean;
    completedDate?: string;
    assignedDate?: string;
    dueDate?: string;
    lastActivity?: string;
    completedLate?: boolean;
}

export const HistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await getTrainingHistory();
            setHistory(data);
        } catch (err: any) {
            console.error('Failed to fetch history:', err);
            setError('Failed to load training history.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/20';
            case 'FAILED': return 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100/20';
            case 'OVERDUE': return 'text-rose-700 bg-rose-50 border-rose-200 shadow-rose-200/20';
            case 'LOCKED': return 'text-slate-600 bg-slate-50 border-slate-100 shadow-slate-100/20';
            default: return 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100/20';
        }
    };

    const filteredHistory = history.filter(record =>
        record.trainingTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.trainingCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <Activity className="w-16 h-16 text-blue-600 animate-pulse mx-auto opacity-30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Clock className="w-8 h-8 text-blue-400 animate-spin" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Loading Training Records</p>
                        <p className="text-slate-400 font-medium uppercase tracking-widest text-[8px] mt-2">Connecting to secure data nodes...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="tms-container py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="tms-heading-2 text-slate-900 leading-tight">Training History</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Verified Training Record Ledger</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Identity Verified</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="tms-container py-12 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-14">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            Total Cumulative Records: {history.length}
                        </div>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">Corporate Training <br />Official Registry</h2>
                        <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed max-w-2xl opacity-80">
                            This ledger provides a complete record of all completed training modules, scores, and completion dates. All records are verified for corporate audit requirements.
                        </p>
                    </div>
                    <div className="lg:col-span-4 flex flex-col justify-end">
                        <div className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-2xl flex items-center justify-between group hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Status</p>
                                <p className="text-2xl font-black text-slate-900 mt-1">Authorized</p>
                            </div>
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                <Shield className="w-7 h-7" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="md:col-span-3">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by training title or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[28px] text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all selection:bg-blue-50 placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <button className="w-full p-5 bg-white border border-slate-200 rounded-[24px] text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95">
                            <Filter className="w-4 h-4 text-blue-500" />
                            Refine Results
                        </button>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-[32px] flex items-center gap-5 text-rose-700 shadow-xl shadow-rose-100/50"
                    >
                        <div className="bg-rose-600 p-3 rounded-2xl text-white shadow-lg">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1">System Error</p>
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[44px] shadow-2xl border border-slate-100 overflow-hidden"
                >
                    <div className="tms-table-container min-h-[500px]">
                        <table className="tms-table">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="tms-table-th py-6 pl-10">Training Module</th>
                                    <th className="tms-table-th py-6">Status</th>
                                    <th className="tms-table-th py-6 text-center">Attempts</th>
                                    <th className="tms-table-th py-6 text-center">Score</th>
                                    <th className="tms-table-th py-6 text-center">Date</th>
                                    <th className="tms-table-th py-6 pr-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-48 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30">
                                                <div className="w-24 h-24 bg-slate-100 rounded-[44px] flex items-center justify-center border-4 border-dashed border-slate-200">
                                                    <SearchX className="w-12 h-12 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No History Found</h3>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Start a training to populate your history.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistory.map((record, idx) => (
                                        <tr key={record._id} className="tms-table-row group hover:bg-slate-50/50 transition-colors" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <td className="tms-table-td pl-10 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-sm ${record.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-12' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div className="min-w-0 pr-4">
                                                        <p className="text-xs font-black text-slate-900 truncate max-w-[240px] uppercase tracking-tighter">
                                                            {record.trainingTitle || 'General Training'}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                                                            <span className="text-[9px] font-mono text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/50 font-black tracking-widest uppercase">
                                                                {record.trainingCode || 'SYS-ID-NULL'}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-300 uppercase italic opacity-60">Verified Record</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="tms-table-td py-6">
                                                <div className={`
                                                    inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest shadow-sm
                                                    ${getStatusStyle(record.status)}
                                                `}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                    {record.status}
                                                </div>
                                            </td>
                                            <td className="tms-table-td py-6 text-center">
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <span className="text-sm font-black text-slate-900">{record.assessmentAttempts}</span>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3].map(dot => (
                                                            <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot <= record.assessmentAttempts ? 'bg-blue-500' : 'bg-slate-200'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="tms-table-td py-6 text-center">
                                                {record.status === 'COMPLETED' || record.status === 'FAILED' ? (
                                                    <div className="inline-flex flex-col items-center gap-2">
                                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-xl transition-all duration-500 ${record.passed ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-100' : 'bg-rose-600 text-white border-rose-600 shadow-rose-100 animate-pulse'}`}>
                                                            {record.passed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                                            <span className="text-xs font-black">{record.score}%</span>
                                                        </div>
                                                        {record.completedLate && (
                                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-500 text-[8px] font-black rounded-[8px] border border-rose-100 uppercase tracking-widest shadow-inner">
                                                                <Clock className="w-2.5 h-2.5" /> Completed Late
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1.5 opacity-20">
                                                        <Activity className="w-4 h-4 text-slate-300 animate-spin" style={{ animationDuration: '3s' }} />
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">In Progress</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="tms-table-td py-6 text-center">
                                                <div className="inline-flex flex-col items-center gap-1.5">
                                                    <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-700 tracking-tighter shadow-inner">
                                                        {record.completedDate ? new Date(record.completedDate).toLocaleDateString() : (record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3 text-slate-300" />
                                                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${record.completedDate ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                            {record.completedDate ? 'Completed' : 'Due Date'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="tms-table-td pr-10 py-6 text-right">
                                                <button className="w-10 h-10 bg-slate-50 border border-slate-100 text-slate-300 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm group/btn active:scale-90">
                                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-8 bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />
                        <div className="relative z-10 flex items-center gap-10">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Training History: Secure</span>
                            </div>
                            <div className="h-6 w-px bg-slate-800" />
                            <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-emerald-500 opacity-60" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic font-mono">
                                    Secure Connection Active
                                </span>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono italic">TMS-EV-9.4A</span>
                        </div>
                    </div>
                </motion.div>

                <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {[
                        { title: 'Training Certificates', description: 'Access and download your official certificates for completed modules.', icon: Award, color: 'emerald' },
                        { title: 'Report Export', description: 'Download your training records for performance reviews or records.', icon: Download, color: 'blue' },
                        { title: 'Retraining Options', description: 'Request access to retake modules or update expired certifications.', icon: RotateCcw, color: 'indigo' },
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl group hover:border-blue-200 hover:-translate-y-2 transition-all duration-500">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-colors duration-500
                                ${card.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : ''}
                                ${card.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : ''}
                                ${card.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : ''}
                             `}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-3">{card.title}</h3>
                            <p className="text-sm font-bold text-slate-600 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                {card.description}
                            </p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

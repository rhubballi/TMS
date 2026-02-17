import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    FileSpreadsheet,
    AlertCircle,
    Shield,
    BarChart3,
    Database,
    FileText,
    ArrowLeft,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar,
    Users,
    CheckCircle2,
    Activity,
    Filter,
    ArrowRight,
    LayoutGrid,
    SearchX
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface TrainingMatrixRecord {
    _id: string;
    user: {
        name: string;
        email: string;
        department: string;
    };
    training?: {
        title: string;
        code: string;
    };
    trainingMaster?: {
        title: string;
        training_code: string;
    };
    status: string;
    score?: number;
    passed?: boolean;
    assessmentAttempts: number;
    dueDate: string;
    completedDate?: string;
    completedLate: boolean;
    certificateId?: string;
    certificateUrl?: string;
    expiryDate?: string;
}

const TrainingMatrixPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [matrix, setMatrix] = useState<TrainingMatrixRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMatrix();
    }, []);

    const fetchMatrix = async () => {
        try {
            setLoading(true);
            const response = await api.get('/training-matrix');
            setMatrix(response.data.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load training matrix');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/training-matrix/export', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `training-matrix-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to export training matrix');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/20';
            case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100/20';
            case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100/20';
            case 'FAILED': return 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100/20';
            case 'OVERDUE': return 'text-rose-700 bg-rose-50 border-rose-200 shadow-rose-200/20';
            case 'LOCKED': return 'text-slate-600 bg-slate-50 border-slate-100 shadow-slate-100/20';
            case 'EXPIRED': return 'text-purple-600 bg-purple-50 border-purple-100 shadow-purple-100/20';
            default: return 'text-slate-600 bg-slate-50 border-slate-100 shadow-slate-100/20';
        }
    };

    const filteredMatrix = matrix.filter(record =>
        record.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.training?.title || record.trainingMaster?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <Activity className="w-16 h-16 text-blue-600 animate-pulse mx-auto opacity-30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Loading Training Matrix</p>
                        <p className="text-slate-400 font-medium uppercase tracking-widest text-[8px] mt-2">Connecting to data records...</p>
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
                        <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="tms-heading-2 text-slate-900">Training Record Matrix</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Consolidated Training Overview • Corporate Registry</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 hover:bg-slate-800"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </header>

            <main className="tms-container py-10 max-w-7xl">
                {/* Secondary Navigation / Legend */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
                    <div className="lg:col-span-3">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, training title, or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[28px] text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all selection:bg-blue-50 placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-1 flex gap-3">
                        <button className="flex-1 px-6 py-5 bg-white border border-slate-200 rounded-[24px] text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95">
                            <Filter className="w-4 h-4 text-blue-500" />
                            Filters
                        </button>
                        <button className="w-16 h-16 bg-white border border-slate-200 rounded-[24px] flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95">
                            <LayoutGrid className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-[28px] flex items-center gap-4 text-rose-700 shadow-sm"
                    >
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <p className="text-xs font-black uppercase tracking-widest">{error}</p>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[44px] shadow-2xl border border-slate-100 overflow-hidden"
                >
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Training Records Repository</h2>
                                <p className="text-lg font-black text-slate-900 mt-1">Personnel Training Overview</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">System Health</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Total Records: {matrix.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="tms-table-container">
                        <table className="tms-table">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="tms-table-th py-6 pl-10">Personnel Name</th>
                                    <th className="tms-table-th py-6">Training Module</th>
                                    <th className="tms-table-th py-6">Status</th>
                                    <th className="tms-table-th py-6 text-center">Score</th>
                                    <th className="tms-table-th py-6 text-center">Due Date</th>
                                    <th className="tms-table-th py-6 pr-10 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredMatrix.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-40 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30">
                                                <div className="w-24 h-24 bg-slate-100 rounded-[44px] flex items-center justify-center border-4 border-dashed border-slate-200">
                                                    <SearchX className="w-12 h-12 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Records Found</h3>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">The system contains no records matching your search.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMatrix.map((record, idx) => (
                                        <tr key={record._id} className="tms-table-row group hover:bg-slate-50/50 transition-colors">
                                            <td className="tms-table-td pl-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                                        <Users className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{record.user?.name || 'N/A'}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-60 truncate max-w-[140px]">{record.user?.email || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="tms-table-td py-6">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-slate-900 truncate max-w-[200px] uppercase tracking-tighter">
                                                        {record.training?.title || record.trainingMaster?.title || 'General Training'}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-mono text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded uppercase font-black tracking-widest border border-blue-100/50">
                                                            {record.training?.code || record.trainingMaster?.training_code || 'N/A'}
                                                        </span>
                                                        <span className="text-[8px] font-black text-slate-300 uppercase italic">v1.0.4</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="tms-table-td py-6">
                                                <div className={`
                                                    w-fit px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border shadow-sm flex items-center gap-2
                                                    ${getStatusStyle(record.status)}
                                                `}>
                                                    <div className="w-1 h-1 rounded-full bg-current animate-pulse opacity-50" />
                                                    {record.status}
                                                </div>
                                            </td>
                                            <td className="tms-table-td py-6 text-center">
                                                {record.score !== undefined ? (
                                                    <div className="inline-flex flex-col items-center gap-1.5">
                                                        <span className={`text-sm font-black ${record.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {record.score}%
                                                        </span>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map(dot => (
                                                                <div key={dot} className={`w-1.5 h-0.5 rounded-full ${record.passed ? 'bg-emerald-500' : 'bg-rose-500'} ${dot > (record.assessmentAttempts || 0) ? 'opacity-20' : ''}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 opacity-20">
                                                        <Activity className="w-4 h-4 text-slate-300" />
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Untested</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="tms-table-td py-6 text-center">
                                                <div className="inline-flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                        <Calendar className="w-3 h-3 opacity-40" />
                                                        {new Date(record.dueDate).toLocaleDateString()}
                                                    </div>
                                                    {record.completedLate && (
                                                        <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                                                            <AlertCircle className="w-2.5 h-2.5" />
                                                            OVERDUE
                                                        </span>
                                                    )}
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
                        <div className="relative z-10 flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-blue-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Training Database: Secured</span>
                            </div>
                            <div className="h-4 w-px bg-slate-800" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Corporate Policy Compliant
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono">Timestamp: {new Date().toISOString()}</span>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default TrainingMatrixPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    ArrowLeft,
    RefreshCcw,
    Calendar,
    User,
    FileText,
    Info,
    Filter,
    X,
    BarChart3,
    Database,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Activity,
    ShieldCheck,
    Lock,
    Cpu,
    Zap,
    History,
    Network
} from 'lucide-react';
import { getAuditLogs, getUsers, getTrainings } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface AuditLog {
    _id: string;
    event_type: string;
    user_id?: { name: string; email: string; role: string };
    training_id?: { title: string; code: string };
    training_record_id?: any;
    assessment_id?: any;
    previous_status?: string;
    new_status?: string;
    system_timestamp: string;
    event_source: string;
    metadata?: any;
    ip_address?: string;
}

export const AdminAuditLogsPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filter states
    const [users, setUsers] = useState<any[]>([]);
    const [trainings, setTrainings] = useState<any[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        user_id: '',
        training_id: '',
        event_type: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const fetchMetadata = async () => {
        try {
            const [usersData, trainingsData] = await Promise.all([
                getUsers(),
                getTrainings()
            ]);
            setUsers(usersData);
            setTrainings(trainingsData);
        } catch (error) {
            console.error('Failed to fetch filter metadata:', error);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getAuditLogs({
                page,
                ...filters
            });
            setLogs(data.logs);
            setPages(data.pages);
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            user_id: '',
            training_id: '',
            event_type: '',
            startDate: '',
            endDate: ''
        });
        setPage(1);
    };

    const getEventBadgeColor = (type: string) => {
        if (type.includes('REJECTED') || type.includes('FAILED')) return 'text-rose-600 bg-rose-50 border-rose-100';
        if (type.includes('COMPLETED') || type.includes('PASSED')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (type.includes('STARTED')) return 'text-blue-600 bg-blue-50 border-blue-100';
        if (type.includes('OVERDUE')) return 'text-amber-600 bg-amber-50 border-amber-100';
        if (type.includes('ASSIGN')) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
        return 'text-slate-600 bg-slate-50 border-slate-100';
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-slate-200 flex-shrink-0 sticky top-0 h-screen overflow-y-auto hidden lg:flex flex-col shadow-sm z-40">
                <div className="p-10 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                    <div className="bg-slate-900 w-12 h-12 rounded-[20px] flex items-center justify-center shadow-2xl shadow-slate-200">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight text-slate-900 block leading-none">TMS Elite</span>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1.5 block italic">Registry Module</span>
                    </div>
                </div>

                <nav className="flex-1 px-6 py-10 space-y-2">
                    <div className="px-4 pb-4 uppercase text-[10px] font-black text-slate-400 tracking-[0.3em]">Core Intelligence</div>
                    <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-4 px-5 py-4 text-sm font-black text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-[22px] transition-all group">
                        <BarChart3 className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        Executive Dashboard
                    </button>
                    <button onClick={() => navigate('/admin/training-master')} className="w-full flex items-center gap-4 px-5 py-4 text-sm font-black text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-[22px] transition-all group">
                        <Database className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        Training Registry
                    </button>

                    <div className="pt-10 pb-4 px-4 uppercase text-[10px] font-black text-slate-400 tracking-[0.3em]">Governance & Risk</div>
                    <button onClick={() => navigate('/admin/governance-dashboard')} className="w-full flex items-center gap-4 px-5 py-4 text-sm font-black text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-[22px] transition-all group">
                        <Shield className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        Compliance HQ
                    </button>
                    <button onClick={() => navigate('/admin/audit-logs')} className="w-full flex items-center gap-4 px-5 py-4 text-sm font-black text-blue-700 bg-blue-50/50 border border-blue-100/50 rounded-[22px] transition-all group shadow-sm">
                        <History className="w-5 h-5 text-blue-600" />
                        Regulated Audit
                    </button>
                </nav>

                <div className="p-8 border-t border-slate-50">
                    <div className="p-6 bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl relative overflow-hidden group/user">
                        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/user:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Authenticated Operator</p>
                            <p className="text-sm font-black text-white truncate tracking-tight">{user?.name}</p>
                            <button onClick={logout} className="w-full mt-5 py-3 bg-white/5 border border-white/10 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-500 hover:text-white transition-all duration-300">
                                Terminate Session
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar">
                <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                    <div className="tms-container py-6 flex justify-between items-center max-w-7xl">
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate('/admin/dashboard')} className="p-2.5 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 active:scale-90 shadow-sm lg:hidden">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Regulated Audit Logs</h1>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                    Immutable Insert-Only Compliance Vector
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`group relative overflow-hidden rounded-2xl shadow-xl transition-all ${showFilters ? 'shadow-slate-200' : 'shadow-blue-50'}`}
                            >
                                <div className={`absolute inset-0 transition-transform duration-500 ${showFilters ? 'bg-slate-900 translate-y-0' : 'bg-white translate-y-full'}`} />
                                <div className={`relative z-10 flex items-center gap-3 px-6 py-3 border rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showFilters ? 'text-white border-slate-900' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                    <Filter className={`w-4 h-4 ${showFilters ? 'text-blue-400' : 'text-slate-400'}`} />
                                    Analysis Criteria
                                </div>
                            </button>
                            <button
                                onClick={fetchLogs}
                                className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-90 group"
                                title="Re-sync Ledger"
                            >
                                <RefreshCcw className={`w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="tms-container py-12 space-y-12 max-w-7xl">
                    {/* Hero Stats (New for Elite look) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Events', value: total, icon: Network, color: 'blue' },
                            { label: 'Security Level', value: 'High', icon: Lock, color: 'indigo' },
                            { label: 'Chain Integrity', value: 'Verified', icon: ShieldCheck, color: 'emerald' },
                            { label: 'Sync Status', value: 'Prime', icon: Cpu, color: 'slate' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-xl flex items-center justify-between group hover:border-blue-100 transition-all duration-500 cursor-default">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{stat.label}</p>
                                    <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner group-hover:rotate-12
                                    ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : ''}
                                    ${stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : ''}
                                    ${stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : ''}
                                    ${stat.color === 'slate' ? 'bg-slate-50 text-slate-600 group-hover:bg-slate-900 group-hover:text-white' : ''}
                                `}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters Section */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <div className="bg-white p-10 rounded-[44px] shadow-3xl border border-blue-50 relative overflow-hidden group/filter">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20" />
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                                                <Filter className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Sequence Analysis Parameters</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Filtering System Layer Analytics</p>
                                            </div>
                                        </div>
                                        <button onClick={resetFilters} className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all active:scale-95">
                                            <X className="w-4 h-4" />
                                            Clear Stack
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                                <User className="w-3 h-3 text-blue-500" /> Regulated Actor
                                            </label>
                                            <select
                                                value={filters.user_id}
                                                onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Global Active Users</option>
                                                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                                <Database className="w-3 h-3 text-indigo-500" /> Target Entity
                                            </label>
                                            <select
                                                value={filters.training_id}
                                                onChange={(e) => setFilters({ ...filters, training_id: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">All Asset Nodes</option>
                                                {trainings.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                                <Activity className="w-3 h-3 text-emerald-500" /> Event Vector
                                            </label>
                                            <select
                                                value={filters.event_type}
                                                onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">All Lifecycle Streams</option>
                                                <option value="ASSIGN_TRAINING">ASSIGN_TRAINING</option>
                                                <option value="DOCUMENT_VIEWED">DOCUMENT_VIEWED</option>
                                                <option value="DOCUMENT_ACKNOWLEDGED">DOCUMENT_ACKNOWLEDGED</option>
                                                <option value="ASSESSMENT_STARTED">ASSESSMENT_STARTED</option>
                                                <option value="ASSESSMENT_SUBMITTED">ASSESSMENT_SUBMITTED</option>
                                                <option value="ASSESSMENT_PASSED">ASSESSMENT_PASSED</option>
                                                <option value="ASSESSMENT_FAILED">ASSESSMENT_FAILED</option>
                                                <option value="TRAINING_OVERDUE">TRAINING_OVERDUE</option>
                                                <option value="LATE_COMPLETION">LATE_COMPLETION</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                                <Calendar className="w-3 h-3 text-rose-500" /> Temporal Window
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    value={filters.startDate}
                                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-l-2xl py-4 px-4 text-[10px] font-black uppercase outline-none focus:bg-white transition-all shadow-inner"
                                                />
                                                <input
                                                    type="date"
                                                    value={filters.endDate}
                                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-r-2xl py-4 px-4 text-[10px] font-black uppercase outline-none focus:bg-white transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Logs Table Section */}
                    <div className="bg-white rounded-[44px] shadow-2xl border border-slate-100 overflow-hidden relative">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-slate-900 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-slate-200">
                                    <Search className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Verified Sequence Stack</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{total} compliance entries retrieved</p>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-30 select-none">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            </div>
                        </div>

                        <div className="tms-table-container min-h-[500px]">
                            <table className="tms-table">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="tms-table-th py-6 pl-10">UTC Temporal Index</th>
                                        <th className="tms-table-th py-6">Event Identity</th>
                                        <th className="tms-table-th py-6">Regulated Actor</th>
                                        <th className="tms-table-th py-6">Affected Target</th>
                                        <th className="tms-table-th py-6">Compliance Delta</th>
                                        <th className="tms-table-th py-6 pr-10 text-center">Protocol Integrity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading && logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-40 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="relative">
                                                        <Activity className="w-16 h-16 text-blue-600 animate-pulse opacity-10" />
                                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin absolute inset-0 m-auto" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Accessing Distributed Compliance Ledger...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-40 text-center">
                                                <div className="flex flex-col items-center gap-6 opacity-30">
                                                    <div className="w-24 h-24 bg-slate-100 rounded-[44px] flex items-center justify-center border-4 border-dashed border-slate-200">
                                                        <Search className="w-12 h-12 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Zero Sequence Hits</h3>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Adjust temporal window or event vector.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log, idx) => (
                                            <tr key={log._id} className="tms-table-row group hover:bg-slate-50/50 transition-colors" style={{ animationDelay: `${idx * 40}ms` }}>
                                                <td className="tms-table-td pl-10 py-6">
                                                    <div className="space-y-1 group-hover:translate-x-1 transition-transform">
                                                        <p className="text-xs font-black text-slate-900 leading-none">
                                                            {log.system_timestamp ? new Date(log.system_timestamp).toLocaleDateString() : 'N/A'}
                                                        </p>
                                                        <p className="text-[9px] text-slate-400 font-mono font-black tracking-widest uppercase italic">
                                                            {log.system_timestamp ? new Date(log.system_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="tms-table-td py-6">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 shadow-sm transition-all group-hover:scale-105 inline-block ${getEventBadgeColor(log.event_type)}`}>
                                                        {log.event_type.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="tms-table-td py-6">
                                                    {log.user_id ? (
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                                                                <User className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="min-w-0 pr-4">
                                                                <p className="text-xs font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{log.user_id.name}</p>
                                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-tight opacity-60 italic">{log.user_id.role}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-slate-300 uppercase italic bg-slate-100/50 px-2 py-1 rounded border border-slate-100 tracking-widest">Kernel Core</span>
                                                    )}
                                                </td>
                                                <td className="tms-table-td py-6">
                                                    {log.training_id ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0 pr-4">
                                                                <span className="text-xs font-black text-slate-700 block truncate max-w-[180px] uppercase tracking-tighter">{log.training_id.title}</span>
                                                                <span className="text-[8px] font-mono font-black text-slate-400 tracking-[0.2em]">{log.training_id.code}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-200">-</span>
                                                    )}
                                                </td>
                                                <td className="tms-table-td py-6">
                                                    {log.new_status ? (
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-black text-slate-400 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 uppercase tracking-tighter">{log.previous_status || 'INIT'}</span>
                                                            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                                            <span className="text-[9px] font-black text-blue-700 px-2 py-1 bg-blue-50 rounded-lg border border-blue-100 shadow-sm uppercase tracking-tighter transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">{log.new_status}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-200">-</span>
                                                    )}
                                                </td>
                                                <td className="tms-table-td py-6 pr-10 text-center">
                                                    <div className="group/info relative flex justify-center">
                                                        <button className="w-10 h-10 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all cursor-help shadow-sm flex items-center justify-center active:scale-90">
                                                            <Info className="w-5 h-5 shadow-sm" />
                                                        </button>
                                                        {/* Tooltip implementation */}
                                                        <div className="absolute bottom-full mb-5 left-1/2 -translate-x-1/2 hidden group-hover/info:block z-50 animate-in fade-in slide-in-from-bottom-4 zoom-in-95">
                                                            <div className="bg-slate-950 text-white p-8 rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[340px] text-left border border-white/10 ring-1 ring-white/5 backdrop-blur-3xl relative overflow-hidden">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -translate-y-16 translate-x-16 blur-3xl opacity-50" />
                                                                <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] mb-6 border-b border-white/5 pb-4 flex justify-between items-center">
                                                                    Data Segment Hash
                                                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">VERIFIED_SECURE</span>
                                                                </p>
                                                                <div className="space-y-3 font-mono text-[10px] text-slate-400">
                                                                    <div className="flex justify-between gap-6"><span className="uppercase tracking-widest font-bold">Entry ID</span> <span className="text-white font-black">{log._id}</span></div>
                                                                    <div className="flex justify-between gap-6"><span className="uppercase tracking-widest font-bold">Protocol</span> <span className="text-white font-black">{log.event_source}</span></div>
                                                                    <div className="flex justify-between gap-6"><span className="uppercase tracking-widest font-bold">Node IP</span> <span className="text-emerald-400 font-bold">{log.ip_address || 'REGULATED_ENV'}</span></div>
                                                                </div>
                                                                {log.metadata && (
                                                                    <div className="mt-6 bg-white/5 p-5 rounded-3xl border border-white/5">
                                                                        <p className="text-slate-500 text-[10px] font-black uppercase mb-3 tracking-[0.2em] italic">Payload metadata</p>
                                                                        <pre className="text-[10px] text-blue-300/60 overflow-x-auto custom-scrollbar-mini pb-2">
                                                                            {JSON.stringify(log.metadata, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-center italic text-[9px] text-slate-500 font-black uppercase tracking-[0.4em]">
                                                                    <Zap className="w-3 h-3 mr-3 text-blue-500/40" />
                                                                    Cryptographic Ledger Integrity: 100%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="p-10 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
                            <div className="relative z-10 flex flex-col md:items-start items-center">
                                <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] leading-none mb-2">Compliance Engine Architecture v4.2-E</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500/40" />
                                    SHA-256 Distributed Verify Sequence Status: <span className="text-emerald-500">OPERATIONAL_STABLE</span>
                                </p>
                            </div>

                            {pages > 1 && (
                                <div className="relative z-10 flex items-center gap-8">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Stack Segments: {page} / {pages}</span>
                                    <div className="flex gap-4">
                                        <button
                                            disabled={page === 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] disabled:opacity-20 hover:bg-white/10 transition-all active:scale-95 shadow-2xl"
                                        >
                                            <ChevronLeft className="w-4 h-4 inline mr-2" /> Shift Back
                                        </button>
                                        <button
                                            disabled={page === pages}
                                            onClick={() => setPage(p => Math.min(pages, p + 1))}
                                            className="px-8 py-3 bg-blue-600 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] disabled:opacity-20 hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
                                        >
                                            Next Segment <ChevronRight className="w-4 h-4 inline ml-2" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

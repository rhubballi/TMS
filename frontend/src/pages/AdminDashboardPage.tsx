import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    Loader2,
    Sparkles,
    Users,
    CheckSquare,
    RefreshCcw,
    Building,
    Database,
    Eye,
    Shield,
    BarChart3,
    BookOpen,
    Play,
    Activity,
    ChevronRight,
    ArrowUpRight,
    PieChart,
    ShieldCheck,
    CloudUpload,
    Clock,
    Filter,
    Search,
    ChevronDown,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { uploadDocument, getAllTrainingRecords } from '../services/api';

interface TrainingRecord {
    _id: string;
    user: { _id: string; name: string; email: string; department?: string };
    training?: { _id: string; title: string; code: string; version?: string };
    trainingMaster?: { _id: string; title: string; training_code: string };
    status: string;
    score?: number;
    assignedDate: string;
    dueDate: string;
    assessmentAttempts: number;
}

export const AdminDashboardPage: React.FC = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    // Upload State
    const [file, setFile] = useState<File | null>(null);
    const [assignmentMode, setAssignmentMode] = useState<'ALL' | 'DEPARTMENT'>('ALL');
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');

    // Dashboard State
    const [records, setRecords] = useState<TrainingRecord[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0, failed: 0 });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoadingData(true);
        try {
            const recordsData = await getAllTrainingRecords();
            setRecords(recordsData);

            setStats({
                total: recordsData.length,
                completed: recordsData.filter((r: TrainingRecord) => r.status === 'COMPLETED').length,
                pending: recordsData.filter((r: TrainingRecord) => r.status === 'PENDING').length,
                overdue: recordsData.filter((r: TrainingRecord) => {
                    const isOverdue = new Date(r.dueDate) < new Date() && r.status !== 'COMPLETED';
                    return isOverdue || r.status === 'EXPIRED';
                }).length,
                failed: recordsData.filter((r: TrainingRecord) => r.status === 'FAILED').length
            });

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadError('');
            setUploadSuccess('');
        }
    };

    const handleDepartmentToggle = (dept: string) => {
        setSelectedDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
    };

    const DEPARTMENTS = [
        'R&D', 'Clinical Research/Affairs', 'Manufacturing', 'Quality Assurance', 'Quality Control',
        'Regulatory Affairs', 'Pharmacovigilance', 'Supply Chain & Logistics', 'Engineering',
        'Sales & Marketing', 'HR', 'Finance', 'IT', 'Legal', 'Other'
    ];

    const handleUpload = async () => {
        if (!file || !dueDate) return;
        if (assignmentMode === 'DEPARTMENT' && selectedDepartments.length === 0) {
            setUploadError('Select at least one department');
            return;
        }
        setUploading(true);
        setUploadError('');
        setUploadSuccess('');
        try {
            const assignedRef = 'ALL';
            const departments = assignmentMode === 'DEPARTMENT' ? selectedDepartments : undefined;

            await uploadDocument(file, assignedRef, dueDate, departments);

            let successMsg = `Successfully uploaded ${file.name}`;
            if (assignmentMode === 'ALL') successMsg += ' and assigned to All Staff';
            else if (assignmentMode === 'DEPARTMENT') successMsg += ` and assigned to ${selectedDepartments.length} departments`;

            setUploadSuccess(successMsg);
            setFile(null);
            setSelectedDepartments([]);
            setDueDate('');
            fetchDashboardData();
        } catch (err: any) {
            setUploadError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const groupedCompliance = records.reduce((acc: any, record: any) => {
        const trainingId = record.trainingMaster?._id || record.training?._id;
        if (!trainingId) return acc;

        const department = record.user?.department || 'Unassigned';
        const key = `${trainingId}-${department}`;

        if (!acc[key]) {
            acc[key] = {
                trainingId,
                title: record.trainingMaster?.title || record.training?.title || 'Unknown',
                code: record.trainingMaster?.training_code || record.training?.code || 'N/A',
                version: record.training?.version || '1.0',
                department,
                total: 0,
                completed: 0,
                failed: 0,
                avgScore: 0,
                totalScore: 0,
                dueDate: record.dueDate
            };
        }

        acc[key].total += 1;
        if (record.status === 'COMPLETED') {
            acc[key].completed += 1;
            acc[key].totalScore += (record.score || 0);
        } else if (record.status === 'FAILED' || record.status === 'LOCKED') {
            acc[key].failed += 1;
        }
        acc[key].avgScore = acc[key].completed > 0 ? Math.round(acc[key].totalScore / acc[key].completed) : 0;

        return acc;
    }, {});

    const complianceRows = Object.values(groupedCompliance);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-200 flex-shrink-0 sticky top-0 h-screen overflow-y-auto hidden md:flex flex-col shadow-sm z-40">
                <div className="p-8 border-b border-slate-100 flex items-center gap-4">
                    <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">TMS Admin</span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Control Center</p>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-8">
                    {/* Group 1: Executive Overview */}
                    <div className="space-y-2">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Executive</div>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${window.location.pathname === '/admin/dashboard'
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <BarChart3 className="w-5 h-5" />
                            Overiew
                        </button>
                        <button
                            onClick={() => navigate('/admin/governance-dashboard')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            Governance
                        </button>
                    </div>

                    {/* Group 2: Management */}
                    <div className="space-y-2">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Management</div>
                        <button
                            onClick={() => navigate('/admin/trainings')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <BookOpen className="w-5 h-5" />
                            Trainings
                        </button>
                        <button
                            onClick={() => navigate('/admin/training-master')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <Database className="w-5 h-5" />
                            Training Registry
                        </button>
                        <button
                            onClick={() => navigate('/admin/assignments')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <Users className="w-5 h-5" />
                            Assignments
                        </button>
                    </div>

                    {/* Group 3: Operations */}
                    <div className="space-y-2">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Operations</div>
                        <button
                            onClick={() => navigate('/admin/audit-logs')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <FileText className="w-5 h-5" />
                            Audit Logs
                        </button>
                        <button
                            onClick={() => navigate('/admin/upload')}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <CloudUpload className="w-5 h-5" />
                            Instant Launch
                        </button>
                    </div>
                </nav>

                <div className="p-6 border-t border-slate-100">
                    <div className="p-4 bg-slate-900 rounded-2xl relative overflow-hidden group">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Administrator</p>
                        <p className="text-sm font-bold text-white truncate mb-4">{user?.name}</p>
                        <button onClick={logout} className="w-full py-2 bg-white/10 hover:bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all">
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                    <div className="tms-container py-5 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Admin Dashboard</h1>
                                    <p className="text-sm text-slate-500 mt-2">Executive Overview & Compliance Summary</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex items-center gap-3 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-200"></div>
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Core Engine Active</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="tms-container py-10 space-y-10">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Total Records', value: stats.total, color: 'blue', icon: Database, trend: '+4% from baseline' },
                            { label: 'Compliant Assets', value: stats.completed, color: 'emerald', icon: ShieldCheck, trend: 'Optimal Velocity' },
                            { label: 'Pending Action', value: stats.pending, color: 'amber', icon: Clock, trend: 'Awaiting Input' },
                            { label: 'Risk Indices', value: stats.overdue + stats.failed, color: 'rose', icon: AlertCircle, trend: 'Attention Required' },
                        ].map((stat, idx) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 relative group overflow-hidden border-b-4 ${stat.color === 'blue' ? 'border-b-blue-500' : ''} ${stat.color === 'emerald' ? 'border-b-emerald-500' : ''} ${stat.color === 'amber' ? 'border-b-amber-500' : ''} ${stat.color === 'rose' ? 'border-b-rose-500' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500
                                        ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : ''}
                                        ${stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : ''}
                                        ${stat.color === 'amber' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : ''}
                                        ${stat.color === 'rose' ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white' : ''}
                                    `}>
                                        <stat.icon className="w-7 h-7" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                                    <ArrowUpRight className="w-3 h-3 text-emerald-500" /> {stat.trend}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {/* Summary View Section */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col">
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold text-slate-900">Training Progress Matrix</h2>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={fetchDashboardData} className="p-2 hover:bg-slate-200 rounded-lg transition-all">
                                            <RefreshCcw className={`w-4 h-4 text-slate-500 ${loadingData ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="tms-table-container">
                                    <table className="tms-table">
                                        <thead>
                                            <tr>
                                                <th className="tms-table-th py-4">Training Module</th>
                                                <th className="tms-table-th py-4">Department</th>
                                                <th className="tms-table-th py-4">Completion Status</th>
                                                <th className="tms-table-th py-4 text-center">Avg Score</th>
                                                <th className="tms-table-th py-4 text-right">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {complianceRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                                                        No compliance data available.
                                                    </td>
                                                </tr>
                                            ) : (
                                                complianceRows.map((row: any) => (
                                                    <tr key={`${row.trainingId}-${row.department}`} className="hover:bg-slate-50 transition-colors">
                                                        <td className="tms-table-td">
                                                            <div className="font-semibold text-slate-900">{row.title}</div>
                                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{row.code}</div>
                                                        </td>
                                                        <td className="tms-table-td">
                                                            <span className="text-xs text-slate-600">{row.department}</span>
                                                        </td>
                                                        <td className="tms-table-td">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[100px]">
                                                                    <div
                                                                        className={`h-full rounded-full ${Math.round((row.completed / row.total) * 100) >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                                        style={{ width: `${(row.completed / row.total) * 100}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-700 min-w-[40px]">
                                                                    {row.completed}/{row.total}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="tms-table-td text-center font-bold text-slate-700">
                                                            {row.avgScore}%
                                                        </td>
                                                        <td className="tms-table-td text-right">
                                                            <button onClick={() => navigate(`/admin/compliance/${row.trainingId}/${encodeURIComponent(row.department)}`)} className="text-blue-600 hover:text-blue-800 font-bold text-xs">
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
};

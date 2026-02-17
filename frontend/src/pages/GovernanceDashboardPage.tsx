import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Shield,
    BarChart3,
    AlertTriangle,
    CheckCircle2,
    Clock,
    TrendingUp,
    Database,
    Users,
    FileText,
    ChevronRight,
    Loader2,
    Activity,
    ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AIGovernanceAssistant } from '../components/AIGovernanceAssistant';

/**
 * Governance Dashboard Page
 * Sprint 4: Architecture Baseline & Governance
 * STRICT READ-ONLY visualization of compliance analytics.
 */

interface DashboardMetrics {
    compliancePercentage: number;
    overduePercentage: number;
    expiredPercentage: number;
    failureRate: number;
    avgAttempts: number;
    globalRiskScore: number;
}

interface DepartmentStat {
    departmentName: string;
    compliancePercentage: number;
    riskScore: number;
}

interface HeatMapItem {
    trainingId: string;
    title: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    failureRate: number;
}

interface AnalyticsData {
    metrics: DashboardMetrics;
    breakdown: {
        byDepartment: DepartmentStat[];
    };
    riskHeatmap: HeatMapItem[];
}

const GovernanceDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/analytics/dashboard');

            if (response.data && response.data.metrics) {
                setData(response.data);
            } else {
                setError("Received invalid data structure from server.");
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message;
            setError(`Governance Access Denied: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (score: number) => {
        if (score <= 15) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (score <= 40) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-rose-600 bg-rose-50 border-rose-100';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Decrypting Governance Analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full tms-card p-8 text-center space-y-6 border-rose-200">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="tms-heading-2 text-rose-700">Access Restricted</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button onClick={fetchAnalytics} className="tms-btn-primary bg-rose-600 hover:bg-rose-700 w-full">Retry Authorization</button>
                        <button onClick={() => navigate('/admin/dashboard')} className="tms-btn-secondary w-full">Return to Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar (Consistent with Admin Dashboard) */}
            <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 sticky top-0 h-screen overflow-y-auto hidden md:flex flex-col shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="bg-slate-900 p-2 rounded-xl">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="tms-heading-3 tracking-tight">TMS Regulated</span>
                </div>

                <nav className="flex-1 p-4 space-y-1.5">
                    <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all">
                        <BarChart3 className="w-5 h-5 text-slate-400" />
                        Executive Overview
                    </button>
                    <button onClick={() => navigate('/admin/training-master')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all">
                        <Database className="w-5 h-5 text-slate-400" />
                        Training Master
                    </button>
                    <div className="pt-4 pb-2 px-4 uppercase text-[10px] font-black text-slate-400 tracking-widest">Analytics</div>
                    <button onClick={() => navigate('/admin/governance-dashboard')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl transition-all">
                        <Shield className="w-5 h-5" />
                        Governance
                    </button>
                    <button onClick={() => navigate('/admin/audit-logs')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all">
                        <FileText className="w-5 h-5 text-slate-400" />
                        Regulated Audit
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Authorized User</p>
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                        <button onClick={logout} className="w-full py-2 bg-white border border-slate-200 text-red-600 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-red-50 transition-colors shadow-sm mt-3">
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                    <div className="tms-container py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="tms-heading-2">Governance Oversight</h1>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter italic">Baseline Integrity Visualization</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Read-Only Audit</span>
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        </div>
                    </div>
                </header>

                <main className="tms-container py-8 space-y-8 overflow-y-auto">
                    {/* Top Level Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                        {[
                            { label: 'Compliance', value: `${data.metrics.compliancePercentage}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Overdue', value: `${data.metrics.overduePercentage}%`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Expired', value: `${data.metrics.expiredPercentage}%`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                            { label: 'Fail Rate', value: `${data.metrics.failureRate}%`, icon: Activity, color: 'text-rose-700', bg: 'bg-slate-50' },
                            { label: 'Attempts', value: data.metrics.avgAttempts, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Risk Score', value: data.metrics.globalRiskScore, icon: Shield, color: 'text-slate-900', bg: 'bg-slate-100' },
                        ].map((m, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="tms-card p-4 flex flex-col items-center text-center space-y-2 border-slate-200"
                            >
                                <div className={`w-10 h-10 ${m.bg} ${m.color} rounded-xl flex items-center justify-center shadow-inner`}>
                                    <m.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
                                    <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* AI Governance Assistant Section (Sprint 4) */}
                    <div className="grid grid-cols-1 gap-8">
                        <AIGovernanceAssistant />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Departmental Performance Matrix */}
                        <div className="lg:col-span-2 tms-card">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="tms-heading-3">Departmental Integrity Matrix</h3>
                                <Users className="w-5 h-5 text-slate-300" />
                            </div>
                            <div className="tms-table-container">
                                <table className="tms-table">
                                    <thead>
                                        <tr>
                                            <th className="tms-table-th">Authorized Entity</th>
                                            <th className="tms-table-th">Compliance Index</th>
                                            <th className="tms-table-th text-center">Score</th>
                                            <th className="tms-table-th text-center">Risk Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {data.breakdown.byDepartment.map((dept, idx) => (
                                            <tr key={idx} className="tms-table-row">
                                                <td className="tms-table-td font-bold text-slate-900">{dept.departmentName}</td>
                                                <td className="tms-table-td">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-1000 ${dept.compliancePercentage >= 80 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                                style={{ width: `${dept.compliancePercentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-600">{dept.compliancePercentage}%</span>
                                                    </div>
                                                </td>
                                                <td className="tms-table-td text-center font-bold text-slate-900">{dept.riskScore}</td>
                                                <td className="tms-table-td text-center">
                                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black border uppercase tracking-wider ${getRiskColor(dept.riskScore)}`}>
                                                        {dept.riskScore <= 15 ? 'Stable' : dept.riskScore <= 40 ? 'Cautious' : 'CRITICAL'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Training Heatmap & Anomalies */}
                        <div className="tms-card">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="tms-heading-3 text-rose-700">High Failure Anomalies</h3>
                                <AlertTriangle className="w-5 h-5 text-rose-400" />
                            </div>
                            <div className="divide-y divide-slate-100">
                                {data.riskHeatmap.map((item, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="min-w-0 pr-4">
                                            <div className="text-xs font-bold text-slate-900 truncate mb-1">{item.title}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-rose-600 uppercase">Fail Rate: {item.failureRate}%</span>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 px-2 py-1 rounded text-[9px] font-black uppercase ${item.riskLevel === 'HIGH' ? 'bg-rose-600 text-white shadow-sm' : 'bg-amber-100 text-amber-700'}`}>
                                            {item.riskLevel}
                                        </span>
                                    </div>
                                ))}
                                {data.riskHeatmap.length === 0 && (
                                    <div className="p-12 text-center text-slate-400 italic text-xs">
                                        No active risk anomalies detected within the perimeter.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default GovernanceDashboardPage;

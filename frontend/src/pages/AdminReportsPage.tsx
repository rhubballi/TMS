import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  Download,
  ArrowLeft,
  Search,
  Filter,
  Activity,
  ShieldCheck,
  ChevronRight,
  SearchX,
  Clock,
  CheckCircle2,
  BarChart3,
  FileBarChart,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllTrainingRecords } from '../services/api';

interface TrainingRecord {
  _id: string;
  user: {
    name: string;
    email: string;
    department?: string;
  };
  training: {
    title: string;
    code: string;
  };
  status: string;
  assignedDate: string;
  dueDate: string;
  completedDate?: string;
  score?: number;
}

export const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalRecords: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    averageScore: 0,
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await getAllTrainingRecords();
      setRecords(data);

      const completed = data.filter((r: any) => r.status === 'COMPLETED').length;
      const pending = data.filter((r: any) => r.status === 'PENDING').length;
      const overdue = data.filter((r: any) => r.status === 'OVERDUE').length;
      const scores = data.filter((r: any) => typeof r.score === 'number').map((r: any) => r.score!);
      const averageScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

      setStats({
        totalRecords: data.length,
        completed,
        pending,
        overdue,
        averageScore: Math.round(averageScore),
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'OVERDUE': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'FAILED': return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'LOCKED': return 'text-slate-600 bg-slate-50 border-slate-100';
      default: return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  const filteredRecords = records.filter(record =>
    record.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.training?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Activity className="w-12 h-12 text-blue-600 animate-pulse mx-auto opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          </div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Decompressing Analytics Ledger...</p>
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
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="tms-heading-2 text-slate-900">Training Reports</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Performance Overview & Compliance Statistics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95">
              <Download className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
      </header>

      <main className="tms-container py-10 max-w-7xl">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {[
            { label: 'Total Employees', value: stats.totalRecords, icon: Users, color: 'blue', sub: 'Total Records' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'emerald', sub: 'Training Finished' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'amber', sub: 'Action Required' },
            { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'rose', sub: 'Deadline Passed' },
            { label: 'Avg Score', value: `${stats.averageScore}%`, icon: TrendingUp, color: 'indigo', sub: 'Average Mastery' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4 group hover:border-blue-200 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner
                                ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : ''}
                                ${stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : ''}
                                ${stat.color === 'amber' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' : ''}
                                ${stat.color === 'rose' ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white' : ''}
                                ${stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : ''}
                            `}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight opacity-60 underline decoration-slate-100">{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, training, or code..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm selection:bg-blue-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 rounded-[22px] text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95">
              <Filter className="w-4 h-4 text-blue-500" />
              Refine Results
            </button>
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden"
        >
          <div className="tms-table-container">
            <table className="tms-table border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="tms-table-th py-6 pl-10">Personnel Name</th>
                  <th className="tms-table-th py-6">Training Module</th>
                  <th className="tms-table-th py-6">Status</th>
                  <th className="tms-table-th py-6 text-center">Date</th>
                  <th className="tms-table-th py-6 text-center">Score</th>
                  <th className="tms-table-th py-6 pr-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center gap-6 opacity-30">
                        <div className="w-24 h-24 bg-slate-100 rounded-[40px] flex items-center justify-center">
                          <SearchX className="w-12 h-12 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Records Found</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Modify your search to see more results</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, idx) => (
                    <tr key={record._id} className="tms-table-row hover:bg-slate-50/70 transition-colors group">
                      <td className="tms-table-td pl-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 text-xs font-black border border-white shadow-inner group-hover:scale-110 transition-transform">
                            {record.user?.name?.substring(0, 2).toUpperCase() || '??'}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{record.user?.name || 'Unknown'}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-60">{record.user?.department || 'General'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="tms-table-td py-6">
                        <div className="max-w-[280px]">
                          <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tighter">
                            {record.training?.title || 'General Training'}
                          </p>
                          <p className="text-[9px] font-mono text-blue-600 bg-blue-100/30 inline-block px-1.5 py-0.5 rounded mt-1.5 uppercase font-black">
                            {record.training?.code || 'ID-REDACTED'}
                          </p>
                        </div>
                      </td>
                      <td className="tms-table-td py-6">
                        <span className={`px-3 py-1.5 rounded-[10px] text-[9px] font-black uppercase tracking-wider border shadow-sm flex items-center gap-2 w-fit ${getStatusStyle(record.status)}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {record.status}
                        </span>
                      </td>
                      <td className="tms-table-td py-6 text-center">
                        <div className="flex flex-col items-center">
                          <p className="text-[11px] font-black text-slate-700">
                            {new Date(record.assignedDate).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-40">Init Seq</span>
                          </div>
                        </div>
                      </td>
                      <td className="tms-table-td py-6 text-center">
                        {record.status === 'COMPLETED' ? (
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-xl ${record.score && record.score >= 80 ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-100' : 'bg-rose-600 text-white border-rose-600 shadow-rose-100'}`}>
                            <span className="text-xs font-black">{record.score}%</span>
                            <TrendingUp className="w-3.5 h-3.5 opacity-80" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 opacity-20">
                            <Activity className="w-4 h-4 text-slate-300" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">In-Flight</span>
                          </div>
                        )}
                      </td>
                      <td className="tms-table-td pr-10 py-6 text-right">
                        <button className="w-10 h-10 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-90 flex items-center justify-center group/btn">
                          <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="px-10 py-8 bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-8">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Consensus</span>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Processing {filteredRecords.length} Analytical Nodes
              </p>
            </div>
            <div className="relative z-10">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono italic">Document Hash: 44A-B6-TMS-X2C</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

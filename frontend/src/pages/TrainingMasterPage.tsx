import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Edit, ToggleLeft, ToggleRight,
    ChevronLeft, Search, Filter, Briefcase, FileText,
    Users, Shield, AlertCircle, CheckCircle2, Info, Link, Paperclip, Loader2, UserPlus, Calendar as CalendarIcon,
    ChevronRight,
    X,
    Activity,
    ShieldCheck,
    LayoutGrid,
    ListFilter,
    ArrowUpRight,
    Sparkles,
    Database,
    Zap,
    Clock,
    RefreshCcw,
    ChevronDown,
    CloudUpload
} from 'lucide-react';
import {
    getTrainingMasters, createTrainingMaster,
    updateTrainingMaster, toggleTrainingMasterStatus,
    attachTrainingContent, assignTrainingMaster
} from '../services/api';

interface TrainingMaster {
    _id: string;
    training_code: string;
    title: string;
    description: string;
    training_type: 'Document-driven' | 'Role-based' | 'Instructor-led' | 'External / Certification';
    mandatory_flag: boolean;
    validity_period: number;
    validity_unit: 'days' | 'months' | 'years';
    status: 'ACTIVE' | 'INACTIVE';
    created_by: {
        name: string;
    };
    createdAt: string;
}

export const TrainingMasterPage: React.FC = () => {
    const navigate = useNavigate();
    const [trainings, setTrainings] = useState<TrainingMaster[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Content Mapping State
    const [showContentModal, setShowContentModal] = useState(false);
    const [mappingTarget, setMappingTarget] = useState<TrainingMaster | null>(null);
    const [mappingType, setMappingType] = useState<'PDF' | 'LINK' | 'TEXT'>('PDF');
    const [mappingSource, setMappingSource] = useState('');
    const [mappingFile, setMappingFile] = useState<File | null>(null);
    const [isSubmittingContent, setIsSubmittingContent] = useState(false);

    // Assignment state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignTarget, setAssignTarget] = useState<TrainingMaster | null>(null);
    const [assignMode, setAssignMode] = useState<'ALL' | 'DEPT'>('ALL');
    const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [isAssigning, setIsAssigning] = useState(false);

    const departmentsList = [
        'R&D', 'Clinical Research/Affairs', 'Manufacturing', 'Quality Assurance', 'Quality Control',
        'Regulatory Affairs', 'Pharmacovigilance', 'Supply Chain & Logistics', 'Engineering',
        'Sales & Marketing', 'HR', 'Finance', 'IT', 'Legal', 'Other'
    ];

    const [formData, setFormData] = useState({
        training_code: '',
        title: '',
        description: '',
        training_type: 'Document-driven',
        mandatory_flag: true,
        validity_period: 365,
        validity_unit: 'days'
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTrainings();
    }, []);

    const fetchTrainings = async () => {
        try {
            const data = await getTrainingMasters();
            setTrainings(data);
        } catch (err) {
            console.error('Error fetching training masters:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (editingId) {
                await updateTrainingMaster(editingId, formData);
                setSuccess('Training updated successfully');
            } else {
                await createTrainingMaster(formData);
                setSuccess('Training created successfully');
            }
            fetchTrainings();
            setTimeout(() => {
                setShowForm(false);
                resetForm();
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Action failed');
        }
    };

    const handleEdit = (t: TrainingMaster) => {
        setEditingId(t._id);
        setFormData({
            training_code: t.training_code,
            title: t.title,
            description: t.description,
            training_type: t.training_type,
            mandatory_flag: t.mandatory_flag,
            validity_period: t.validity_period,
            validity_unit: t.validity_unit
        });
        setShowForm(true);
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await toggleTrainingMasterStatus(id);
            fetchTrainings();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            training_code: '',
            title: '',
            description: '',
            training_type: 'Document-driven',
            mandatory_flag: true,
            validity_period: 365,
            validity_unit: 'days'
        });
        setEditingId(null);
        setError('');
        setSuccess('');
    };

    const handleAttachContent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mappingTarget) return;

        setIsSubmittingContent(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('training_master_id', mappingTarget._id);
            formData.append('content_type', mappingType);

            if (mappingType === 'PDF' && mappingFile) {
                formData.append('file', mappingFile);
            } else {
                formData.append('content_source', mappingSource);
            }

            await attachTrainingContent(formData);
            setSuccess('Content attached successfully');
            setTimeout(() => {
                setShowContentModal(false);
                setMappingTarget(null);
                setMappingFile(null);
                setMappingSource('');
                setSuccess('');
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to attach content');
        } finally {
            setIsSubmittingContent(false);
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignTarget) return;

        setIsAssigning(true);
        setError('');

        try {
            await assignTrainingMaster(assignTarget._id, {
                assignedUsers: assignMode === 'ALL' ? 'ALL' : [],
                departments: assignMode === 'DEPT' ? selectedDepts : [],
                dueDate
            });
            setSuccess(`Assigned ${assignTarget.title} successfully`);
            setTimeout(() => {
                setShowAssignModal(false);
                setAssignTarget(null);
                setSuccess('');
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Assignment failed');
        } finally {
            setIsAssigning(false);
        }
    };

    const filteredTrainings = trainings.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.training_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Activity className="w-16 h-16 text-blue-600 animate-pulse opacity-20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Database className="w-8 h-8 text-blue-600 animate-bounce" />
                        </div>
                    </div>
                    <p className="text-slate-900 font-bold uppercase tracking-widest text-[10px]">Accessing Training Records</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="tms-container py-5 flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate('/admin/dashboard')} className="p-2.5 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200 shadow-sm active:scale-90">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Training Management</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">Manage corporate training records</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest leading-none">Identity Verified</span>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            <div className="relative z-10 flex items-center gap-2.5 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 group-hover:bg-transparent shadow-xl shadow-slate-200">
                                <Plus className="w-4 h-4" />
                                Create Training
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            <main className="tms-container py-12 max-w-7xl">
                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-14">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <Database className="w-4 h-4 text-blue-500" />
                            Total Modules: {trainings.length}
                        </div>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-[1.1]">Global Training <br />Management Portal</h2>
                        <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed max-w-2xl opacity-80">
                            Manage and track all organizational training requirements and curricula. All modifications are tracked for audit purposes.
                        </p>
                    </div>
                    <div className="lg:col-span-4 flex flex-col justify-end">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl flex items-center justify-between group hover:border-blue-200 hover:-translate-y-1 transition-all duration-500 cursor-default">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Layer</p>
                                <p className="text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">System Records</p>
                            </div>
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-12">
                                <Shield className="w-7 h-7" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="md:col-span-3">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by training title or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[28px] text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all selection:bg-blue-50 placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <button className="w-full h-full p-5 bg-white border border-slate-100 rounded-[24px] text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95 group">
                            <Filter className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            Filter
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-14"
                        >
                            <div className="bg-white p-10 md:p-14 rounded-[44px] shadow-3xl border border-slate-100 relative overflow-hidden group/form">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-20" />

                                <div className="flex justify-between items-center mb-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                                            {editingId ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                                {editingId ? 'Edit Training Details' : 'New Training Module'}
                                            </h2>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Enter training information</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setShowForm(false); resetForm(); }} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all active:scale-90">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Training Code</label>
                                            <input
                                                type="text"
                                                required
                                                disabled={!!editingId}
                                                value={formData.training_code}
                                                onChange={(e) => setFormData({ ...formData, training_code: e.target.value.toUpperCase() })}
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 font-mono text-sm tracking-widest outline-none transition-all disabled:opacity-50"
                                                placeholder="SYS-PROTOCOL-001"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Training Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 font-bold text-sm outline-none transition-all shadow-sm"
                                                placeholder="Enter training title..."
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                                            <textarea
                                                required
                                                rows={5}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 font-medium text-sm outline-none transition-all resize-none shadow-sm placeholder:italic"
                                                placeholder="Define the primary compliance objectives and curriculum scope..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Training Type</label>
                                            <div className="relative group">
                                                <select
                                                    value={formData.training_type}
                                                    onChange={(e) => setFormData({ ...formData, training_type: e.target.value as any })}
                                                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 font-bold text-sm outline-none transition-all appearance-none cursor-pointer shadow-sm pr-12"
                                                >
                                                    <option value="Document-driven">Document-driven</option>
                                                    <option value="Role-based">Role-based</option>
                                                    <option value="Instructor-led">Instructor-led</option>
                                                    <option value="External / Certification">External / Certification</option>
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Validity Period</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={formData.validity_period}
                                                    onChange={(e) => setFormData({ ...formData, validity_period: parseInt(e.target.value) })}
                                                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 font-black text-sm outline-none transition-all shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit</label>
                                                <div className="relative group">
                                                    <select
                                                        value={formData.validity_unit}
                                                        onChange={(e) => setFormData({ ...formData, validity_unit: e.target.value as any })}
                                                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 font-bold text-sm outline-none transition-all appearance-none cursor-pointer shadow-sm pr-12"
                                                    >
                                                        <option value="days">Days</option>
                                                        <option value="months">Months</option>
                                                        <option value="years">Years</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex items-center justify-between group/toggle relative overflow-hidden">
                                            <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/toggle:opacity-100 transition-opacity" />
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2.5">
                                                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">Mandatory Training</p>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Escalate priority across all user nodes</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer z-10">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.mandatory_flag}
                                                    onChange={(e) => setFormData({ ...formData, mandatory_flag: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-white peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-slate-600 after:rounded-full after:h-5 after:w-5 after:shadow-lg after:transition-all duration-500 border border-white/5"></div>
                                            </label>
                                        </div>

                                        <div className="pt-4 flex gap-4">
                                            <button
                                                type="submit"
                                                className="flex-1 group relative overflow-hidden rounded-2xl"
                                            >
                                                <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                                <div className="relative z-10 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] transition-all active:scale-95 group-hover:bg-transparent flex items-center justify-center gap-3">
                                                    <Zap className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
                                                    {editingId ? 'COMMIT CHANGES' : 'INITIALIZE REGISTRY'}
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2">
                                        <AnimatePresence>
                                            {error && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-700 font-black text-[10px] uppercase tracking-widest">
                                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                                    {error}
                                                </motion.div>
                                            )}
                                            {success && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 text-emerald-700 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100/50">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                    {success}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Registry List */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[44px] shadow-2xl border border-slate-100 overflow-hidden"
                >
                    <div className="tms-table-container min-h-[500px]">
                        <table className="tms-table">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="tms-table-th py-6 pl-10">ID / Code</th>
                                    <th className="tms-table-th py-6">Type</th>
                                    <th className="tms-table-th py-6">Validity</th>
                                    <th className="tms-table-th py-6">Created By</th>
                                    <th className="tms-table-th py-6 text-center">Status</th>
                                    <th className="tms-table-th py-6 pr-10 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-800">
                                {filteredTrainings.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-40 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-30">
                                                <div className="w-24 h-24 bg-slate-100 rounded-[44px] flex items-center justify-center border-4 border-dashed border-slate-200 shadow-inner">
                                                    <Search className="w-12 h-12 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Results Found</h3>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Adjust search parameters or add a new training.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTrainings.map((t, idx) => (
                                        <tr key={t._id} className="tms-table-row group hover:bg-slate-50/50 transition-colors" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <td className="tms-table-td pl-10 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-sm ${t.mandatory_flag ? 'bg-orange-50 border-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white group-hover:-rotate-6' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-6'}`}>
                                                        {t.mandatory_flag ? <Shield className="w-6 h-6" /> : <Database className="w-6 h-6" />}
                                                    </div>
                                                    <div className="min-w-0 pr-4">
                                                        <p className="text-xs font-black text-slate-900 truncate max-w-[240px] uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                                                            {t.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-[9px] font-mono text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/50 font-black tracking-widest uppercase">
                                                                {t.training_code}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-300 uppercase italic">Verified Record</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="tms-table-td py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                                        {t.training_type === 'Document-driven' && <FileText className="w-3.5 h-3.5" />}
                                                        {t.training_type === 'Role-based' && <Users className="w-3.5 h-3.5" />}
                                                        {t.training_type === 'Instructor-led' && <Briefcase className="w-3.5 h-3.5" />}
                                                        {t.training_type === 'External / Certification' && <ShieldCheck className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-tight">{t.training_type}</span>
                                                </div>
                                            </td>
                                            <td className="tms-table-td py-6">
                                                <div className="inline-flex flex-col">
                                                    <span className="text-xs font-black text-slate-900">{t.validity_period}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.validity_unit}</span>
                                                </div>
                                            </td>
                                            <td className="tms-table-td py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 bg-slate-200 rounded-full border border-white flex items-center justify-center text-[8px] font-black text-slate-600 uppercase">
                                                            {t.created_by?.name?.substring(0, 1) || 'A'}
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{t.created_by?.name || 'Administrator'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 opacity-40">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        <p className="text-[8px] font-black uppercase tracking-widest">{new Date(t.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="tms-table-td py-6 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(t._id)}
                                                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2 shadow-sm transition-all active:scale-95 ${t.status === 'ACTIVE'
                                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                        : 'bg-slate-50 border-slate-100 text-slate-400'
                                                        }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    {t.status}
                                                </button>
                                            </td>
                                            <td className="tms-table-td py-6 pr-10 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                                                    <button
                                                        onClick={() => {
                                                            setAssignTarget(t);
                                                            setShowAssignModal(true);
                                                        }}
                                                        className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl transition-all shadow-sm flex items-center justify-center group/btn active:scale-90"
                                                        title="Assign Training"
                                                    >
                                                        <UserPlus className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setMappingTarget(t);
                                                            setShowContentModal(true);
                                                        }}
                                                        className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm flex items-center justify-center group/btn active:scale-90"
                                                        title="Attach Content"
                                                    >
                                                        <Paperclip className="w-5 h-5 shadow-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(t)}
                                                        className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm flex items-center justify-center group/btn active:scale-90"
                                                        title="Edit Details"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <div className="w-px h-8 bg-slate-100 mx-1" />
                                                    <button className="w-10 h-10 bg-slate-900 border border-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-lg active:scale-90 group/btn">
                                                        <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-10 bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />
                        <div className="relative z-10 flex gap-12 items-center">
                            <div className="flex items-center gap-4">
                                <ShieldCheck className="w-6 h-6 text-blue-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Training Records: Connected</span>
                            </div>
                            <div className="h-6 w-px bg-slate-800" />
                            <div className="flex items-center gap-4">
                                <Activity className="w-5 h-5 text-emerald-500 opacity-60" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic font-mono">
                                    NODE_HASH: {Math.random().toString(36).substring(2, 12).toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="relative z-10 flex items-center gap-3">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono italic">REG_PROTOCOL_9.4-ELITE</span>
                        </div>
                    </div>
                </motion.div>

                {/* Legend / Quick Help */}
                <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                    {[
                        { title: 'Metadata Propagation', description: 'Updates to training records automatically synchronize with all active user compliance vectors.', icon: RefreshCcw, color: 'blue' },
                        { title: 'Mandatory Enforcement', description: 'Mandatory flags override user-defined training priorities and appear in critical compliance views.', icon: Shield, color: 'orange' },
                        { title: 'Asset Mapping', description: 'Dynamic content mapping allows for version-controlled attachment of SOPs and external links.', icon: ListFilter, color: 'emerald' },
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl group hover:border-blue-100 hover:-translate-y-2 transition-all duration-500">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-colors duration-500
                                ${card.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : ''}
                                ${card.color === 'orange' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : ''}
                                ${card.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : ''}
                             `}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-3">{card.title}</h3>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                                {card.description}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Content & Assign Modals (Refined) */}
            <AnimatePresence>
                {/* Same refined modal logic as other pages... (Omitted the full modal refinement for brevity but I should actually refine them) */}
                {/* I will refine the modals to match the high-fidelity style */}
            </AnimatePresence>

            {/* Modal Logic (Re-implemented with refined styles) */}
            <AnimatePresence>
                {showContentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[44px] shadow-3xl border border-white/20 w-full max-w-xl overflow-hidden relative">
                            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                                        <Paperclip className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Map Curricular Asset</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Temporary Layer: {mappingTarget?.training_code}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowContentModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-6 h-6 text-slate-300" />
                                </button>
                            </div>
                            <form onSubmit={handleAttachContent} className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Source Logic Selection</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['PDF', 'LINK', 'TEXT'] as const).map(type => (
                                            <button key={type} type="button" onClick={() => setMappingType(type)} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${mappingType === type ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {mappingType === 'PDF' ? (
                                    <div className="space-y-4 text-center">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left px-1">Evidence Protocol (PDF)</label>
                                        <label className="block border-4 border-dashed border-slate-50 rounded-[32px] p-12 hover:bg-slate-50/50 hover:border-blue-100 transition-all cursor-pointer group/upload shadow-inner">
                                            <input type="file" accept=".pdf" onChange={(e) => setMappingFile(e.target.files?.[0] || null)} className="hidden" />
                                            <div className="w-16 h-16 bg-white rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-xl shadow-slate-100 text-slate-200 group-hover/upload:text-blue-600 transition-colors">
                                                <CloudUpload className="w-8 h-8" />
                                            </div>
                                            <p className="text-xs font-black text-slate-900 uppercase truncate px-4">{mappingFile ? mappingFile.name : 'Click to stage training PDF'}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">{mappingFile ? 'Ready for Injection' : 'PDF Source Only'}</p>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">{mappingType === 'LINK' ? 'EXTERNAL_ENDPOINT_URI' : 'INSTRUCTIONAL_DATA_STREAM'}</label>
                                        {mappingType === 'LINK' ? (
                                            <input type="url" required value={mappingSource} onChange={(e) => setMappingSource(e.target.value)} placeholder="https://compliance-cloud.org/vector-a" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-sm shadow-inner transition-all" />
                                        ) : (
                                            <textarea required rows={5} value={mappingSource} onChange={(e) => setMappingSource(e.target.value)} placeholder="Define technical requirements or curriculum text..." className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-medium text-sm shadow-inner transition-all resize-none" />
                                        )}
                                    </div>
                                )}
                                <button disabled={isSubmittingContent} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-95 hover:bg-blue-600 disabled:opacity-50 shadow-2xl shadow-blue-100/20">
                                    {isSubmittingContent ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                    {isSubmittingContent ? 'INJECTING ASSET...' : 'COMMENCE MAPPING'}
                                </button>
                            </form>
                            <div className="p-6 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center italic opacity-60">
                                Authorized by TMS-Security-ELITE. System baseline will recalibrate on save.
                            </div>
                        </motion.div>
                    </div>
                )}

                {showAssignModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[44px] shadow-3xl border border-white/20 w-full max-w-xl overflow-hidden relative">
                            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-100">
                                        <UserPlus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Execute Assignment</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Curriculum: {assignTarget?.title}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-6 h-6 text-slate-300" />
                                </button>
                            </div>
                            <form onSubmit={handleAssign} className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Assignment Vector Scope</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button type="button" onClick={() => setAssignMode('ALL')} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${assignMode === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>Full Sync (Global)</button>
                                        <button type="button" onClick={() => setAssignMode('DEPT')} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${assignMode === 'DEPT' ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-200' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>Target Clusters</button>
                                    </div>
                                    <AnimatePresence>
                                        {assignMode === 'DEPT' && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-slate-50 rounded-[32px] p-6 border-2 border-slate-100 shadow-inner grid grid-cols-2 gap-2 mt-4 max-h-48 overflow-y-auto custom-scrollbar">
                                                {departmentsList.map(dept => (
                                                    <button key={dept} type="button" onClick={() => setSelectedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])} className={`px-4 py-2 rounded-xl text-left text-[9px] font-black uppercase border-2 transition-all ${selectedDepts.includes(dept) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white border-white text-slate-500 hover:border-emerald-100'}`}>
                                                        {dept}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block text-left">Compliance Deadline Index</label>
                                    <div className="relative group">
                                        <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-black text-xs uppercase shadow-inner transition-all" />
                                    </div>
                                </div>
                                <button disabled={isAssigning} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-95 hover:bg-emerald-600 disabled:opacity-50 shadow-2xl shadow-emerald-100/20">
                                    {isAssigning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                    {isAssigning ? 'PROPAGATING VECTOR...' : 'CONFIRM ASSIGNMENT'}
                                </button>
                            </form>
                            <div className="p-6 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center italic opacity-60">
                                High-priority broadcast: All assigned nodes will receive real-time notification.
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

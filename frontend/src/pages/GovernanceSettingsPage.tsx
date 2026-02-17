import React, { useState, useEffect } from 'react';
import { Settings, History, Save, RotateCcw, ShieldCheck, AlertTriangle, CheckCircle, Clock, Plus, ChevronRight, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { ElectronicSignatureModal } from '../components/ElectronicSignatureModal';

interface GovernanceConfig {
    _id: string;
    version: number;
    name: string;
    description?: string;
    config: Record<string, any>;
    isActive: boolean;
    createdBy: any;
    createdAt: string;
}

const GovernanceSettingsPage: React.FC = () => {
    const [currentConfig, setCurrentConfig] = useState<GovernanceConfig | null>(null);
    const [history, setHistory] = useState<GovernanceConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editConfigJson, setEditConfigJson] = useState('');

    // Modal State
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'update' | 'rollback', version?: number } | null>(null);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const [currentRes, historyRes] = await Promise.all([
                api.get('/governance/current'),
                api.get('/governance/history')
            ]);
            setCurrentConfig(currentRes.data);
            setHistory(historyRes.data);

            // Populate edit fields if current exists
            if (currentRes.data) {
                setEditName(currentRes.data.name);
                setEditDescription(currentRes.data.description || '');
                setEditConfigJson(JSON.stringify(currentRes.data.config, null, 2));
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load governance configurations.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePrompt = () => {
        try {
            JSON.parse(editConfigJson); // Validate JSON first
            setPendingAction({ type: 'update' });
            setIsSignatureModalOpen(true);
        } catch (e) {
            setError('Invalid Configuration JSON. Please check your syntax.');
        }
    };

    const handleRollbackPrompt = (version: number) => {
        setPendingAction({ type: 'rollback', version });
        setIsSignatureModalOpen(true);
    };

    const handleConfirmSignature = async (password: string, reason: string) => {
        if (!pendingAction) return;

        try {
            if (pendingAction.type === 'update') {
                await api.post('/governance/update', {
                    name: editName,
                    description: editDescription,
                    config: JSON.parse(editConfigJson),
                    signaturePassword: password,
                    signatureReason: reason
                });
            } else if (pendingAction.type === 'rollback' && pendingAction.version) {
                await api.post(`/governance/rollback/${pendingAction.version}`, {
                    signaturePassword: password,
                    signatureReason: reason
                });
            }
            setIsEditing(false);
            await fetchConfigs();
        } catch (err: any) {
            throw err;
        }
    };

    if (loading && !currentConfig) return <div className="p-8 text-center animate-pulse">Loading Governance Engine...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-8 space-y-8">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-3 rounded-2xl shadow-xl">
                        <Settings className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">Governance Configuration</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            System Versioning & Compliance Controls
                        </p>
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Version
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Config Form/Viewer */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 font-black text-slate-800 uppercase tracking-tight">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                {isEditing ? 'Draft New Configuration' : 'Active Governance Baseline'}
                            </div>
                            {currentConfig && !isEditing && (
                                <div className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    Active: v{currentConfig.version}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Config Name</label>
                                    <input
                                        type="text"
                                        readOnly={!isEditing}
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-bold text-slate-900"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Version Reference</label>
                                    <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold">
                                        {isEditing ? `Incremented to v${(currentConfig?.version || 0) + 1}` : `Currently v${currentConfig?.version}`}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Governance Rationale (Public Description)</label>
                                <textarea
                                    readOnly={!isEditing}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none transition-all text-sm font-medium resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration Payload (JSON)</label>
                                <textarea
                                    readOnly={!isEditing}
                                    value={editConfigJson}
                                    onChange={(e) => setEditConfigJson(e.target.value)}
                                    rows={12}
                                    className="w-full px-4 py-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl focus:ring-2 focus:ring-slate-700 outline-none transition-all resize-none shadow-inner"
                                />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleUpdatePrompt}
                                    className="px-8 py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3"
                                >
                                    <Save className="w-4 h-4" />
                                    Publish New Version
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        fetchConfigs();
                                    }}
                                    className="px-8 py-4 bg-white border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* History Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 font-black text-slate-800 uppercase tracking-tight">
                            <History className="w-5 h-5 text-slate-400" />
                            Version History
                        </div>

                        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
                            {history.map((item) => (
                                <div
                                    key={item._id}
                                    className={`p-4 rounded-2xl border transition-all ${item.isActive ? 'bg-slate-900 border-slate-900 shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${item.isActive ? 'bg-white/10 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                                <Hash className="w-3 h-3" />
                                            </div>
                                            <span className={`text-[10px] font-black transition-colors ${item.isActive ? 'text-white' : 'text-slate-900'}`}>
                                                VERSION {item.version}
                                            </span>
                                        </div>
                                        {!item.isActive && (
                                            <button
                                                onClick={() => handleRollbackPrompt(item.version)}
                                                className="p-2 bg-white rounded-lg border border-slate-100 hover:border-slate-900 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                                                title="Rollback to this version"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className={`text-xs font-black truncate transition-colors ${item.isActive ? 'text-white' : 'text-slate-700'}`}>
                                        {item.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className={`flex items-center gap-1.5 text-[9px] font-bold ${item.isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                                            <Clock className="w-3 h-3" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 space-y-3">
                        <ShieldCheck className="w-8 h-8 opacity-50" />
                        <h4 className="font-black text-sm uppercase tracking-tight">Electronic Signature Policy</h4>
                        <p className="text-[10px] font-medium leading-relaxed opacity-80">
                            All modifications to the governance baseline require an electronic signature. Rollbacks create a new version to preserve complete audit integrity.
                        </p>
                    </div>
                </div>
            </div>

            <ElectronicSignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                onConfirm={handleConfirmSignature}
                actionName={pendingAction?.type === 'update' ? 'Governance Config Update' : `Governance Rollback to v${pendingAction?.version}`}
                description={pendingAction?.type === 'update'
                    ? "Updating the governance baseline will affect system-wide AI analytics and compliance thresholds."
                    : "Rolling back will create a new version of the configuration to maintain the immutable audit trail."
                }
            />
        </div>
    );
};

export default GovernanceSettingsPage;

import React, { useState } from 'react';
import { ShieldCheck, X, Loader2, AlertTriangle, KeyRound, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ElectronicSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string, reason: string) => Promise<void>;
    actionName: string;
    description?: string;
}

export const ElectronicSignatureModal: React.FC<ElectronicSignatureModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    actionName,
    description
}) => {
    const [password, setPassword] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim() || !reason.trim()) return;

        setLoading(true);
        setError(null);
        try {
            await onConfirm(password, reason);
            setPassword('');
            setReason('');
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Signature verification failed.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
                >
                    {/* Header */}
                    <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/20 p-2 rounded-xl">
                                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight">Electronic Signature</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Governance Baseline Security</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-blue-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Action Required Signature</span>
                            </div>
                            <p className="text-xs font-bold text-slate-900">{actionName}</p>
                            {description && <p className="text-[10px] text-slate-500 leading-relaxed">{description}</p>}
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600"
                            >
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p className="text-xs font-bold">{error}</p>
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <KeyRound className="w-3 h-3" />
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your administrative password"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" />
                                    Reason for Action
                                </label>
                                <textarea
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Explain why this governance action is necessary"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading || !password.trim() || !reason.trim()}
                                className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verifying Signature...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" />
                                        Digitally Sign Action
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="w-full py-4 bg-white border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all font-bold"
                            >
                                Cancel
                            </button>
                        </div>

                        <p className="text-center text-[9px] text-slate-400 font-medium leading-relaxed italic">
                            By signing, you acknowledge this action will be immutably recorded in the compliance audit trail including your IP address and timestamp.
                        </p>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

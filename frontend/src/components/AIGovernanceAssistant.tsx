import React, { useState } from 'react';
import { Send, Bot, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

interface AIResponse {
    insightSummary: string;
    riskExplanation: string;
    keyDrivers: string[];
    suggestedActions: string[];
}

export const AIGovernanceAssistant: React.FC = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<AIResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/analytics/ai/ask', { query });
            setResponse(res.data);
            setQuery('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to get AI insights.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">Governance Assistant</h2>
                        <span className="text-blue-100 text-xs font-medium uppercase tracking-wider">AI Analytics Engine</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    <span className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Active</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {!response && !loading && !error && (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
                        <div className="bg-blue-50 p-4 rounded-full">
                            <Bot className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                        <h3 className="text-gray-900 font-bold">How can I assist with Governance?</h3>
                        <p className="text-gray-500 text-sm">
                            Ask me about department risks, compliance gaps, or overall training health.
                        </p>
                        <div className="grid grid-cols-1 gap-2 w-full pt-4">
                            <button onClick={() => setQuery("Which department is highest risk?")} className="text-left p-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all">"Which department is highest risk?"</button>
                            <button onClick={() => setQuery("Summarize overall compliance.")} className="text-left p-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all">"Summarize overall compliance."</button>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">Processing Data...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="text-sm text-red-700 font-medium">{error}</div>
                    </div>
                )}

                <AnimatePresence>
                    {response && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Insight Summary */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Insight Summary</h4>
                                <p className="text-gray-700 text-sm leading-relaxed">{response.insightSummary}</p>
                            </div>

                            {/* Risk Explanation */}
                            <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 space-y-2">
                                <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest">Risk Reasoning</h4>
                                <p className="text-gray-700 text-sm leading-relaxed">{response.riskExplanation}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Key Drivers */}
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Key Drivers</h4>
                                    <ul className="space-y-2">
                                        {response.keyDrivers.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Suggested Actions */}
                                <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100 space-y-3">
                                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Advisory Actions</h4>
                                    <ul className="space-y-2">
                                        {response.suggestedActions.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-blue-800 font-medium">
                                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="text-center pt-4">
                                <span className="inline-block px-4 py-1.5 bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                                    AI Generated – For Governance Review Only
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input Box */}
            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleAskAI} className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask about compliance risks..."
                        className="w-full pl-5 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { Upload, FileText, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument } from '../services/api';
import { motion } from 'framer-motion';

export const UploadPage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        try {
            const data = await uploadDocument(file);
            navigate('/assessment', { state: { sessionId: data.sessionId, questions: data.questions } });
        } catch (err: any) {
            setError(err.message || 'Failed to upload document. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card w-full max-w-xl p-8 md:p-12 relative overflow-hidden"
            >
                {/* Decorative background blur - Subtle for light mode */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center space-y-8">
                    <div className="space-y-2">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-4">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                            AI Training <span className="text-gradient">Manager</span>
                        </h1>
                        <p className="text-slate-500 text-lg max-w-sm mx-auto">
                            Upload your documents and let AI generate smart training assessments instantly.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".pdf,.txt"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                            <div className={`
                                relative z-10 border-2 border-dashed rounded-2xl p-10 transition-all duration-300
                                flex flex-col items-center justify-center gap-4
                                ${file
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                                }
                            `}>
                                <div className={`
                                    p-4 rounded-full transition-transform duration-300 group-hover:scale-110
                                    ${file ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}
                                `}>
                                    {file ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-medium text-slate-700">
                                        {file ? file.name : 'Drop your file here'}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Support for PDF & TXT'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-xl"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className={`
                                w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300
                                flex items-center justify-center gap-3
                                ${!file || loading
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25 text-white'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Analyzing Document...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Start Analysis
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

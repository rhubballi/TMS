import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ChevronLeft } from 'lucide-react';

interface QuestionResult {
    question: string;
    userAnswer: string | boolean;
    correct: boolean;
    correctAnswer: string | boolean;
    explanation: string;
}

interface IResult {
    score: number;
    percentage: number;
    results: QuestionResult[];
}

export const ResultPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [result] = useState<any>(location.state?.result || null);
    const [certificateUrl] = useState<string | null>(location.state?.result?.certificateUrl || null);

    const [loading, setLoading] = useState(!result);

    useEffect(() => {
        // No need to fetch result in new system - passed via state
        setLoading(false);
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-blue-400">Loading results...</div>;
    }

    if (!result) {
        return <div className="min-h-screen flex items-center justify-center text-red-400">Result not found.</div>;
    }

    const getPerformanceGrade = (percentage: number) => {
        if (percentage < 35) return { label: 'FAIL', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
        if (percentage <= 60) return { label: 'PASS', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
        return { label: 'EXCELLENT', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
    };

    const grade = getPerformanceGrade(result.percentage);

    // FeedbackCard removed
    // Detailed Analysis logic modified to hide correct answers

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Summary Section */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
                >
                    <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Assessment Result</h1>
                    <p className="text-gray-500 text-center mb-8">
                        Your assessment has been recorded.
                    </p>

                    <div className={`p-6 rounded-xl border-2 mb-8 text-center ${result.percentage >= 35 ? grade.bg + ' ' + grade.border : 'bg-red-50 border-red-200'
                        }`}>
                        <span className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Status</span>
                        <span className={`text-5xl font-black tracking-tight ${result.percentage >= 35 ? grade.color : 'text-red-600'
                            }`}>
                            {result.percentage >= 35 ? grade.label : 'FAILED'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="block text-3xl font-bold text-gray-900 mb-1">{result.results.length}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase">Total Questions</span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="block text-3xl font-bold text-gray-900 mb-1">{result.score}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase">Correct</span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="block text-3xl font-bold text-blue-600 mb-1">{result.percentage.toFixed(0)}%</span>
                            <span className="text-xs font-bold text-gray-500 uppercase">Final Score</span>
                        </div>
                    </div>

                    {result.percentage >= 35 && (
                        <div className="mt-8 flex justify-center">
                            {certificateUrl ? (
                                <a
                                    href={`${API_BASE_URL}${certificateUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    Download Compliance Certificate
                                </a>
                            ) : (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-xs font-bold uppercase tracking-wider">
                                    Certificate generation in progress... Please refresh dashboard in a moment.
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Question Analysis - HIDE Correct Answers */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Response Summary</h2>
                    <div className="space-y-4">
                        {result.results && result.results.map((q: any, idx: number) => (
                            <div key={idx} className={`p-6 rounded-xl border ${q.correct ? 'bg-green-50/30 border-green-100' : 'bg-red-50/30 border-red-100'
                                }`}>
                                <div className="flex items-start gap-4">
                                    <span className="font-mono text-gray-400 text-sm mt-1">Q{idx + 1}</span>
                                    <div className="flex-1">
                                        <h3 className="text-gray-900 font-medium mb-3">{q.question}</h3>

                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">Your Answer:</span>
                                            <span className={`font-semibold ${q.correct ? 'text-green-700' : 'text-red-700'}`}>
                                                {String(q.userAnswer)}
                                            </span>
                                            {q.correct ? (
                                                <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-red-600 ml-2" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center pt-8">
                    <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold transition-colors px-8 py-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md">
                        <ChevronLeft className="w-5 h-5" />
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

// FeedbackCard removed

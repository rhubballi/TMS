import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from '../components/Header';
import { getLearningProgress, updateReadingProgress, viewDocument, confirmAcknowledge, startTraining, API_BASE_URL } from '../services/api';
import { ArrowLeft, Clock, Calendar, CheckCircle, FileText, Award, ExternalLink, ChevronRight, Lock, Loader2, AlertTriangle, XCircle } from 'lucide-react';

export const TrainingDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [progress, setProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Viewer State
    const [viewingItem, setViewingItem] = useState<any>(null);
    const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

    const handleMarkAsFinished = async () => {
        if (!viewingItem || !id) return;

        setIsUpdatingProgress(true);
        try {
            await updateReadingProgress(id, viewingItem.contentId, {
                isCompleted: true,
                timeSpent: 60 // Dummy time spent for now
            });
            setViewingItem(null);
            fetchProgress();
        } catch (err) {
            console.error('Failed to update progress:', err);
        } finally {
            setIsUpdatingProgress(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchProgress();
        }
    }, [id]);

    const fetchProgress = async () => {
        try {
            const data = await getLearningProgress(id!);
            setProgress(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load training details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header title="Training Details" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error || !progress) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header title="Training Details" />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="text-center text-red-600">
                        {error || 'Training not found'}
                    </div>
                    <div className="text-center mt-4">
                        <Link to="/" className="text-blue-600 hover:text-blue-800">Back to Dashboard</Link>
                    </div>
                </div>
            </div>
        );
    }

    const { trainingRecord, overallProgress, contentItems } = progress;
    const training = trainingRecord?.trainingMaster || trainingRecord?.training || {};

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Training Details" />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 font-bold uppercase tracking-widest text-[10px]">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Learning Center
                </Link>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">{training?.title || 'Untitled Training'}</h1>
                                {trainingRecord.completedLate && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide rounded border border-red-200">
                                        Late Completion
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-600 mb-4">{training?.description || 'No description available'}</p>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold">Status:</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${trainingRecord.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        trainingRecord.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                            trainingRecord.status === 'LOCKED' ? 'bg-gray-800 text-white' :
                                                'bg-blue-100 text-blue-800'
                                        }`}>
                                        {trainingRecord.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold">Due:</span>
                                    {new Date(trainingRecord.dueDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold">Attempts:</span>
                                    {trainingRecord.assessmentAttempts} / 3
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Document Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Learning Resource
                                </h2>
                                {trainingRecord.documentViewed && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded border border-green-100">
                                        <CheckCircle className="w-3 h-3" />
                                        Acknowledged
                                    </span>
                                )}
                            </div>

                            <div className="p-6 bg-gray-100 min-h-[500px] flex items-center justify-center">
                                {contentItems[0]?.contentType === 'document' && contentItems[0]?.fileUrl ? (
                                    <iframe
                                        src={`${API_BASE_URL}/${contentItems[0].fileUrl.startsWith('/') ? contentItems[0].fileUrl.substring(1) : contentItems[0].fileUrl}#toolbar=0`}
                                        className="w-full h-[600px] border border-gray-300 rounded shadow-inner bg-white"
                                        title="PDF Viewer"
                                    />
                                ) : (
                                    <div className="text-gray-500 italic">Document not available or invalid format.</div>
                                )}
                            </div>

                            {!trainingRecord.documentViewed && (
                                <div className="p-4 bg-yellow-50 border-t border-yellow-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                        <span className="text-sm text-yellow-800 font-medium">
                                            You must read and acknowledge this document before taking the assessment.
                                        </span>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!trainingRecord._id) return;
                                            setIsUpdatingProgress(true);
                                            try {
                                                // 1. Mark as viewed (system requirement)
                                                await viewDocument(trainingRecord._id);

                                                // 2. Mark as acknowledged (compliance requirement)
                                                await confirmAcknowledge(trainingRecord._id);

                                                // 3. Update reading progress for the content item (optional but good for tracking)
                                                await updateReadingProgress(id!, contentItems[0].contentId, {
                                                    isCompleted: true,
                                                    timeSpent: 60
                                                });

                                                fetchProgress();
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                setIsUpdatingProgress(false);
                                            }
                                        }}
                                        disabled={isUpdatingProgress}
                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {isUpdatingProgress ? 'Processing...' : 'Acknowledge & Continue'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Next Steps</h2>

                            {trainingRecord.status === 'COMPLETED' ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                    <h3 className="font-bold text-green-900 text-lg">Compliance Verified</h3>
                                    <div className="flex flex-col items-center mt-1">
                                        <p className="text-green-700 text-sm font-bold uppercase tracking-wider">
                                            Result: {trainingRecord.resultGrade === 'EXCELLENT' ? 'EXCELLENT' : 'PASS'}
                                        </p>
                                        <p className="text-green-600 text-xs italic">Score: {trainingRecord.score}%</p>
                                    </div>
                                    <p className="text-green-700 text-[10px] mt-2 opacity-60">Verified on {new Date(trainingRecord.completedDate || trainingRecord.updatedAt).toLocaleDateString()}</p>

                                    {/* Sprint 3: Certificate Display */}
                                    {trainingRecord.certificateUrl && (
                                        <div className="mt-4 pt-4 border-t border-green-200">
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <Award className="w-5 h-5 text-green-600" />
                                                <span className="font-bold text-green-900">Certificate Available</span>
                                            </div>
                                            {trainingRecord.certificateId && (
                                                <p className="text-xs text-green-700 mb-2">
                                                    ID: {trainingRecord.certificateId}
                                                </p>
                                            )}
                                            <a
                                                href={`${API_BASE_URL}${trainingRecord.certificateUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors text-sm"
                                            >
                                                <Award className="w-4 h-4" />
                                                Download Certificate
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            {trainingRecord.expiryDate && (
                                                <p className="text-xs text-green-700 mt-3">
                                                    Valid until: {new Date(trainingRecord.expiryDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : trainingRecord.status === 'FAILED' ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                    <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                                    <h3 className="font-bold text-red-900 text-lg">Assessment Failed</h3>
                                    <p className="text-red-700 text-sm mt-1">Score: {trainingRecord.score}%</p>
                                    <div className="mt-4 text-xs text-red-800 font-semibold uppercase">
                                        Knowledge Reinforcement Required
                                    </div>
                                </div>
                            ) : trainingRecord.status === 'LOCKED' ? (
                                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                                    <Lock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <h3 className="font-bold text-gray-900 text-lg">Access Locked</h3>
                                    <p className="text-gray-600 text-sm mt-1">Maximum attempts exceeded.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-lg border ${trainingRecord.documentViewed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${trainingRecord.documentViewed ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                                                1
                                            </div>
                                            <span className={`font-bold ${trainingRecord.documentViewed ? 'text-green-900' : 'text-blue-900'}`}>
                                                Read & Acknowledge
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 pl-9">
                                            Review the PDF document to understand the policy requirements.
                                        </p>
                                    </div>

                                    <div className={`p-4 rounded-lg border ${!trainingRecord.documentViewed ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-blue-50 border-blue-200'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${!trainingRecord.documentViewed ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white'}`}>
                                                2
                                            </div>
                                            <span className={`font-bold ${!trainingRecord.documentViewed ? 'text-gray-500' : 'text-blue-900'}`}>
                                                Knowledge Verification
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 pl-9 mb-4">
                                            Complete the assessment to prove competency.
                                        </p>

                                        <button
                                            disabled={!trainingRecord.documentAcknowledged || trainingRecord.status === 'LOCKED'}
                                            onClick={async () => {
                                                if (!id) return;
                                                // Create/Resume Session
                                                try {
                                                    const res = await startTraining(id);
                                                    if (res.sessionId) {
                                                        navigate(`/assessment/${res.sessionId}`);
                                                    } else {
                                                        alert('Failed to start assessment: No session ID returned.');
                                                    }
                                                } catch (err: any) {
                                                    console.error('Start Training Error:', err);
                                                    alert(err.response?.data?.message || 'Failed to start assessment.');
                                                }
                                            }}
                                            className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                                        >
                                            {trainingRecord.status === 'FAILED' ? 'Retake Assessment' : 'Take Assessment'}
                                        </button>

                                        {trainingRecord.status === 'FAILED' && (
                                            <p className="text-red-500 text-sm mt-2 text-center">
                                                Assessment failed. You can retake the assessment.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

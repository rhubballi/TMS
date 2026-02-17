import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, viewDocument, confirmAcknowledge } from '../services/api';
import { Header } from '../components/Header';
import { ArrowLeft, ArrowRight, FileText, AlertTriangle, CheckSquare, ShieldCheck } from 'lucide-react';

export const DocumentViewerPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchSession();
        }
    }, [id]);

    const fetchSession = async () => {
        try {
            // Try treating ID as a TrainingRecord ID (standard flow)
            try {
                const data = await viewDocument(id!);
                // Map TrainingRecord data to component state
                if (data && data.training) {
                    setSession({
                        ...data,
                        fileName: data.training.title || 'Document',
                        fileUrl: data.training.content?.fileUrl || '',
                        status: data.status,
                        recordId: data._id,
                        documentAcknowledged: data.documentAcknowledged
                    });
                    return;
                }
            } catch (recordError) {
                console.warn("Not a training record, trying session...", recordError);
            }

            const data = await getSession(id!);
            setSession(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load document');
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async () => {
        try {
            await confirmAcknowledge(id!);
            setSession((prev: any) => ({ ...prev, documentAcknowledged: true }));
        } catch (err) {
            console.error('Acknowledgment failed', err);
        }
    };

    const handleTakeTest = () => {
        if (!session.documentAcknowledged) {
            alert("Mandatory: You must acknowledge the document before taking the assessment.");
            return;
        }
        navigate(`/assessment/${id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header title="Document Viewer" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header title="Document Viewer" />
                <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                    <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
                    <button onClick={() => navigate('/')} className="text-blue-600 hover:text-blue-800">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Construct full URL for the file
    const fileUrl = session.fileUrl ? `http://localhost:4000/${session.fileUrl}` : '';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header title="Training Document" />

            <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900">{session.fileName}</h1>
                </div>

                <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
                    {fileUrl ? (
                        <iframe
                            src={fileUrl}
                            className="w-full h-full min-h-[600px]"
                            title="Document Viewer"
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12">
                            <FileText className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-gray-500">Document preview not available</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-between items-center bg-gray-100 p-4 rounded-xl border border-gray-200">
                    <div>
                        {!session.documentAcknowledged ? (
                            <div className="flex items-center gap-2 text-amber-700">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="text-sm font-bold">Acknowledgment Required before Assessment</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-700 px-3 py-1 bg-green-50 rounded-lg border border-green-200">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-widest">Document Acknowledged</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        {!session.documentAcknowledged && (
                            <button
                                onClick={handleAcknowledge}
                                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 font-black uppercase tracking-widest shadow-sm transition-all hover:shadow-md"
                            >
                                <CheckSquare className="w-5 h-5" />
                                Acknowledge Document
                            </button>
                        )}
                        <button
                            onClick={handleTakeTest}
                            disabled={!session.documentAcknowledged}
                            className={`px-6 py-3 rounded-lg flex items-center gap-2 font-black uppercase tracking-widest shadow-sm transition-all hover:shadow-md ${session.documentAcknowledged
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-400'
                                }`}
                        >
                            Take Assessment
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

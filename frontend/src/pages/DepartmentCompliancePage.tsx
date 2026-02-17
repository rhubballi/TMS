import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, FileText, CheckCircle2, Clock, XCircle, AlertCircle, Loader2, Lock } from 'lucide-react';
import { getComplianceDetails } from '../services/api';

interface TrainingRecord {
    _id: string;
    user: { _id: string; name: string; email: string; department: string };
    training: { title: string; code: string; version?: string };
    status: string;
    score?: number;
    assignedDate: string;
    dueDate: string;
    assessmentAttempts: number;
    completedDate?: string;
}

export const DepartmentCompliancePage: React.FC = () => {
    const { trainingId, department } = useParams<{ trainingId: string, department: string }>();
    const navigate = useNavigate();
    const [records, setRecords] = useState<TrainingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('DepartmentCompliancePage Mounted. Params:', { trainingId, department });
        fetchDetails();
    }, [trainingId, department]);

    const fetchDetails = async () => {
        if (!trainingId || !department) {
            console.error('Missing params:', { trainingId, department });
            return;
        }
        setLoading(true);
        try {
            console.log(`Fetching details for ${trainingId} / ${department}`);
            const data = await getComplianceDetails(trainingId, department);
            console.log('Compliance Data Received:', data);
            setRecords(data);
        } catch (err: any) {
            console.error('Fetch Error:', err);
            setError(err.message || 'Failed to fetch compliance details');
        } finally {
            setLoading(false);
        }
    };


    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'LOCKED': return <Lock className="w-4 h-4 text-gray-500" />;
            case 'EXPIRED': return <AlertCircle className="w-4 h-4 text-red-600" />;
            case 'NOT_ASSIGNED': return <Users className="w-4 h-4 text-gray-400" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            case 'LOCKED': return 'bg-gray-800 text-white';
            case 'EXPIRED': return 'bg-red-100 text-red-800';
            case 'NOT_ASSIGNED': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const trainingTitle = records.length > 0 && records[0].training ? records[0].training.title : 'Training';

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 py-4">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{department} Department</h1>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> {trainingTitle}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                        {error}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-sm border overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Assigned Staff Details
                            </h2>
                            <div className="text-sm text-gray-500">
                                {records.length} Staff Members
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned / Due</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed At</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Attempts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {records.map((r: any) => {
                                        if (!r.user) return null; // Skip if user data is missing
                                        return (
                                            <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-gray-900">{r.user.name || 'Unknown User'}</p>
                                                    <p className="text-xs text-gray-500">{r.user.email || 'No Email'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                                                        {getStatusIcon(r.status)}
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className={`text-sm font-bold ${r.score && r.score >= 80 ? 'text-green-600' : r.score ? 'text-red-600' : 'text-gray-400'}`}>
                                                        {r.score !== undefined ? `${r.score}%` : '--'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    <p className="text-gray-500">Assigned: {new Date(r.assignedDate).toLocaleDateString()}</p>
                                                    <p className={`font-medium ${new Date(r.dueDate) < new Date() && r.status !== 'COMPLETED' ? 'text-red-600' : 'text-gray-600'}`}>
                                                        Due: {new Date(r.dueDate).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {r.completedDate ? new Date(r.completedDate).toLocaleString() : '--'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                                                        {r.assessmentAttempts || 0}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

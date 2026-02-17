import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Play,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  ChevronRight,
  PlayCircle,
  BarChart3,
  Calendar,
  Timer,
  Upload,
  FileUp,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getMyTrainingRecords,
  getMyLearningProgress,
  getResumePoint,
  startTraining,
  viewDocument,
  API_BASE_URL
} from '../services/api';
import { Header } from '../components/Header';

interface TrainingRecord {
  _id: string;
  training?: {
    _id: string;
    title: string;
    code: string;
    description: string;
    type: string;
  };
  trainingMaster?: {
    _id: string;
    title: string;
    training_code: string;
    description: string;
    training_type: string;
  };
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'OVERDUE' | 'LOCKED';
  dueDate: string;
  documentViewed: boolean;
  assessmentAttempts: number;
  score?: number;
  passed: boolean;
  // Sprint 3: Certificate fields
  certificateId?: string;
  certificateUrl?: string;
  expiryDate?: string;
}

interface LearningProgress {
  _id: string;
  trainingRecord: TrainingRecord;
  overallProgress: {
    totalContentItems: number;
    completedContentItems: number;
    totalTimeSpent: number;
    lastActivityAt: string;
  };
  assessmentReady: boolean;
  contentItems: Array<{
    contentId: string;
    contentType: string;
    title: string;
    isCompleted: boolean;
    lastAccessedAt: string;
    timeSpent: number;
  }>;
}

export const DashboardPage: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumePoints, setResumePoints] = useState<Record<string, any>>({});


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [records, progress] = await Promise.all([
        getMyTrainingRecords(),
        getMyLearningProgress()
      ]);

      setTrainingRecords(records);
      setLearningProgress(progress);

      // Fetch resume points for active trainings
      const resumeData: Record<string, any> = {};
      for (const record of records) {
        if (record.status === 'IN_PROGRESS') {
          try {
            const resume = await getResumePoint(record._id);
            resumeData[record._id] = resume;
          } catch (error) {
            console.error('Error fetching resume point:', error);
          }
        }
      }
      setResumePoints(resumeData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartTraining = async (recordId: string) => {
    try {
      await startTraining(recordId);
      fetchDashboardData(); // Refresh
    } catch (error) {
      console.error('Error starting training:', error);
    }
  };

  const handleViewDocument = async (recordId: string) => {
    try {
      await viewDocument(recordId);
      fetchDashboardData(); // Refresh
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };


  const handleResume = (recordId: string, resumePoint: any) => {
    if (resumePoint.nextAction === 'assessment') {
      navigate(`/assessment/${recordId}`);
    } else {
      // Navigate to document viewer with resume point
      navigate(`/training/${recordId}/document?resume=${encodeURIComponent(JSON.stringify(resumePoint.resumePoint))}`);
    }
  };

  // Calculate overall progress statistics
  const calculateOverallStats = () => {
    const totalTrainings = trainingRecords.length;
    const completedTrainings = trainingRecords.filter(r => r.status === 'COMPLETED').length;
    const inProgressTrainings = trainingRecords.filter(r => r.status === 'IN_PROGRESS').length;
    const pendingTrainings = trainingRecords.filter(r => r.status === 'PENDING').length;
    const failedTrainings = trainingRecords.filter(r => r.status === 'FAILED').length;

    const overallCompletion = totalTrainings > 0 ? Math.round((completedTrainings / totalTrainings) * 100) : 0;

    return {
      totalTrainings,
      completedTrainings,
      inProgressTrainings,
      pendingTrainings,
      failedTrainings,
      overallCompletion
    };
  };

  const stats = calculateOverallStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <Play className="w-5 h-5 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="TMS Dashboard" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header title="TMS Dashboard" />

      <main className="tms-container space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="tms-heading-1">Welcome back, {user?.name}</h1>
            <p className="text-slate-500 mt-1">Review your training status and upcoming requirements.</p>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="tms-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Assigned</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalTrainings}</p>
            </div>
          </div>

          <div className="tms-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-slate-900">{stats.completedTrainings}</p>
            </div>
          </div>

          <div className="tms-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">In Progress</p>
              <p className="text-2xl font-bold text-slate-900">{stats.inProgressTrainings}</p>
            </div>
          </div>

          <div className="tms-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
              <Target className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Compliance Rate</p>
              <p className="text-2xl font-bold text-slate-900 text-green-600">{stats.overallCompletion}%</p>
            </div>
          </div>
        </div>


        {/* Table Section */}
        <div className="tms-card">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="tms-heading-2 flex items-center gap-2 font-black">
                <Shield className="w-5 h-5 text-blue-600" />
                Training Records
              </h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Consolidated Training History</p>
            </div>
            <Link to="/history" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              View Personal History
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="tms-table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th className="tms-table-th">Training Module</th>
                  <th className="tms-table-th">Due Date</th>
                  <th className="tms-table-th">Status</th>
                  <th className="tms-table-th text-center">Attempts</th>
                  <th className="tms-table-th text-center">Certificate</th>
                  <th className="tms-table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trainingRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      No active training records found.
                    </td>
                  </tr>
                ) : (
                  trainingRecords.map((record) => (
                    <tr key={record._id} className="tms-table-row">
                      <td className="tms-table-td">
                        <div className="font-bold text-slate-900">
                          {record.trainingMaster?.title || record.training?.title || 'System Training'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-1 uppercase">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 border border-slate-200">
                            {record.trainingMaster?.training_code || record.training?.code || 'GENERIC'}
                          </span>
                          <span>•</span>
                          <span className="text-slate-400">Ver. Current</span>
                        </div>
                      </td>
                      <td className="tms-table-td">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">
                            {new Date(record.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="tms-table-td">
                        <span className={`tms-badge border ${record.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          record.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            record.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              record.status === 'OVERDUE' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                          {record.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {record.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="tms-table-td text-center font-bold text-slate-500">
                        {record.assessmentAttempts}
                      </td>
                      <td className="tms-table-td text-center">
                        {record.status === 'COMPLETED' && record.certificateUrl ? (
                          <a
                            href={`${API_BASE_URL}${record.certificateUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-xs"
                          >
                            <Award className="w-3.5 h-3.5" />
                            GET
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="tms-table-td text-right">
                        <Link
                          to={`/training/${record._id}/details`}
                          className="tms-btn-primary py-1.5 px-3 text-xs"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
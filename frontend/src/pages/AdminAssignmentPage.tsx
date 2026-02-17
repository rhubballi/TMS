import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building,
  Users,
  Calendar,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Activity,
  ChevronRight,
  Search,
  Filter,
  ClipboardList,
  AlertCircle,
  Layers,
  UserCheck,
  Send
} from 'lucide-react';
import { getTrainings, assignTraining } from '../services/api';
import { DEPARTMENTS } from '../constants/departments';

interface Training {
  _id: string;
  code: string;
  title: string;
  type: string;
  mandatory: boolean;
}

export const AdminAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [assignmentType, setAssignmentType] = useState<'department' | 'all'>('department');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const trainingsData = await getTrainings();
      setTrainings(trainingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSelection = (dept: string) => {
    setSelectedDepartments(prev =>
      prev.includes(dept)
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTraining || !dueDate) {
      alert('Missing required information: Please select a training module and a due date.');
      return;
    }
    if (assignmentType === 'department' && selectedDepartments.length === 0) {
      alert('No departments selected: Please choose at least one business unit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await assignTraining({
        departments: assignmentType === 'department' ? selectedDepartments : undefined,
        targetAudience: assignmentType === 'all' ? 'ALL' : undefined,
        trainingId: selectedTraining,
        dueDate,
        assignmentSource: 'manual',
      });

      alert('Assignments successfully created and notifications queued.');
      setSelectedDepartments([]);
      setSelectedTraining('');
      setDueDate('');
      setAssignmentType('department');
    } catch (error: any) {
      console.error('Error creating assignments:', error);
      alert('Assignment failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-blue-600 animate-pulse mx-auto opacity-50" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Assignment Registry...</p>
        </div>
      </div>
    );
  }

  const selectedTrainingData = trainings.find(t => t._id === selectedTraining);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="tms-container py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/trainings')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="tms-heading-2 text-slate-900">Training Assignment</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Assign Modules to Personnel</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/trainings"
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <ClipboardList className="w-4 h-4 text-blue-500" />
              Training Registry
            </Link>
          </div>
        </div>
      </header>

      <main className="tms-container py-10 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Control Panel */}
          <div className="lg:col-span-12 xl:col-span-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Send className="w-32 h-32 text-slate-900 rotate-12" />
              </div>

              <div className="flex items-center gap-4 mb-10 relative">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <UserPlus className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="tms-heading-3 text-slate-900">Assignment Details</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configure target audience and deadline</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                      Select Training Module
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTraining}
                        onChange={(e) => setSelectedTraining(e.target.value)}
                        className="tms-input appearance-none pr-10"
                        required
                      >
                        <option value="">Choose a training...</option>
                        {trainings.map((training) => (
                          <option key={training._id} value={training._id}>
                            [{training.code}] {training.title}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                      Due Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="tms-input pl-11"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAssignmentType('department')}
                      className={`flex items-center justify-between p-5 border-2 rounded-2xl transition-all group ${assignmentType === 'department' ? 'bg-blue-50 border-blue-600 shadow-md ring-4 ring-blue-50/50' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className={`p-3 rounded-xl ${assignmentType === 'department' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 group-hover:text-blue-500 shadow-sm'}`}>
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${assignmentType === 'department' ? 'text-blue-900' : 'text-slate-600'}`}>Departmental</p>
                          <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase">Specific Business Units</p>
                        </div>
                      </div>
                      {assignmentType === 'department' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAssignmentType('all')}
                      className={`flex items-center justify-between p-5 border-2 rounded-2xl transition-all group ${assignmentType === 'all' ? 'bg-emerald-50 border-emerald-600 shadow-md ring-4 ring-emerald-50/50' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className={`p-3 rounded-xl ${assignmentType === 'all' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 group-hover:text-emerald-500 shadow-sm'}`}>
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${assignmentType === 'all' ? 'text-emerald-900' : 'text-slate-600'}`}>Global Outreach</p>
                          <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase">Complete Human Registry</p>
                        </div>
                      </div>
                      {assignmentType === 'all' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 opacity-60" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide max-w-sm">
                      Confirming assignment will trigger system-wide notifications and compliance tracking updates.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Activity className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    Create Assignment
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Target Selection View */}
            <AnimatePresence mode="wait">
              {assignmentType === 'department' ? (
                <motion.div
                  key="deps"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="tms-heading-3 text-slate-900">Select Departments</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Select business units for this module</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
                      Selected Units: {selectedDepartments.length}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {DEPARTMENTS.map((dept) => (
                      <label
                        key={dept}
                        className={`group flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${selectedDepartments.includes(dept)
                          ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100'
                          : 'bg-slate-50/50 border-slate-100 hover:border-slate-300 text-slate-600'
                          }`}
                      >
                        <div className="relative flex items-center justify-center mr-3">
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept)}
                            onChange={() => handleDepartmentSelection(dept)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all opacity-0 absolute"
                          />
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${selectedDepartments.includes(dept) ? 'bg-white border-white text-blue-600' : 'bg-white border-slate-200 text-transparent'}`}>
                            <CheckCircle2 className="w-3 h-3 stroke-[4]" />
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">{dept}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="global"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-emerald-900 text-emerald-50 p-10 rounded-3xl border border-emerald-800 shadow-xl overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Users className="w-48 h-48 text-white rotate-12" />
                  </div>
                  <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-800 rounded-3xl flex items-center justify-center shadow-2xl">
                      <Building className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter">Organization-Wide Assignment</h2>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-2">Full Enterprise coverage</p>
                    </div>
                    <p className="text-sm font-medium text-emerald-100/70 max-w-md leading-relaxed">
                      This will assign the mandatory training module to all registered personnel in the organization.
                    </p>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-800/50 rounded-full border border-emerald-700/50 text-[10px] font-black uppercase tracking-widest">
                      <Activity className="w-3 h-3 animate-pulse" /> Live Status: Universal Access Enabled
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contextual Intelligence Sidebar */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-8">
            <div className="tms-card bg-slate-900 border-none sticky top-28 shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="p-8 relative">
                <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Assignment Summary
                </h2>

                <div className="space-y-6">
                  <div className="pb-6 border-b border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Module Selected</p>
                    <p className="text-sm font-black text-white uppercase tracking-tight">
                      {selectedTrainingData ? `[${selectedTrainingData.code}] ${selectedTrainingData.title}` : 'Awaiting Selection...'}
                    </p>
                    {selectedTrainingData && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[8px] font-black uppercase border border-slate-700">{selectedTrainingData.type}</span>
                        {selectedTrainingData.mandatory && <span className="text-[8px] font-black text-amber-500 flex items-center gap-1 uppercase tracking-widest"><ShieldCheck className="w-3 h-3" /> Mandatory</span>}
                      </div>
                    )}
                  </div>

                  <div className="pb-6 border-b border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Audience</p>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${assignmentType === 'all' ? 'bg-emerald-900 text-emerald-400' : 'bg-blue-900 text-blue-400'}`}>
                        {assignmentType === 'all' ? <Users className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-widest">
                          {assignmentType === 'all' ? 'Global Outreach' : 'Departmental Filter'}
                        </p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                          {assignmentType === 'all' ? 'Statutory Enterprise Scope' : `${selectedDepartments.length} Service Units Active`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pb-6">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Due Date</p>
                    <div className="flex items-center gap-3 text-white">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      <p className="text-xs font-black uppercase tracking-widest">
                        {dueDate ? new Date(dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending Entry'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className={`p-4 rounded-2xl border ${selectedTraining && (assignmentType === 'all' || selectedDepartments.length > 0) && dueDate ? 'bg-blue-600 border-blue-500 animate-pulse-subtle' : 'bg-slate-800 border-slate-700 opacity-50'} transition-all`}>
                      <div className="flex items-center gap-3 text-white">
                        <UserCheck className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Ready to Assign</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
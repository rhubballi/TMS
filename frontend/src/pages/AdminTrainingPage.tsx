import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Settings,
  ArrowLeft,
  Search,
  Filter,
  Activity,
  ShieldCheck,
  ChevronRight,
  FileText,
  BookOpen,
  Users,
  AlertCircle,
  X,
  Save,
  RotateCcw
} from 'lucide-react';
import { getTrainings, createTraining, updateTraining, deleteTraining } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Training {
  _id: string;
  code: string;
  title: string;
  description: string;
  purpose: string;
  type: 'Document-driven' | 'Role-based' | 'Instructor-led' | 'External';
  mandatory: boolean;
  validityPeriod: number;
  active: boolean;
  createdBy: {
    name: string;
  };
}

export const AdminTrainingPage: React.FC = () => {
  const navigate = useNavigate();
  const { } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    purpose: '',
    type: 'Document-driven' as Training['type'],
    mandatory: true,
    validityPeriod: 365,
  });

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const data = await getTrainings();
      setTrainings(data);
    } catch (error) {
      console.error('Error fetching trainings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTraining) {
        await updateTraining(editingTraining._id, formData);
      } else {
        await createTraining(formData);
      }
      fetchTrainings();
      resetForm();
    } catch (error) {
      console.error('Error saving training:', error);
    }
  };

  const handleEdit = (training: Training) => {
    setEditingTraining(training);
    setFormData({
      code: training.code,
      title: training.title,
      description: training.description,
      purpose: training.purpose,
      type: training.type,
      mandatory: training.mandatory,
      validityPeriod: training.validityPeriod,
    });
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this training? This action is irreversible.')) {
      try {
        await deleteTraining(id);
        fetchTrainings();
      } catch (error) {
        console.error('Error deleting training:', error);
      }
    }
  };

  const handleToggleActive = async (training: Training) => {
    try {
      await updateTraining(training._id, { active: !training.active });
      fetchTrainings();
    } catch (error) {
      console.error('Error toggling training status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      description: '',
      purpose: '',
      type: 'Document-driven',
      mandatory: true,
      validityPeriod: 365,
    });
    setEditingTraining(null);
    setShowCreateForm(false);
  };

  const filteredTrainings = trainings.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Activity className="w-12 h-12 text-blue-600 animate-pulse mx-auto opacity-50" />
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Training Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="tms-container py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="tms-heading-2">Training Modules</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Management of Standard Training Records</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Training
            </button>
          </div>
        </div>
      </header>

      <main className="tms-container py-8 max-w-7xl">
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-10 overflow-hidden"
            >
              <div className="bg-white p-8 rounded-3xl border-2 border-blue-100 shadow-xl relative">
                <button
                  onClick={resetForm}
                  className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    {editingTraining ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="tms-heading-3 text-slate-900">
                      {editingTraining ? 'Edit Training Module' : 'Add New Module'}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Training Definition Entry</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                        Training Code (Unique Identification)
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="tms-input"
                        placeholder="e.g., SOP-SAFE-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                        Training Title
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="tms-input"
                        placeholder="e.g., Annual Safety Recertification"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                      Description
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="tms-input resize-none py-3"
                      placeholder="Specify the scope and intent of this training module..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                      Training Objective
                    </label>
                    <textarea
                      required
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      rows={2}
                      className="tms-input resize-none py-3 font-medium border-slate-200"
                      placeholder="State the compliance requirement or target KPI..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                        Training Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Training['type'] })}
                        className="tms-input appearance-none bg-slate-50/50"
                      >
                        <option value="Document-driven">Document-driven</option>
                        <option value="Role-based">Role-based</option>
                        <option value="Instructor-led">Instructor-led</option>
                        <option value="External">External</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                        Validity Period (Days)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.validityPeriod || ''}
                        onChange={(e) => setFormData({ ...formData, validityPeriod: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                        className="tms-input"
                      />
                    </div>

                    <div className="flex items-end pb-1 px-4">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={formData.mandatory}
                            onChange={(e) => setFormData({ ...formData, mandatory: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-600 group-hover:text-blue-600 transition-colors">
                          Mandatory Training
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      {editingTraining ? 'Save Changes' : 'Create Module'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by title or vector code..."
              className="tms-input pl-10 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {[
              { to: '/admin/reports', label: 'Analytics', icon: Activity, color: 'emerald' },
              { to: '/admin/assignments', label: 'Assignments', icon: Users, color: 'blue' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-5 h-12 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm hover:border-${item.color}-200`}
              >
                <item.icon className={`w-4 h-4 text-${item.color}-500`} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="tms-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="tms-heading-3 text-slate-900">Training Registry</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">List of all training modules</p>
            </div>
            <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm">
              Active Modules: {trainings.filter(t => t.active).length}
            </div>
          </div>

          <div className="tms-table-container">
            <table className="tms-table">
              <thead>
                <tr>
                  <th className="tms-table-th">Module Info</th>
                  <th className="tms-table-th">Type</th>
                  <th className="tms-table-th text-center">Status</th>
                  <th className="tms-table-th text-center">Validity</th>
                  <th className="tms-table-th">Action Center</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTrainings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <div className="bg-slate-100 p-6 rounded-3xl">
                          <BookOpen className="w-12 h-12 text-slate-300" />
                        </div>
                        <div>
                          <h3 className="tms-heading-3 text-slate-900">Registry Empty</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Add training modules to populate</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTrainings.map((training, idx) => (
                    <tr key={training._id} className="tms-table-row animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 40}ms` }}>
                      <td className="tms-table-td">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl shadow-sm border ${training.mandatory ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter truncate max-w-[240px]">
                              {training.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                                {training.code}
                              </span>
                              {training.mandatory && (
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Mandatory
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="tms-table-td">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {training.type}
                        </span>
                      </td>
                      <td className="tms-table-td text-center">
                        <button
                          onClick={() => handleToggleActive(training)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all active:scale-95 ${training.active
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                            : 'bg-rose-50 border-rose-100 text-rose-600'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {training.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            {training.active ? 'Active' : 'Inactive'}
                          </div>
                        </button>
                      </td>
                      <td className="tms-table-td text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-black text-slate-900">{training.validityPeriod}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Days</span>
                        </div>
                      </td>
                      <td className="tms-table-td">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/assessment/${training._id}/config`}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Engine Configuration"
                          >
                            <Settings className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(training)}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(training._id)}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-5 h-5 text-blue-500 opacity-60" />
              <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-wide">
                Note: Inactive modules cannot be assigned but remain in the records for historical audit purposes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

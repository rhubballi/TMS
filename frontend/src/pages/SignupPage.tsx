import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, verifyOTP } from '../services/api';
import { motion } from 'framer-motion';
import { User, Mail, Lock, UserPlus, Loader2, AlertCircle, Briefcase, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEPARTMENTS = [
    'R&D', 'Clinical Research/Affairs', 'Manufacturing', 'Quality Assurance',
    'Quality Control', 'Regulatory Affairs', 'Pharmacovigilance',
    'Supply Chain & Logistics', 'Engineering', 'Sales & Marketing',
    'HR', 'Finance', 'IT', 'Legal', 'Other'
];

export const SignupPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Trainee',
        department: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1: Registration, 2: Verification
    const [otp, setOtp] = useState('');
    const [lastEmail, setLastEmail] = useState('');
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const signupData = { ...formData };
            if (signupData.role === 'Administrator') {
                delete (signupData as any).department;
            }
            await register(signupData);
            setLastEmail(formData.email);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await verifyOTP({ email: lastEmail, otp });
            authLogin(res.token, { _id: res._id, name: res.name, email: res.email, role: res.role });

            if (res.role === 'Administrator') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed. Please check your OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card w-full max-w-lg p-8 relative overflow-hidden"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {step === 1 ? 'Create Account' : 'Verify Email'}
                    </h1>
                    <p className="text-slate-500">
                        {step === 1
                            ? 'Join TMS to manage your training compliance'
                            : `We've sent a 6-digit code to ${lastEmail}`}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 mb-6 text-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </motion.div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="glass-input w-full pl-10 p-2.5 rounded-xl text-sm"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="glass-input w-full pl-10 p-2.5 rounded-xl text-sm"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="glass-input w-full pl-10 p-2.5 rounded-xl text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={formData.role === 'Administrator' ? 'md:col-span-2' : ''}>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="glass-input w-full pl-10 p-2.5 rounded-xl text-sm appearance-none"
                                    >
                                        <option value="Trainee">Trainee</option>
                                        <option value="Trainer">Trainer</option>
                                        <option value="QA">QA</option>
                                        <option value="Administrator">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            {formData.role !== 'Administrator' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Department
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <select
                                            name="department"
                                            required={formData.role !== 'Administrator'}
                                            value={formData.department}
                                            onChange={handleChange}
                                            className="glass-input w-full pl-10 p-2.5 rounded-xl text-sm appearance-none"
                                        >
                                            <option value="">Select Department</option>
                                            {DEPARTMENTS.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            Create Account
                        </button>

                        <p className="mt-8 text-center text-slate-500 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-4 text-center">
                                Enter 6-digit Verification Code
                            </label>
                            <div className="flex justify-center gap-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="glass-input w-full max-w-[200px] text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-xl"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            Verify & Sign In
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full text-slate-500 text-sm hover:text-slate-700 transition-colors"
                        >
                            Back to Registration
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

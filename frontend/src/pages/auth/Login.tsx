import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Loader, ArrowRight, User, Eye, EyeOff, Shield, BookOpen } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../../utils/api';

interface LoginProps {
    role?: UserRole;
    title?: string;
}

const roleOrder: UserRole[] = [UserRole.STUDENT, UserRole.PREMIUM_STUDENT, UserRole.INSTRUCTOR, UserRole.ASSISTANT_INSTRUCTOR, UserRole.ADMIN, UserRole.MODERATOR];

const roleLabels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Admin',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.MODERATOR]: 'Moderator',
    [UserRole.INSTRUCTOR]: 'Instructor',
    [UserRole.ASSISTANT_INSTRUCTOR]: 'Assistant',
    [UserRole.STUDENT]: 'Student',
    [UserRole.PREMIUM_STUDENT]: 'Premium',
};

const roleConfig: Record<UserRole, { gradient: string; badge: string; description: string }> = {
    [UserRole.SUPER_ADMIN]: {
        gradient: 'from-violet-500 to-blue-500',
        badge: 'SA',
        description: 'Super Admin has unrestricted access across every module and route.',
    },
    [UserRole.STUDENT]: {
        gradient: 'from-blue-500 to-primary',
        badge: 'ST',
        description: 'Students can access courses, lessons, and certificates.',
    },
    [UserRole.PREMIUM_STUDENT]: {
        gradient: 'from-amber-500 to-orange-500',
        badge: 'PS',
        description: 'Premium Students have access to exclusive advanced content.',
    },
    [UserRole.INSTRUCTOR]: {
        gradient: 'from-emerald-500 to-teal-500',
        badge: 'IN',
        description: 'Instructors can create courses and manage learners.',
    },
    [UserRole.ASSISTANT_INSTRUCTOR]: {
        gradient: 'from-cyan-500 to-blue-400',
        badge: 'AI',
        description: 'Assistant Instructors help manage course content and students.',
    },
    [UserRole.ADMIN]: {
        gradient: 'from-fuchsia-500 to-rose-500',
        badge: 'AD',
        description: 'Admins can manage users, approvals, and settings.',
    },
    [UserRole.MODERATOR]: {
        gradient: 'from-indigo-500 to-purple-500',
        badge: 'MO',
        description: 'Moderators handle community discussions and enrollments.',
    },
};

const parseRole = (value: string | null | undefined): UserRole | null => {
    if (!value) return null;
    if (Object.values(UserRole).includes(value as UserRole)) {
        return value as UserRole;
    }
    return null;
};

const Login: React.FC<LoginProps> = ({ role, title }) => {
    const [searchParams] = useSearchParams();
    const roleFromQuery = parseRole(searchParams.get('role'));
    const fallbackRole = role ?? UserRole.STUDENT;
    const initialRole = roleFromQuery ?? fallbackRole;

    const [isRegister, setIsRegister] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setSelectedRole(roleFromQuery ?? fallbackRole);
    }, [roleFromQuery, fallbackRole]);

    const config = useMemo(() => roleConfig[selectedRole], [selectedRole]);
    const computedTitle = useMemo(
        () => title ?? `${roleLabels[selectedRole]} Access`,
        [title, selectedRole]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        if (isRegister && name.trim().length < 2) {
            setError('Name must be at least 2 characters.');
            setIsLoading(false);
            return;
        }

        if (isRegister && password !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        if (isRegister && (password.length < 8 || !/\d/.test(password))) {
            setError('Password must be at least 8 characters and include at least one number.');
            setIsLoading(false);
            return;
        }

        try {
            if (isRegister) {
                const response = await apiService.auth.register({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    role: selectedRole,
                });

                if (response.data.user.role !== selectedRole) {
                    setError('Registration failed because the selected role did not match.');
                    setIsLoading(false);
                    return;
                }

                login(response.data.token, response.data.user);
                setSuccess('Account created. Redirecting to dashboard...');
                setTimeout(() => navigate('/dashboard'), 700);
                return;
            }

            const response = await apiService.auth.login(email.trim(), password);

            const returnedRole = response.data?.user?.role as UserRole;
            const isMatch = returnedRole === selectedRole;
            const isStudentGroup = (selectedRole === UserRole.STUDENT && (returnedRole === UserRole.STUDENT || returnedRole === UserRole.PREMIUM_STUDENT));
            const isInstructorGroup = (selectedRole === UserRole.INSTRUCTOR && (returnedRole === UserRole.INSTRUCTOR || returnedRole === UserRole.ASSISTANT_INSTRUCTOR));
            const isAdminGroup = (selectedRole === UserRole.ADMIN && (returnedRole === UserRole.ADMIN || returnedRole === UserRole.SUPER_ADMIN || returnedRole === UserRole.MODERATOR));

            if (!isMatch && !isStudentGroup && !isInstructorGroup && !isAdminGroup) {
                const roleName = roleLabels[returnedRole] ?? 'another';
                setError(`This account belongs to ${roleName.toLowerCase()}. Select the correct role and try again.`);
                setIsLoading(false);
                return;
            }

            login(response.data.token, response.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.msg ||
                'Something went wrong. Please try again.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-dark-bg dark:via-dark-card dark:to-dark-bg p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br ${config.gradient} rounded-full blur-[120px] opacity-20`} />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-[120px] opacity-10" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl shadow-black/5 dark:shadow-black/30 overflow-hidden"
                >
                    <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />

                    <div className="p-8">
                        <div className="text-center mb-8">
                            <motion.div
                                animate={{ scale: [1, 1.06, 1] }}
                                transition={{ duration: 2.8, repeat: Infinity }}
                                className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${config.gradient} rounded-2xl shadow-lg mb-4`}
                            >
                                <span className="text-white text-xl font-black tracking-wide">{config.badge}</span>
                            </motion.div>
                            <h2 className="text-2xl font-black text-dark-bg dark:text-light mb-1">{computedTitle}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {isRegister
                                    ? 'Register with name, email, password, and role.'
                                    : 'Login with email, password, and role.'}
                            </p>
                        </div>

                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(false);
                                    setError('');
                                    setSuccess('');
                                }}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isRegister
                                    ? 'bg-white dark:bg-dark-bg text-dark-bg dark:text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(true);
                                    setError('');
                                    setSuccess('');
                                }}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isRegister
                                    ? 'bg-white dark:bg-dark-bg text-dark-bg dark:text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                Register
                            </button>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-800 font-medium"
                                >
                                    {error}
                                </motion.div>
                            )}
                            {success && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm border border-emerald-100 dark:border-emerald-800 font-medium"
                                >
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AnimatePresence>
                                {isRegister && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-1.5 overflow-hidden"
                                    >
                                        <label className="text-xs font-semibold dark:text-gray-300 uppercase tracking-wider">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                required={isRegister}
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-all outline-none"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold dark:text-gray-300 uppercase tracking-wider">
                                    Role
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {roleOrder.map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setSelectedRole(r)}
                                            className={`py-2 rounded-lg text-xs font-bold border transition-all ${selectedRole === r
                                                ? `bg-gradient-to-r ${roleConfig[r].gradient} text-white border-transparent`
                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                                                }`}
                                        >
                                            {roleLabels[r]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold dark:text-gray-300 uppercase tracking-wider">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-all outline-none"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold dark:text-gray-300 uppercase tracking-wider">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-all outline-none"
                                        placeholder={isRegister ? 'Minimum 6 characters' : 'Your secure password'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isRegister && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="space-y-1.5 overflow-hidden"
                                    >
                                        <label className="text-xs font-semibold dark:text-gray-300 uppercase tracking-wider">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required={isRegister}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white transition-all outline-none"
                                                placeholder="Re-enter password"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                disabled={isLoading}
                                className={`w-full py-4 bg-gradient-to-r ${config.gradient} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
                            >
                                {isLoading ? (
                                    <Loader className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>{isRegister ? 'Create Account' : 'Login to Dashboard'}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{config.description}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;


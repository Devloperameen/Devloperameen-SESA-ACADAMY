import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
    CreditCard, Lock, CheckCircle, ArrowLeft, Smartphone, Building2, 
    ShieldCheck, Zap, Info, Upload, AlertCircle, Sparkles, Receipt
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../utils/toast';

const Payment: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [step, setStep] = useState<'selection' | 'details' | 'success'>('selection');
    const [loading, setLoading] = useState(false);
    const [provider, setProvider] = useState<'chapa' | 'telebirr' | 'cbe_birr' | 'bank_transfer' | 'stripe'>('chapa');
    const [file, setFile] = useState<File | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [course, setCourse] = useState<any>(null);

    const { token } = useAuth();
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('courseId');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        if (!courseId) {
            navigate('/student/browse');
            return;
        }

        const fetchCourse = async () => {
            try {
                const res = await axios.get(`${API_URL}/courses/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourse(res.data);
            } catch (err) {
                showError('Failed to load course details');
            }
        };

        if (token) fetchCourse();
    }, [courseId, token, API_URL, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload: any = { 
            watchedPart1: true,
            paymentMethod: provider,
            transactionId: transactionId
        };

        if ((provider === 'bank_transfer' || provider === 'telebirr' || provider === 'cbe_birr') && file) {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64 = result.split(',')[1] || result;
                    resolve(base64);
                };
                reader.onerror = reject;
            });
            reader.readAsDataURL(file);
            try {
                payload.paymentProofUrl = await base64Promise;
            } catch (err) {
                showError('Failed to read screenshot file');
                setLoading(false);
                return;
            }
        }

        try {
            await axios.post(
                `${API_URL}/enrollments/request/${courseId}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showSuccess('Request submitted! Enrollment pending admin verification.');
            setStep('success');
        } catch (error: any) {
            showError(error?.response?.data?.message || 'Failed to submit enrollment request');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center p-10 bg-white dark:bg-dark-card rounded-[2.5rem] shadow-premium border border-emerald-100 dark:border-emerald-900/30"
                >
                    <div className="w-20 h-20 bg-emerald-500/20 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="h-10 w-10" />
                    </div>
                    <h2 className="text-3xl font-black text-dark-bg dark:text-white mb-4">{t('Request Received!', 'ጥያቄው ደርሷል!')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed font-medium">
                        {t('Your payment details have been submitted for verification. An admin will review and unlock your course shortly.', 'የክፍያ ዝርዝሮችዎ ለማረጋገጫ ቀርበዋል። የአስተዳዳሪው ካረጋገጡ በኋላ ኮርሱ ይከፈታል።')}
                    </p>
                    <Link
                        to="/dashboard"
                        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-dark-bg dark:bg-white text-white dark:text-dark-bg font-black hover:scale-105 transition-all shadow-xl"
                    >
                        {t('Go to Dashboard', 'ወደ ዳሽቦርድ ሂድ')}
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="py-12 px-4 max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12">
                {/* Left: Summary */}
                <div className="lg:w-1/2 space-y-8">
                    <div>
                        <Link to={`/student/course-view/${courseId}`} className="inline-flex items-center gap-2 text-primary font-bold text-sm mb-6 hover:gap-3 transition-all">
                            <ArrowLeft className="w-4 h-4" /> {t('Back to Course', 'ወደ ኮርሱ ተመለስ')}
                        </Link>
                        <h1 className="text-4xl font-black text-dark-bg dark:text-white mb-4">{t('Finalize Enrollment', 'ምዝገባውን ያጠናቅቁ')}</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{t('You are one step away from unlocking premium lessons, quizzes, and certificates.', 'ፕሪሚየም ትምህርቶችን፣ ፈተናዎችን እና ሰርተፍኬቶችን ለመክፈት አንድ እርምጃ ቀርቶታል።')}</p>
                    </div>

                    {course && (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
                                <Sparkles className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">Selected course</span>
                                <h3 className="text-2xl font-black text-dark-bg dark:text-white mb-2">{course.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">{course.description}</p>
                                
                                <div className="flex items-center justify-between pt-6 border-t border-primary/10">
                                    <span className="text-gray-400 font-bold uppercase text-[10px]">{t('Total Amount', 'ጠቅላላ ክፍያ')}</span>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-primary">ETB {course.price?.toLocaleString()}</div>
                                        <p className="text-[10px] text-gray-400 font-bold">{t('One-time payment for full access', 'ለሙሉ አገልግሎት የአንድ ጊዜ ክፍያ')}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800">
                            <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2" />
                            <h4 className="font-bold text-sm text-dark-bg dark:text-white">{t('Secure Checkout', 'ደህንነቱ የተጠበቀ')}</h4>
                            <p className="text-[10px] text-gray-400">{t('Encrypted data & safe transactions', 'የተመሰጠረ መረጃ እና ደህንነቱ የተጠበቀ ግብይት')}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800">
                            <Zap className="w-6 h-6 text-amber-500 mb-2" />
                            <h4 className="font-bold text-sm text-dark-bg dark:text-white">{t('Instant Activation', 'ፈጣን አገልግሎት')}</h4>
                            <p className="text-[10px] text-gray-400">{t('Auto-unlock via Chapa/Telebirr', 'በቻፓ/ቴሌብር በራስ-ሰር ይከፈታል')}</p>
                        </div>
                    </div>
                </div>

                {/* Right: Payment Method */}
                <div className="lg:w-1/2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-dark-card rounded-[2.5rem] shadow-premium border border-gray-100 dark:border-gray-800 p-8 md:p-10"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-dark-bg dark:text-white">{t('Payment Method', 'የክፍያ ዘዴ')}</h2>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 mb-8">
                            {[
                                { id: 'chapa', name: 'Chapa', desc: 'Auto-unlock', icon: Zap, color: 'hover:border-blue-400' },
                                { id: 'telebirr', name: 'Telebirr', desc: 'Mobile App', icon: Smartphone, color: 'hover:border-emerald-400' },
                                { id: 'cbe_birr', name: 'CBE Birr', desc: 'Online/Manual', icon: Building2, color: 'hover:border-purple-400' },
                                { id: 'bank_transfer', name: 'Offline Transfer', desc: 'Receipt required', icon: Receipt, color: 'hover:border-amber-400' },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                        setProvider(m.id as any);
                                        setStep('details');
                                    }}
                                    className={`p-5 rounded-[1.5rem] border-2 text-left transition-all ${
                                        provider === m.id 
                                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' 
                                            : `border-gray-100 dark:border-gray-800 ${m.color} hover:shadow-md`
                                    }`}
                                >
                                    <m.icon className={`w-6 h-6 mb-3 ${provider === m.id ? 'text-primary' : 'text-gray-400'}`} />
                                    <h4 className="font-bold text-sm text-dark-bg dark:text-white">{m.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">{m.desc}</p>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.form
                                key={provider}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                {provider === 'chapa' ? (
                                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                                        <Info className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            {t('You will be redirected to Chapa secure checkout. Supports Telebirr, CBE Birr, and International Cards.', 'ወደ ቻፓ የክፍያ ገፅ ይወሰዳሉ። ቴሌብር፣ ሲቢኢ ብር እና ዓለም አቀፍ ካርዶችን ይደግፋል።')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('Transaction ID / Ref', 'የግብይት መለያ')}</label>
                                            <input 
                                                required
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                placeholder="e.g. TX-4927103"
                                                className="w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-bg text-dark-bg dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t('Upload Receipt', 'ደረሰኝ ይላኩ')}</label>
                                            <div className="relative group">
                                                <input 
                                                    type="file"
                                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="px-5 py-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-dark-bg/50 flex flex-col items-center justify-center text-center group-hover:border-primary transition-all">
                                                    <Upload className="w-8 h-8 text-gray-300 mb-2 group-hover:text-primary transition-colors" />
                                                    <p className="text-xs font-bold text-gray-500">{file ? file.name : t('Tap to upload screenshot', 'ፎቶ ለማስገባት ይጫኑ')}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{t('JPG, PNG (Max 5MB)', 'JPG፣ PNG (ቢበዛ 5 ሜጋ ባይት)')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-start gap-4">
                                    <AlertCircle className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                                        {t('Requests are processed within 2-6 hours. Ensure you provide valid proof to avoid rejection.', 'ጥያቄዎች ከ2-6 ሰዓታት ውስጥ ምላሽ ያገኛሉ። ውድቅ እንዳይሆን ትክክለኛ መረጃ ይላኩ።')}
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !course}
                                    className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-primary to-secondary text-white font-black hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5" />
                                            {provider === 'chapa' ? t('Proceed to Checkout', 'ክፍያውን ይጀምሩ') : t('Submit Verification', 'ለማረጋገጥ ይላኩ')}
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        </AnimatePresence>

                        <div className="mt-8 flex items-center justify-center gap-6 grayscale opacity-30">
                            <img src="/chapa-logo.png" alt="Chapa" className="h-5" />
                            <img src="/telebirr-logo.png" alt="Telebirr" className="h-4" />
                            <img src="/visa-mastercard.png" alt="Visa Mastercard" className="h-4" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Payment;

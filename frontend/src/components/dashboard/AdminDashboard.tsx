import React from 'react';
import { motion } from 'framer-motion';
import { 
    Shield, 
    Users, 
    BookOpen, 
    DollarSign, 
    TrendingUp, 
    AlertCircle, 
    CheckCircle, 
    UserCheck, 
    Settings,
    ArrowUpRight,
    PieChart as PieChartIcon,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

const COLORS = ['#00C49F', '#FFBB28', '#FF8042'];

interface AdminDashboardProps {
    dashboardData: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    dashboardData
}) => {
    const revenue = dashboardData?.revenueStats;
    const users = dashboardData?.users ?? [];
    const courses = dashboardData?.courses ?? [];
    const pendingQueue = dashboardData?.pendingQueue ?? [];
    const enrollmentStats = dashboardData?.enrollmentStats;

    const stats = [
        { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Active Courses', value: courses.length, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Pending Approvals', value: pendingQueue.length, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Total Revenue', value: `$${(revenue?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Admin Header */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 md:p-10 border border-slate-700/50 shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
                            <Shield className="w-3.5 h-3.5" />
                            Administrative HQ
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black italic text-white tracking-tight">
                            Command <span className="text-blue-400">Center</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium mt-2">Platform-wide overview and auditing tools.</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <Link to="/admin/approvals" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/40 text-xs uppercase tracking-widest">
                            <CheckCircle className="w-4 h-4" /> Approvals
                        </Link>
                        <Link to="/admin/users" className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all border border-slate-700 text-xs uppercase tracking-widest">
                            <UserCheck className="w-4 h-4" /> User Management
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Platform Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <motion.div 
                        key={s.label} 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#112240]/40 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-700/50 hover:border-blue-500/30 transition-all shadow-xl group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-4 rounded-2xl ${s.bg} ${s.color} group-hover:scale-110 transition-transform`}>
                                <s.icon className="w-6 h-6" />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-600" />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-2xl font-black text-white italic">{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions Bar */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 ml-2">Quick Navigation</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Courses', icon: CheckCircle, to: '/admin/approvals', color: 'from-emerald-600 to-teal-600' },
                        { label: 'Users', icon: UserCheck, to: '/admin/users', color: 'from-blue-600 to-cyan-600' },
                        { label: 'Revenue', icon: DollarSign, to: '/dashboard', color: 'from-amber-500 to-orange-500' },
                        { label: 'Settings', icon: Settings, to: '/admin/settings', color: 'from-purple-600 to-violet-600' },
                    ].map((action) => (
                        <Link key={action.label} to={action.to}>
                            <motion.div
                                whileHover={{ y: -3 }}
                                className={`relative rounded-2xl bg-gradient-to-br ${action.color} p-5 flex flex-col items-start gap-2 shadow-lg cursor-pointer group overflow-hidden`}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <action.icon className="w-6 h-6 text-white/90 relative z-10" />
                                <span className="text-xs font-black text-white uppercase tracking-widest relative z-10">{action.label}</span>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Revenue & Activity Chart */}
                <motion.section 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-8 rounded-[2.5rem] bg-[#112240]/40 backdrop-blur-xl border border-slate-700/50 p-8 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white italic">Platform <span className="text-blue-400">Activity</span></h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Enrollment Metrics</p>
                        </div>
                        <div className="p-3 bg-slate-800/80 rounded-2xl">
                            <PieChartIcon className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>

                    {enrollmentStats ? (
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Approved', value: enrollmentStats.approved || 1 },
                                                { name: 'Pending', value: enrollmentStats.pending },
                                                { name: 'Rejected', value: enrollmentStats.rejected }
                                            ]}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={90}
                                            paddingAngle={8} dataKey="value" stroke="none"
                                        >
                                            <Cell fill={COLORS[0]} />
                                            <Cell fill={COLORS[1]} />
                                            <Cell fill={COLORS[2]} />
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pb-2 pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-white">
                                            {enrollmentStats.approved + enrollmentStats.pending + enrollmentStats.rejected}
                                        </p>
                                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">Total Hits</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {[
                                    { label: 'Approved', val: enrollmentStats.approved, color: '#00C49F' },
                                    { label: 'Pending', val: enrollmentStats.pending, color: '#FFBB28' },
                                    { label: 'Rejected', val: enrollmentStats.rejected, color: '#FF8042' }
                                ].map(item => (
                                    <div key={item.label} className="bg-slate-900/40 border border-slate-700/30 p-4 rounded-2xl flex items-center justify-between group hover:border-slate-500/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        <span className="text-lg font-black text-white italic">{item.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center opacity-30">
                            <TrendingUp className="w-12 h-12" />
                        </div>
                    )}
                </motion.section>

                {/* Side Panels */}
                <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 space-y-6">
                    {/* Revenue Sidebar */}
                    <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/20 p-8 shadow-2xl">
                        <DollarSign className="w-8 h-8 text-blue-400 mb-6" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-300 mb-6">Financial Snapshot</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-blue-400/60 uppercase mb-1">Total Assets</p>
                                <p className="text-4xl font-black text-white italic tracking-tighter">${(revenue?.totalRevenue ?? 0).toLocaleString()}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-500/10">
                                <div>
                                    <p className="text-[9px] font-black text-blue-400/60 uppercase">Monthly</p>
                                    <p className="text-xl font-black text-white">${(revenue?.monthlyRevenue ?? 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-blue-400/60 uppercase">Paid Units</p>
                                    <p className="text-xl font-black text-white">{revenue?.totalApprovedEnrollments ?? 0}</p>
                                </div>
                            </div>
                        </div>
                        
                        <button className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all border border-white/10">
                            Detailed Report
                        </button>
                    </div>

                    {/* Pending Actions */}
                    <div className="rounded-[2.5rem] bg-[#112240]/40 backdrop-blur-xl border border-slate-700/50 p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pipeline</h3>
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-black uppercase tracking-tighter">Needs Review</span>
                        </div>
                        
                        {pendingQueue.length === 0 ? (
                            <p className="text-[10px] font-black text-slate-600 text-center py-6 uppercase tracking-widest">Queue Empty</p>
                        ) : (
                            <div className="space-y-3">
                                {pendingQueue.slice(0, 3).map((entry: any) => (
                                    <div key={entry.courseId + entry.student._id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/30 flex items-center justify-between group">
                                        <div className="max-w-[70%]">
                                            <p className="text-xs font-black text-white italic truncate">{entry.student.name}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{entry.courseTitle}</p>
                                        </div>
                                        <Link to="/admin/approvals" className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.aside>
            </div>
        </div>
    );
};

export default AdminDashboard;

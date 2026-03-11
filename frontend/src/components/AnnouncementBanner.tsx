import React, { useEffect, useMemo, useState } from 'react';
import apiService from '../utils/api';
import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type TargetRole = 'student' | 'instructor' | 'both';

interface Announcement {
    _id: string;
    message: string;
    targetRole: TargetRole;
    createdAt: string;
}

const AnnouncementBanner: React.FC = () => {
    const { token, isAuthenticated } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);


    useEffect(() => {
        if (!token || !isAuthenticated) {
            setAnnouncements([]);
            return;
        }

        let isMounted = true;

        const fetchAnnouncements = async (): Promise<void> => {
            try {
                const response = await apiService.announcements.getAll();

                if (isMounted) {
                    setAnnouncements(Array.isArray(response.data) ? response.data : []);
                }
            } catch (error) {
                console.error('Failed to fetch announcements', error);
                if (isMounted) {
                    setAnnouncements([]);
                }
            }
        };

        fetchAnnouncements();
        const interval = window.setInterval(fetchAnnouncements, 30_000);

        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, [token, isAuthenticated]);

    const marqueeText = useMemo(() => {
        if (announcements.length === 0) return '';
        return announcements.map((item) => item.message).join('   •   ');
    }, [announcements]);

    if (!isAuthenticated || announcements.length === 0) {
        return null;
    }

    return (
        <div className="border-b border-slate-700/80 bg-[#0a192f]">
            <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-4 py-2 text-slate-100 sm:px-6 lg:px-8">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-400/45 bg-cyan-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200">
                    <Megaphone className="h-3 w-3" />
                    Announcements
                </span>

                <div className="relative w-full overflow-hidden">
                    <motion.div
                        className="whitespace-nowrap text-sm text-slate-200"
                        initial={{ x: '0%' }}
                        animate={{ x: ['0%', '-100%'] }}
                        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
                    >
                        {marqueeText}   •   {marqueeText}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementBanner;

import React, { useState } from 'react';
import { Birthwish, UserProfile } from '../types';
import { RAINBOW_COLORS } from '../lib/colors';
import { generateStandaloneBirthwishHtml } from '../lib/htmlExporter';
import { generateShareableWishLink } from '../lib/wishEncoder';
import { calculateDaysUntilBirthday } from '../lib/dateUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  getNotificationStatus, 
  requestNotificationPermission, 
  setNotificationPreference, 
  checkAndNotifyBirthdays, 
  sendBirthdayNotification,
  NotificationStatus 
} from '../lib/notificationService';
import { 
  PlusCircle, 
  Sparkles, 
  Eye, 
  Download, 
  Share2, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Gift, 
  Heart, 
  TrendingUp, 
  Award, 
  Layers, 
  HelpCircle, 
  Calendar, 
  PartyPopper, 
  Trash2, 
  AlertTriangle, 
  Copy,
  Bell,
  BellOff,
  BellRing,
  BarChart3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile | null;
  wishes: Birthwish[];
  onCreateClick: () => void;
  onViewWish: (wish: Birthwish) => void;
  onDeleteWish?: (wishId: string) => void;
  theme?: 'dark' | 'light';
  onOpenTutorial?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  wishes,
  onCreateClick,
  onViewWish,
  onDeleteWish,
  theme = 'light',
  onOpenTutorial,
}) => {
  const isLight = theme === 'light';
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [wishToDelete, setWishToDelete] = useState<Birthwish | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [notifStatus, setNotifStatus] = useState<NotificationStatus>(() => getNotificationStatus());
  const [notifBannerDismissed, setNotifBannerDismissed] = useState<boolean>(false);
  const [showChart, setShowChart] = useState<boolean>(true);

  // Filter strictly to only birthwishes created by this logged in user
  const userWishes = user ? wishes.filter(w => w.userId === user.id) : [];

  // Compute strictly REAL metrics from wishes actually created by this user
  const totalWishes = userWishes.length;
  const totalGiftAmount = userWishes.reduce((sum, w) => sum + (w.hasGift ? (w.giftAmount || 0) : 0), 0);
  const activeHoldingCount = userWishes.filter(w => w.hasGift && w.giftStatus === 'holding').length;
  const claimedCount = userWishes.filter(w => w.hasGift && w.giftStatus === 'claimed').length;

  // Aggregate number of Birthwishes created per month over the past 6 months (or calendar year)
  const monthlyWishData = React.useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result: { month: string; fullDate: string; count: number; giftsTotal: number }[] = [];

    // Build the last 6 months rolling list up to current month
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const monthIndex = d.getMonth();

      // Count wishes created in this month & year
      const matchingWishes = userWishes.filter(w => {
        try {
          const created = new Date(w.createdAt);
          return created.getFullYear() === year && created.getMonth() === monthIndex;
        } catch {
          return false;
        }
      });

      const giftsTotal = matchingWishes.reduce((acc, w) => acc + (w.hasGift ? (w.giftAmount || 0) : 0), 0);

      result.push({
        month: label,
        fullDate: `${label} ${year}`,
        count: matchingWishes.length,
        giftsTotal,
      });
    }

    return result;
  }, [userWishes]);

  // Calculate upcoming birthdays count (within next 30 days) and find the closest upcoming birthday
  const upcomingWishesWithDays = React.useMemo(() => {
    return userWishes.map(wish => ({
      wish,
      countdown: calculateDaysUntilBirthday(wish.celebrantDateOfBirth, wish.createdAt),
    })).sort((a, b) => a.countdown.daysRemaining - b.countdown.daysRemaining);
  }, [userWishes]);

  const nearestBirthday = upcomingWishesWithDays.length > 0 ? upcomingWishesWithDays[0] : null;
  const upcomingCount30Days = upcomingWishesWithDays.filter(item => item.countdown.daysRemaining <= 30).length;

  // Check which wishes have birthdays TODAY
  const todayBirthdays = React.useMemo(() => {
    return upcomingWishesWithDays.filter(item => item.countdown.isToday);
  }, [upcomingWishesWithDays]);

  // On mount or wishes change, run automatic browser notification check for any birthdays today
  React.useEffect(() => {
    if (userWishes.length > 0) {
      checkAndNotifyBirthdays(userWishes, (wish) => {
        onViewWish(wish);
      });
    }
  }, [userWishes, onViewWish]);

  const handleToggleNotifications = async () => {
    if (!notifStatus.isSupported) return;

    if (notifStatus.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      setNotifStatus(getNotificationStatus());
      if (granted && todayBirthdays.length > 0) {
        // Trigger notification immediately for today's birthday
        sendBirthdayNotification(todayBirthdays[0].wish, onViewWish);
      }
    } else {
      // Toggle enabled state
      const nextState = !notifStatus.isEnabled;
      setNotificationPreference(nextState);
      setNotifStatus(getNotificationStatus());
      if (nextState && todayBirthdays.length > 0) {
        sendBirthdayNotification(todayBirthdays[0].wish, onViewWish);
      }
    }
  };

  const handleTestNotification = (e: React.MouseEvent, wish: Birthwish) => {
    e.stopPropagation();
    if (notifStatus.permission !== 'granted') {
      handleToggleNotifications();
    } else {
      sendBirthdayNotification(wish, onViewWish);
    }
  };

  const categories = ['All', 'Father', 'Mother', 'Sister', 'Brother', 'Relation', 'Friend', 'Others'];

  const filteredWishes = userWishes.filter((w) => {
    const matchesFilter = selectedFilter === 'All' || w.category === selectedFilter;
    const matchesSearch = 
      w.celebrantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.celebrantNickname && w.celebrantNickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      w.senderRelation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDownload = (e: React.MouseEvent, wish: Birthwish) => {
    e.stopPropagation();
    const html = generateStandaloneBirthwishHtml(wish);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Birthwish-for-${wish.celebrantName.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNativeShare = async (e: React.MouseEvent, wish: Birthwish) => {
    e.stopPropagation();
    const url = generateShareableWishLink(wish);
    const celebrant = wish.celebrantNickname || wish.celebrantName;
    const shareData = {
      title: `Happy Birthday, ${celebrant}! 🎂`,
      text: `Join us in celebrating ${celebrant}'s special day with a bespoke birthday tribute! 🎉✨`,
      url: url,
    };

    // If Web Share API is available (supported by mobile browsers and modern desktop browsers)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        // User cancelled share or aborted, ignore AbortError
        if (err.name !== 'AbortError') {
          // Fallback to clipboard
          navigator.clipboard.writeText(url);
          setCopiedId(wish.id);
          setTimeout(() => setCopiedId(null), 2500);
        }
      }
    } else {
      // Fallback for browsers that do not support Web Share API
      navigator.clipboard.writeText(url);
      setCopiedId(wish.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleCopyLink = (e: React.MouseEvent, wish: Birthwish) => {
    e.stopPropagation();
    const url = generateShareableWishLink(wish);
    navigator.clipboard.writeText(url);
    setCopiedId(wish.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDeleteClick = (e: React.MouseEvent, wish: Birthwish) => {
    e.stopPropagation();
    setWishToDelete(wish);
  };

  const handleConfirmDelete = async () => {
    if (!wishToDelete) return;
    try {
      setIsDeleting(true);
      if (onDeleteWish) {
        onDeleteWish(wishToDelete.id);
      }
      setWishToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      {/* Hero Header & Greeting */}
      <div className={`relative rounded-3xl p-6 sm:p-10 border shadow-2xl overflow-hidden transition-colors duration-300 ${
        isLight 
          ? 'bg-gradient-to-b from-white to-slate-50 border-slate-200 shadow-slate-200/60 text-slate-800'
          : 'bg-gradient-to-b from-[#111827]/80 to-[#0b0f17]/90 border-white/10 shadow-2xl text-slate-100'
      }`}>
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border mb-3 ${
              isLight ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-pink-500/10 text-pink-300 border-pink-500/25'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span className="font-editorial text-sm font-semibold tracking-wider uppercase">Birthwish Atelier</span>
              <span className="font-signature text-pink-500 text-lg">with love</span>
            </div>
            <h1 className={`font-haute text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </h1>
            <p className={`font-editorial text-base sm:text-lg max-w-xl mt-2 leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-200'
            }`}>
              Craft deeply personal birthday journeys with custom rainbow themes, heartfelt epistles, and secure Kora cash gifts in holding accounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Browser Push Notification Alert Toggle Button */}
            {notifStatus.isSupported && (
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`px-4 py-3 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  notifStatus.isEnabled
                    ? isLight 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                    : isLight
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15'
                }`}
                title={notifStatus.isEnabled ? 'Birthday push alerts active (Click to disable)' : 'Enable push notifications for birthdays'}
              >
                {notifStatus.isEnabled ? (
                  <BellRing className="w-4 h-4 text-emerald-500 animate-pulse" />
                ) : (
                  <Bell className="w-4 h-4 text-amber-500" />
                )}
                <span>
                  {notifStatus.isEnabled ? 'Birthday Alerts On' : 'Enable Birthday Alerts'}
                </span>
              </button>
            )}

            {onOpenTutorial && (
              <button
                type="button"
                onClick={onOpenTutorial}
                className={`px-4 py-3 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  isLight 
                    ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                    : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-pink-500" />
                <span>How It Works</span>
              </button>
            )}

            <button
              onClick={onCreateClick}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-pink-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Birthwish</span>
            </button>
          </div>
        </div>

        {/* Real Metrics Row (Strictly what the user actually did, starts at 0 if no wishes) */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-8 pt-8 border-t ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/5'
          }`}>
            <div className={`flex items-center justify-between text-xs font-medium mb-1 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>Wishes Created</span>
              <Layers className="w-4 h-4 text-pink-500" />
            </div>
            <p className={`font-display text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalWishes}</p>
            <span className="text-[11px] text-pink-500 font-semibold">Real tributes</span>
          </div>

          {/* Dynamic Next Birthday / Days Remaining Stat Card */}
          <div className={`p-4 rounded-2xl border relative overflow-hidden ${
            nearestBirthday && nearestBirthday.countdown.daysRemaining <= 7
              ? isLight
                ? 'bg-rose-50/80 border-rose-300'
                : 'bg-rose-950/20 border-rose-500/30'
              : isLight 
              ? 'bg-white border-slate-200' 
              : 'bg-white/[0.02] border-white/5'
          }`}>
            <div className={`flex items-center justify-between text-xs font-medium mb-1 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>Next Birthday</span>
              <PartyPopper className={`w-4 h-4 ${nearestBirthday && nearestBirthday.countdown.daysRemaining <= 7 ? 'text-rose-500 animate-bounce' : 'text-purple-500'}`} />
            </div>
            <p className="font-display text-2xl font-extrabold text-purple-500">
              {nearestBirthday ? (
                nearestBirthday.countdown.isToday ? (
                  <span className="text-rose-500 animate-pulse">Today! 🎉</span>
                ) : nearestBirthday.countdown.isTomorrow ? (
                  <span className="text-amber-500">Tomorrow!</span>
                ) : (
                  `${nearestBirthday.countdown.daysRemaining}d`
                )
              ) : (
                '0'
              )}
            </p>
            <span className="text-[11px] text-purple-600 font-semibold truncate block">
              {nearestBirthday ? `${nearestBirthday.wish.celebrantName} (${nearestBirthday.countdown.formattedTargetDate})` : 'No upcoming dates'}
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/5'
          }`}>
            <div className={`flex items-center justify-between text-xs font-medium mb-1 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>Total Cash Gifted</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="font-display text-2xl font-extrabold text-emerald-500">
              ₦{totalGiftAmount.toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold">User disbursements</span>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/5'
          }`}>
            <div className={`flex items-center justify-between text-xs font-medium mb-1 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>In Holding Vault</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="font-display text-2xl font-extrabold text-amber-500">{activeHoldingCount}</p>
            <span className="text-[11px] text-amber-600 font-semibold">Passcode protected</span>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/5'
          }`}>
            <div className={`flex items-center justify-between text-xs font-medium mb-1 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>Claimed to Bank</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <p className="font-display text-2xl font-extrabold text-blue-500">{claimedCount}</p>
            <span className="text-[11px] text-blue-600 font-semibold">Verified payouts</span>
          </div>
        </div>

        {/* Recharts Data Visualization: Monthly Birthwishes Created Analytics */}
        <div className={`mt-6 rounded-2xl border p-5 transition-all duration-300 ${
          isLight ? 'bg-white/80 border-slate-200 shadow-sm' : 'bg-white/[0.02] border-white/5 shadow-inner'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-display text-sm font-bold flex items-center gap-2 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  <span>Birthwishes Created per Month</span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500">
                    6-Month Trend
                  </span>
                </h3>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Visual distribution of your celebration tributes crafted over time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
                <span className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Total Created: <strong className="text-pink-500">{totalWishes}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowChart(!showChart)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-xs ${
                  isLight ? 'border-slate-200 hover:bg-slate-100 text-slate-600' : 'border-white/10 hover:bg-white/10 text-slate-300'
                }`}
                title={showChart ? "Collapse Chart" : "Expand Chart"}
              >
                {showChart ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {showChart && (
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyWishData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wishBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke={isLight ? '#f1f5f9' : '#ffffff0a'} 
                  />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: isLight ? '#64748b' : '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: isLight ? '#e2e8f0' : '#ffffff15' }}
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: isLight ? '#64748b' : '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: isLight ? '#e2e8f0' : '#ffffff15' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: isLight ? '#f8fafc' : '#ffffff05' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className={`p-3 rounded-xl shadow-xl border text-xs ${
                            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f172a] border-white/20 text-white'
                          }`}>
                            <p className="font-bold text-pink-500 mb-1">{item.fullDate}</p>
                            <p className="flex items-center justify-between gap-4 font-semibold">
                              <span>Wishes Created:</span>
                              <span className="font-mono text-sm">{item.count}</span>
                            </p>
                            {item.giftsTotal > 0 && (
                              <p className="text-[10px] text-emerald-500 font-semibold mt-1">
                                Gifted: ₦{item.giftsTotal.toLocaleString()}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#wishBarGradient)" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {monthlyWishData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.count > 0 ? "url(#wishBarGradient)" : (isLight ? "#e2e8f0" : "#ffffff15")} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Urgent: Today's Birthday Banner with 1-click Browser Notification Action */}
        {todayBirthdays.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 text-white shadow-xl shadow-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-bounce-subtle">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/80 shrink-0 shadow-md">
                <img 
                  src={todayBirthdays[0].wish.mainImage} 
                  alt={todayBirthdays[0].wish.celebrantName} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-haute font-extrabold text-base tracking-wide flex items-center gap-1.5">
                    <span>🎉 IT&apos;S CELEBRATION DAY!</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    Today
                  </span>
                </div>
                <p className="text-xs text-white/95 mt-0.5">
                  Today is <span className="font-bold underline">{todayBirthdays[0].wish.celebrantName}&apos;s</span> birthday! Send them love and share their tribute.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {notifStatus.isSupported && notifStatus.permission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleToggleNotifications}
                  className="px-3.5 py-2 rounded-full bg-black/40 hover:bg-black/60 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md border border-white/20"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-300" />
                  <span>Notify Me</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onViewWish(todayBirthdays[0].wish)}
                className="px-4 py-2 rounded-full bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs shadow-md inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Open Celebration</span>
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Upcoming Birthday Alert Strip if any celebration is in <= 30 days and not today */}
        {nearestBirthday && nearestBirthday.countdown.daysRemaining <= 30 && !nearestBirthday.countdown.isToday && (
          <div 
            onClick={() => onViewWish(nearestBirthday.wish)}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer shadow-md group ${
              nearestBirthday.countdown.isTomorrow
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                : isLight
                ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-900 hover:shadow-lg'
                : 'bg-gradient-to-r from-purple-950/30 to-pink-950/20 border-purple-500/30 text-purple-200 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shrink-0 shadow">
                <img 
                  src={nearestBirthday.wish.mainImage} 
                  alt={nearestBirthday.wish.celebrantName} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm">
                    {nearestBirthday.wish.celebrantName}&apos;s Birthday
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    nearestBirthday.countdown.isToday
                      ? 'bg-rose-500 text-white animate-pulse'
                      : nearestBirthday.countdown.isTomorrow
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {nearestBirthday.countdown.statusText}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Scheduled celebration date: <span className="font-semibold">{nearestBirthday.countdown.formattedTargetDate}</span> · Click to view bespoke tribute
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => handleNativeShare(e, nearestBirthday.wish)}
                className="px-3 py-1.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                title="Share link to messaging apps or social media"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Share</span>
              </button>
              <div className="hidden sm:flex items-center gap-1 text-xs font-semibold group-hover:translate-x-1 transition-transform">
                <span>View Journey</span>
                <Eye className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === cat
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                  : isLight 
                    ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200' 
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search celebrant name..."
            className={`w-full pl-9 pr-4 py-2 border rounded-full text-xs transition-colors focus:outline-none focus:border-pink-500 ${
              isLight 
                ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400' 
                : 'bg-white/5 border-white/10 text-white placeholder-slate-500'
            }`}
          />
        </div>
      </div>
      </div>

      {/* Grid of Created Birthwishes - Strictly Real User Wishes */}
      {filteredWishes.length === 0 ? (
        <div className={`glass-card rounded-3xl p-12 text-center border ${
          isLight ? 'border-slate-200 bg-white' : 'border-white/10'
        }`}>
          <div className="w-16 h-16 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className={`font-display text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>No Birthwishes Created Yet</h3>
          <p className={`text-sm max-w-sm mx-auto mt-1 mb-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {searchQuery || selectedFilter !== 'All'
              ? 'Try adjusting your search query or category filters.'
              : 'You have not created any Birthwishes yet. Start your first celebration tribute!'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {onOpenTutorial && (
              <button
                type="button"
                onClick={onOpenTutorial}
                className={`px-5 py-2.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
                  isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                View Instructions
              </button>
            )}
            <button
              onClick={onCreateClick}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/25 inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Birthwish</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWishes.map((wish) => {
            const themeData = RAINBOW_COLORS[wish.colorTheme] || RAINBOW_COLORS.pink;
            const countdown = calculateDaysUntilBirthday(wish.celebrantDateOfBirth, wish.createdAt);
            
            return (
              <div
                key={wish.id}
                onClick={() => onViewWish(wish)}
                className={`group relative rounded-3xl border transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer flex flex-col justify-between ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-pink-500/50 hover:shadow-pink-500/10' 
                    : 'bg-[#111827]/70 border-white/10 hover:border-pink-500/50 hover:shadow-pink-500/10'
                }`}
              >
                <div>
                  {/* Card Cover Header */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={wish.coverImage}
                      alt="Cover"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Category & Color Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white border border-white/20">
                        {wish.category}
                      </span>
                      <span 
                        className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                        style={{ backgroundColor: themeData.primary }}
                        title={`${wish.colorTheme} theme`}
                      />
                    </div>

                    {/* Top Right Badges: Days Remaining Countdown Widget & Optional Gift */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                      {/* Dynamic Days Remaining Countdown Badge */}
                      <div 
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide shadow-lg backdrop-blur-md border ${
                          countdown.isToday
                            ? 'bg-rose-500/90 text-white border-rose-300 animate-pulse shadow-rose-500/30'
                            : countdown.isTomorrow
                            ? 'bg-amber-500/90 text-white border-amber-300 shadow-amber-500/30'
                            : countdown.daysRemaining <= 7
                            ? 'bg-purple-600/85 text-white border-purple-400 shadow-purple-500/20'
                            : countdown.daysRemaining <= 30
                            ? 'bg-slate-900/85 text-pink-300 border-pink-500/40'
                            : 'bg-slate-900/80 text-slate-200 border-white/20'
                        }`}
                        title={`Birthday: ${countdown.formattedTargetDate}`}
                      >
                        {countdown.isToday ? (
                          <span className="text-xs">🎉</span>
                        ) : countdown.isTomorrow ? (
                          <span className="text-xs">🎂</span>
                        ) : (
                          <Clock className="w-3 h-3 text-current" />
                        )}
                        <span>
                          {countdown.isToday 
                            ? "Today! 🎉" 
                            : countdown.isTomorrow 
                            ? "Tomorrow! 🎂" 
                            : `${countdown.daysRemaining} days left`}
                        </span>
                      </div>

                      {/* Holding Cash Badge */}
                      {wish.hasGift && (
                        <div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-md border ${
                            wish.giftStatus === 'claimed'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 backdrop-blur-md'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 backdrop-blur-md'
                          }`}>
                            ₦{wish.giftAmount?.toLocaleString()} {wish.giftStatus === 'claimed' ? '• Claimed' : '• In Holding'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Celebrant Avatar Overlay */}
                    <div className="absolute -bottom-4 left-6">
                      <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden shadow-lg bg-black">
                        <img
                          src={wish.mainImage}
                          alt={wish.celebrantName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 pt-7 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-display text-lg font-bold group-hover:text-pink-500 transition-colors ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {wish.celebrantName}
                        </h4>
                        {/* Target birth date pill */}
                        <span className={`text-[10px] font-medium font-mono-tech px-2 py-0.5 rounded-md shrink-0 border ${
                          isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-400 border-white/10'
                        }`}>
                          📅 {countdown.formattedTargetDate}
                        </span>
                      </div>

                      {wish.celebrantNickname && (
                        <p className="text-xs text-pink-500 font-semibold italic">
                          &ldquo;{wish.celebrantNickname}&rdquo;
                        </p>
                      )}
                      <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        From {wish.senderName || 'Anonymous'} ({wish.senderRelation})
                      </p>
                    </div>

                    {/* Dynamic Countdown Progress Bar */}
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      countdown.isToday
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : countdown.daysRemaining <= 7
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : isLight
                        ? 'bg-slate-50 border-slate-200/80 text-slate-600'
                        : 'bg-white/[0.03] border-white/10 text-slate-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-semibold text-[11px]">
                          {countdown.isToday 
                            ? "Celebration is Happening Today!" 
                            : countdown.isTomorrow 
                            ? "Celebration is Tomorrow!" 
                            : `Next Birthday in ${countdown.daysRemaining} days`}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                        {countdown.formattedTargetDate}
                      </span>
                    </div>

                    <p className={`text-xs line-clamp-2 leading-relaxed ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}>
                      {wish.shortMessage}
                    </p>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className={`p-4 border-t flex items-center justify-between text-xs ${
                  isLight ? 'border-slate-100 bg-slate-50 text-slate-500' : 'border-white/5 bg-black/20 text-slate-400'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {/* Native Web Share Button (Shares directly to WhatsApp, Telegram, X, iMessage, etc.) */}
                    <button
                      onClick={(e) => handleNativeShare(e, wish)}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-pink-100 text-pink-600' : 'hover:bg-pink-500/20 text-pink-400'
                      }`}
                      title="Share to WhatsApp, social media, or messaging apps"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy Link button */}
                    <button
                      onClick={(e) => handleCopyLink(e, wish)}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-300'
                      }`}
                      title="Copy public link to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copiedId === wish.id && (
                      <span className="text-[10px] text-emerald-500 font-bold animate-fade-in whitespace-nowrap">
                        Copied!
                      </span>
                    )}

                    {/* Test/Trigger Push Notification Button */}
                    <button
                      onClick={(e) => handleTestNotification(e, wish)}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        notifStatus.isEnabled
                          ? isLight ? 'hover:bg-amber-100 text-amber-600' : 'hover:bg-amber-500/20 text-amber-400'
                          : isLight ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-white/10 text-slate-400'
                      }`}
                      title={notifStatus.isEnabled ? "Send test birthday notification" : "Enable birthday push notifications"}
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>

                    {/* Download Standalone .html */}
                    <button
                      onClick={(e) => handleDownload(e, wish)}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-300'
                      }`}
                      title="Download standalone offline .html"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Option */}
                    <button
                      onClick={(e) => handleDeleteClick(e, wish)}
                      className={`p-2 rounded-full transition-colors cursor-pointer hover:bg-rose-500/15 text-slate-400 hover:text-rose-400`}
                      title="Delete this birthwish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-[11px] font-semibold text-pink-500 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>View Journey</span>
                    <Eye className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {wishToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setWishToDelete(null)}
        >
          <div 
            className={`w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl relative text-left transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0f172a] border-white/15 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg">
                  Delete Birthday Tribute?
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border text-xs space-y-2 mb-6 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border shrink-0">
                  <img src={wishToDelete.mainImage} alt={wishToDelete.celebrantName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-sm">{wishToDelete.celebrantName}</p>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {wishToDelete.category} · Created for {wishToDelete.celebrantNickname || wishToDelete.celebrantName}
                  </p>
                </div>
              </div>
              <p className={`text-[11px] pt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Are you sure you want to remove this bespoke celebration tribute from your Dashboard?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setWishToDelete(null)}
                disabled={isDeleting}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-white/10 hover:bg-white/15 text-slate-300 border-white/10'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

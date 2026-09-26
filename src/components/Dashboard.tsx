import React, { useState } from 'react';
import { Birthwish, UserProfile } from '../types';
import { RAINBOW_COLORS } from '../lib/colors';
import { generateStandaloneBirthwishHtml } from '../lib/htmlExporter';
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
  HelpCircle
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile | null;
  wishes: Birthwish[];
  onCreateClick: () => void;
  onViewWish: (wish: Birthwish) => void;
  theme?: 'dark' | 'light';
  onOpenTutorial?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  wishes,
  onCreateClick,
  onViewWish,
  theme = 'light',
  onOpenTutorial,
}) => {
  const isLight = theme === 'light';
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter strictly to only birthwishes created by this logged in user
  const userWishes = user ? wishes.filter(w => w.userId === user.id) : [];

  // Compute strictly REAL metrics from wishes actually created by this user
  const totalWishes = userWishes.length;
  const totalGiftAmount = userWishes.reduce((sum, w) => sum + (w.hasGift ? (w.giftAmount || 0) : 0), 0);
  const activeHoldingCount = userWishes.filter(w => w.hasGift && w.giftStatus === 'holding').length;
  const claimedCount = userWishes.filter(w => w.hasGift && w.giftStatus === 'claimed').length;

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

  const handleCopyLink = (e: React.MouseEvent, wish: Birthwish) => {
    e.stopPropagation();
    const url = `${window.location.origin}/#wish-${wish.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(wish.id);
    setTimeout(() => setCopiedId(null), 2000);
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
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t ${
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
      </div>

      {/* Filter and Search Bar */}
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

                    {/* Holding Cash Badge */}
                    {wish.hasGift && (
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md border ${
                          wish.giftStatus === 'claimed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 backdrop-blur-md'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40 backdrop-blur-md'
                        }`}>
                          ₦{wish.giftAmount?.toLocaleString()} {wish.giftStatus === 'claimed' ? '• Claimed' : '• In Holding'}
                        </span>
                      </div>
                    )}

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
                      <h4 className={`font-display text-lg font-bold group-hover:text-pink-500 transition-colors ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {wish.celebrantName}
                      </h4>
                      {wish.celebrantNickname && (
                        <p className="text-xs text-pink-500 font-semibold italic">
                          &ldquo;{wish.celebrantNickname}&rdquo;
                        </p>
                      )}
                      <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        From {wish.senderName || 'Anonymous'} ({wish.senderRelation})
                      </p>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleCopyLink(e, wish)}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-300'
                      }`}
                      title="Copy celebrant link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    {copiedId === wish.id && (
                      <span className="text-[10px] text-emerald-500 font-bold animate-fade-in">
                        Copied!
                      </span>
                    )}

                    <button
                      onClick={(e) => handleDownload(e, wish)}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-white/10 text-slate-300'
                      }`}
                      title="Download standalone offline .html"
                    >
                      <Download className="w-3.5 h-3.5" />
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
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Birthwish, 
  BirthwishCategory, 
  RainbowColor, 
  CelebrantGender, 
  UserProfile 
} from '../types';
import { RAINBOW_COLORS } from '../lib/colors';
import { initializeKoraHoldingPayment, KORA_CONFIG } from '../lib/kora';
import { saveWish } from '../lib/supabase';
import { generateStandaloneBirthwishHtml } from '../lib/htmlExporter';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  Heart, 
  ShieldAlert, 
  CreditCard, 
  Key, 
  Download, 
  Eye, 
  Share2, 
  CheckCircle2, 
  DollarSign, 
  AlertTriangle,
  Gift
} from 'lucide-react';

interface CreateWishWizardProps {
  user: UserProfile | null;
  onWishCreated: (wish: Birthwish) => void;
  onCancel: () => void;
  onPreviewWish: (wish: Birthwish) => void;
}

const CATEGORIES: { label: BirthwishCategory; icon: string; desc: string }[] = [
  { label: 'Father', icon: '👑', desc: 'Strength, honor & guidance' },
  { label: 'Mother', icon: '🌸', desc: 'Endless love, prayers & warmth' },
  { label: 'Sister', icon: '💖', desc: 'Irreplaceable confidante & joy' },
  { label: 'Brother', icon: '⚡', desc: 'Partner in crime & solid rock' },
  { label: 'Relation', icon: '✨', desc: 'Family lineage & cherished bond' },
  { label: 'Friend', icon: '🥂', desc: 'True companion & laughter maker' },
  { label: 'Others', icon: '🎁', desc: 'Spouse, mentor, soulmate, partner' },
];

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
];

const PRESET_PORTRAITS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
];

export const CreateWishWizard: React.FC<CreateWishWizardProps> = ({
  user,
  onWishCreated,
  onCancel,
  onPreviewWish,
}) => {
  // Steps: 1 (Category) -> 2 (Color) -> 3 (Details/Media/Epistle) -> 4 (Kora Payment Holding) -> 5 (Success/Export)
  const [step, setStep] = useState<number>(1);

  // Form State
  const [category, setCategory] = useState<BirthwishCategory>('Sister');
  const [customCategory, setCustomCategory] = useState<string>('');
  
  // Color State
  const [colorTheme, setColorTheme] = useState<RainbowColor>('pink');

  // Celebrant & Content State
  const [celebrantName, setCelebrantName] = useState<string>('');
  const [celebrantNickname, setCelebrantNickname] = useState<string>('');
  const [celebrantGender, setCelebrantGender] = useState<CelebrantGender>('female');
  const [coverImage, setCoverImage] = useState<string>(PRESET_COVERS[0]);
  const [mainImage, setMainImage] = useState<string>(PRESET_PORTRAITS[0]);
  const [shortMessage, setShortMessage] = useState<string>('');
  const [finalEpistle, setFinalEpistle] = useState<string>('');
  const [senderRelation, setSenderRelation] = useState<string>('');
  const [senderName, setSenderName] = useState<string>(user?.name || '');

  // Payment State (Optional Kora Holding)
  const [includeGift, setIncludeGift] = useState<boolean>(false);
  const [giftAmount, setGiftAmount] = useState<number>(5000);
  const [giftCurrency, setGiftCurrency] = useState<string>('NGN');
  const [giftPasscode, setGiftPasscode] = useState<string>('');
  const [passcodeConfirmed, setPasscodeConfirmed] = useState<boolean>(false);
  const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
  const [koraRef, setKoraRef] = useState<string>('');

  // Created Wish
  const [createdWish, setCreatedWish] = useState<Birthwish | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // File to base64 helper
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'main') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'cover') setCoverImage(reader.result);
        if (target === 'main') setMainImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNextFromCategory = () => {
    if (category === 'Others' && !customCategory.trim()) {
      setErrorNotice('Please specify the category of Birthwish you want to create.');
      return;
    }
    setErrorNotice(null);
    setStep(2);
  };

  const handleNextFromColor = () => {
    setErrorNotice(null);
    setStep(3);
  };

  const handleNextFromDetails = () => {
    if (!celebrantName.trim()) {
      setErrorNotice('Please provide the birthday celebrant name.');
      return;
    }
    if (!shortMessage.trim()) {
      setErrorNotice('Please write a brief surprise message or prayer.');
      return;
    }
    if (!finalEpistle.trim()) {
      setErrorNotice('Please write the final heartfelt epistle.');
      return;
    }
    if (!senderRelation.trim()) {
      setErrorNotice('Please specify your relation with the celebrant.');
      return;
    }
    if (!senderName.trim()) {
      setErrorNotice('Please enter your name.');
      return;
    }
    setErrorNotice(null);
    setStep(4);
  };

  // Payment process using Kora
  const handleProceedPayment = async () => {
    setErrorNotice(null);
    if (includeGift) {
      if (!giftAmount || giftAmount < KORA_CONFIG.minNgnAmount) {
        setErrorNotice(`The minimum gift amount is ₦${KORA_CONFIG.minNgnAmount.toLocaleString()} NGN or equivalent.`);
        return;
      }
      if (!giftPasscode.trim()) {
        setErrorNotice('Please set a secret passcode for the holding account.');
        return;
      }
      if (!passcodeConfirmed) {
        setErrorNotice('Please acknowledge the critical warning regarding the secret passcode.');
        return;
      }

      setPaymentProcessing(true);
      try {
        const koraRes = await initializeKoraHoldingPayment({
          amount: giftAmount,
          currency: giftCurrency,
          senderName: senderName || 'Well-Wisher',
          senderEmail: user?.email || 'sender@birthwish.app',
          celebrantName,
          passcode: giftPasscode,
        });

        setKoraRef(koraRes.reference);
      } catch (err: any) {
        console.warn('Kora payment notice:', err);
      } finally {
        setPaymentProcessing(false);
      }
    }

    // Now finalize creation!
    await handleFinalCreation();
  };

  const handleFinalCreation = async () => {
    const newWish: Birthwish = {
      id: `bw-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      userId: user?.id || 'guest-user',
      category,
      customCategory: category === 'Others' ? customCategory : undefined,
      colorTheme,
      celebrantName,
      celebrantNickname: celebrantNickname.trim() || undefined,
      celebrantGender,
      coverImage,
      mainImage,
      shortMessage,
      finalEpistle,
      senderRelation,
      senderName,
      hasGift: includeGift,
      giftAmount: includeGift ? giftAmount : undefined,
      giftCurrency: includeGift ? giftCurrency : undefined,
      giftPasscode: includeGift ? giftPasscode.trim() : undefined,
      giftStatus: includeGift ? 'holding' : 'unfunded',
      koraPaymentReference: koraRef || (includeGift ? `BW-KORA-${Date.now()}` : undefined),
    };

    const saved = await saveWish(newWish);
    setCreatedWish(saved);
    onWishCreated(saved);
    setStep(5);

    // Blast celebratory confetti!
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: RAINBOW_COLORS[colorTheme].particleColors,
    });
  };

  const handleDownloadHtml = () => {
    if (!createdWish) return;
    const htmlContent = generateStandaloneBirthwishHtml(createdWish);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Birthwish-for-${createdWish.celebrantName.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Wizard Progress Bar (Goaltic Dark Style) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400">
          <span className={step >= 1 ? 'text-pink-400' : ''}>1. Category</span>
          <span className={step >= 2 ? 'text-pink-400' : ''}>2. Theme Color</span>
          <span className={step >= 3 ? 'text-pink-400' : ''}>3. Celebrant & Story</span>
          <span className={step >= 4 ? 'text-pink-400' : ''}>4. Kora Gift Vault</span>
          <span className={step >= 5 ? 'text-pink-400' : ''}>5. Launch</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {errorNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* ================= STEP 1: CATEGORY SELECTION ================= */}
      {step === 1 && (
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="px-3 py-1 rounded-full bg-pink-500/15 text-pink-300 text-xs font-semibold uppercase tracking-wider border border-pink-500/30">
              Step 1 of 5
            </span>
            <h2 className="font-display text-3xl font-extrabold text-white mt-3 tracking-tight">
              Who is this Birthwish for?
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Select the relation or enter a personalized category to tailor the emotional resonance.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  className={`relative p-5 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-pink-500/15 border-pink-500 shadow-lg shadow-pink-500/20 scale-[1.02]'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <h3 className="font-display font-bold text-white text-base">
                    Birthwish for {cat.label}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{cat.desc}</p>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Specific Custom Category Input */}
          {(category === 'Others' || true) && (
            <div className="mt-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 max-w-xl mx-auto">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {category === 'Others' 
                  ? 'Type in your specific category (e.g., Fiancée, Mentor, Colleague, Soulmate):'
                  : 'Or customize relation title (optional):'}
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder={category === 'Others' ? 'e.g. My Cherished Mentor' : `Custom ${category} title`}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
          )}

          <div className="mt-8 flex justify-between items-center pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleNextFromCategory}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <span>Next: Choose Color</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: COLOR THEME SELECTION ================= */}
      {step === 2 && (
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="px-3 py-1 rounded-full bg-pink-500/15 text-pink-300 text-xs font-semibold uppercase tracking-wider border border-pink-500/30">
              Step 2 of 5
            </span>
            <h2 className="font-display text-3xl font-extrabold text-white mt-3 tracking-tight">
              Choose the Birthwish Color
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Select one of the radiant rainbow colors that matches your celebrant&apos;s personality and aura.
            </p>
          </div>

          {/* Rainbow Colors Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {Object.values(RAINBOW_COLORS).map((c) => {
              const isSelected = colorTheme === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorTheme(c.id)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'border-white/80 shadow-xl scale-[1.03]'
                      : 'border-white/10 hover:border-white/30 bg-white/[0.03]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : undefined,
                    boxShadow: isSelected ? `0 0 30px ${c.glow}` : undefined,
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
                    style={{ backgroundColor: c.primary }}
                  >
                    {isSelected && <Check className="w-5 h-5 text-white" />}
                  </div>
                  <h4 className="font-display font-bold text-white text-sm">{c.name}</h4>
                  <span className="text-[11px] text-slate-400 capitalize">{c.id} spectrum</span>
                </button>
              );
            })}
          </div>

          {/* Mixed Colors / Multi-Palette - Coming Soon Feature */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-amber-950/40 border border-pink-500/30 relative overflow-hidden mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-yellow-400 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-white text-sm">
                      Mixed Rainbow & Multi-Color Blends
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold uppercase tracking-wider border border-pink-500/40">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Combine two or more rainbow tones for kaleidoscopic gradients and custom aura animations.
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                Next Version Feature
              </span>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNextFromColor}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <span>Next: Celebrant Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: CELEBRANT DETAILS, IMAGES & EPISTLE ================= */}
      {step === 3 && (
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="px-3 py-1 rounded-full bg-pink-500/15 text-pink-300 text-xs font-semibold uppercase tracking-wider border border-pink-500/30">
              Step 3 of 5
            </span>
            <h2 className="font-display text-3xl font-extrabold text-white mt-3 tracking-tight">
              Celebrant Details & Emotional Epistle
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Fill in their name, upload their two special photos, write the teaser prayer, and pen the joyful epistle.
            </p>
          </div>

          {/* Section 1: Names & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Celebrant Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={celebrantName}
                onChange={(e) => setCelebrantName(e.target.value)}
                placeholder="e.g. Amara Chioma"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nickname (Optional)
              </label>
              <input
                type="text"
                value={celebrantNickname}
                onChange={(e) => setCelebrantNickname(e.target.value)}
                placeholder="e.g. Mimi / Sunshine"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Celebrant Gender <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['female', 'male', 'others'] as CelebrantGender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setCelebrantGender(g)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      celebrantGender === g
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Two Images Upload (Cover & Main) */}
          <div className="space-y-4">
            <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-pink-400" />
              <span>Two Photos of the Celebrant</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Image */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-300">1. Cover Image (Intro Banner)</span>
                  <label className="text-xs text-pink-400 hover:text-pink-300 cursor-pointer font-medium flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e, 'cover')} />
                  </label>
                </div>
                <div className="h-40 rounded-xl overflow-hidden relative group border border-white/10">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-fit object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold cursor-pointer">
                      Change Cover Photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e, 'cover')} />
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500">Preset covers:</span>
                  {PRESET_COVERS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCoverImage(url)}
                      className={`w-6 h-6 rounded-md overflow-hidden border cursor-pointer ${
                        coverImage === url ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-white/20'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Image */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-300">2. Main Image (Portrait Spotlight)</span>
                  <label className="text-xs text-pink-400 hover:text-pink-300 cursor-pointer font-medium flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e, 'main')} />
                  </label>
                </div>
                <div className="h-40 rounded-xl overflow-hidden relative group border border-white/10 flex items-center justify-center bg-black/40">
                  <img src={mainImage} alt="Main Preview" className="w-32 h-32 rounded-full object-cover border-2 border-pink-500/50 shadow-lg" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold cursor-pointer">
                      Change Portrait Photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e, 'main')} />
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500">Preset portraits:</span>
                  {PRESET_PORTRAITS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMainImage(url)}
                      className={`w-6 h-6 rounded-full overflow-hidden border cursor-pointer ${
                        mainImage === url ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-white/20'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Short / Brief Surprise Wish or Prayer */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Short/Brief Message, Wish, or Prayer (For Surprise Flash) <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setShortMessage(
                    `To the one whose presence is pure sunshine: May this birthday unlock unimaginable joy, divine health, and limitless open doors. You are deeply cherished!`
                  )
                }
                className="text-xs text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
              >
                Insert Inspiring Prayer
              </button>
            </div>
            <textarea
              required
              rows={2}
              value={shortMessage}
              onChange={(e) => setShortMessage(e.target.value)}
              placeholder="e.g. May heavens shower you with favor and make all your quiet prayers loud testimonies this new year!"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          {/* Section 4: Final Message - Long Emotional Epistle */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Final Message: Heartfelt Epistle That Brings Tears of Joy <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setFinalEpistle(
                    `My Beloved,\n\nAs you blow out your candles today, I want to take a pause from the rushing world to honor the sheer magic of your existence. You have been a steady lighthouse in stormy seasons, an endless source of comfort, and a testament to resilience.\n\nWhenever darkness crept in, your laughter brought peace. You give so selflessly to everyone around you, often forgetting to claim your own rest. Today, my prayer is that every bit of warmth and grace you have ever given out returns to you pressed down, shaken together, and running over.\n\nNever forget how precious and irreplaceable you are. Walk boldly into this new year knowing you are fiercely and unconditionally loved.`
                  )
                }
                className="text-xs text-pink-400 hover:text-pink-300 transition-colors cursor-pointer"
              >
                Load Emotional Template
              </button>
            </div>
            <textarea
              required
              rows={6}
              value={finalEpistle}
              onChange={(e) => setFinalEpistle(e.target.value)}
              placeholder="Write your heartfelt letter here. Express your love, celebrate memories, and let them know how much they truly mean to you..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Section 5: Sender Relation & Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Relation with the Celebrant <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={senderRelation}
                onChange={(e) => setSenderRelation(e.target.value)}
                placeholder="e.g. Your Big Brother / Your Best Friend / Proud Mom"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Name (Sender Signature) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Kevin Chibuike"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNextFromDetails}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <span>Next: Kora Payment Holding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: KORA PAYMENT & HOLDING PASSCODE (OPTIONAL) ================= */}
      {step === 4 && (
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30 mb-3">
              <Gift className="w-3.5 h-3.5" />
              <span>Totally Optional Step</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold text-white tracking-tight">
              Gift the Celebrant Money (Kora Pay)
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Send celebratory funds to a secure holding vault. You can skip this page anytime if you only want to send the emotional wishes!
            </p>
          </div>

          {/* Toggle Gift Option */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                ₦
              </div>
              <div>
                <h4 className="font-display font-bold text-white text-base">Attach Cash Gift with Kora</h4>
                <p className="text-xs text-slate-400">
                  Funds stay securely in holding until your celebrant claims them using your secret passcode.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeGift}
                onChange={(e) => setIncludeGift(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {includeGift && (
            <div className="space-y-6 pt-2 animate-fade-in">
              {/* Amount Selection */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Gift Amount (Minimum ₦2,000 NGN)
                  </label>
                  <span className="text-xs text-emerald-400 font-semibold">No Maximum Limit</span>
                </div>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold text-base">₦</span>
                  <input
                    type="number"
                    min={2000}
                    step={500}
                    value={giftAmount}
                    onChange={(e) => setGiftAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {[2000, 5000, 10000, 20000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setGiftAmount(amt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        giftAmount === amt
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secret Passcode Setting & Serious Warning */}
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-display font-bold text-amber-300 text-sm">
                      CRITICAL: Set Secret Claim Passcode
                    </h4>
                    <p className="text-xs text-amber-200/80 leading-relaxed mt-1">
                      ⚠️ <b>Do not forget or misplace this passcode!</b> It is the exact secret passcode your celebrant
                      will type in to claim and disburse these funds into their bank account via Kora.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Secret Passcode (Word or Number)
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3 w-4 h-4 text-amber-400" />
                    <input
                      type="text"
                      required
                      value={giftPasscode}
                      onChange={(e) => setGiftPasscode(e.target.value)}
                      placeholder="e.g. MIMI24 or QUEEN2026"
                      className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-amber-500/40 rounded-xl text-sm font-mono tracking-wider text-amber-300 placeholder-amber-400/40 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={passcodeConfirmed}
                    onChange={(e) => setPasscodeConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-0"
                  />
                  <span>
                    I understand that my celebrant will need this exact secret passcode to unlock and receive the funds via Kora Settlement.
                  </span>
                </label>
              </div>

              {/* Kora API Badge Notice */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Settlement Engine: <b>Kora API (GDG Owerri Hackathon)</b></span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">pk_test_...KDds</span>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              {!includeGift && (
                <button
                  type="button"
                  onClick={handleProceedPayment}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-white/15 transition-all cursor-pointer"
                >
                  Skip Cash Gift & Launch
                </button>
              )}
              <button
                type="button"
                disabled={paymentProcessing}
                onClick={handleProceedPayment}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-pink-500/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                {paymentProcessing ? (
                  <span>Initiating with Kora API...</span>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span>Create Birthwish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 5: CREATION SUCCESS & DOWNLOAD ================= */}
      {step === 5 && createdWish && (
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-amber-400 p-1 mx-auto mb-6 shadow-xl shadow-pink-500/20">
            <div className="w-full h-full rounded-full bg-[#0b0f17] flex items-center justify-center text-3xl">
              🎉
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
            Birthwish Successfully Created!
          </span>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Ready for {createdWish.celebrantName}!
          </h2>
          <p className="text-slate-300 text-sm max-w-lg mx-auto mt-2 leading-relaxed">
            Your heartfelt celebration journey is fully assembled with custom rainbow theme, emotional epistle, and{' '}
            {createdWish.hasGift ? (
              <span className="text-emerald-400 font-semibold">
                ₦{createdWish.giftAmount?.toLocaleString()} in the Kora Holding Vault.
              </span>
            ) : (
              'unforgettable memories.'
            )}
          </p>

          {/* Quick Details Card */}
          <div className="my-8 max-w-md mx-auto p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-left text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Celebrant:</span>
              <span className="text-white font-semibold">{createdWish.celebrantName}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Relation:</span>
              <span className="text-white font-semibold">{createdWish.senderRelation}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Theme:</span>
              <span className="text-pink-400 font-semibold capitalize">{createdWish.colorTheme}</span>
            </div>
            {createdWish.hasGift && (
              <>
                <div className="flex justify-between text-slate-400">
                  <span>Gift Holding:</span>
                  <span className="text-emerald-400 font-semibold">₦{createdWish.giftAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Secret Passcode:</span>
                  <span className="font-mono text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded">
                    {createdWish.giftPasscode}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onPreviewWish(createdWish)}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Eye className="w-4 h-4" />
              <span>Experience Celebrant Journey</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Download className="w-4 h-4 text-yellow-300" />
              <span>Download Standalone (.html) File</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mt-6">
            💡 The downloaded .html file can be shared directly via WhatsApp, Telegram, or Email. Your celebrant can open it in any browser even offline!
          </p>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Gift, 
  Palette, 
  FileText, 
  Send, 
  ShieldCheck 
} from 'lucide-react';

interface UserOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCreate: () => void;
  theme?: 'dark' | 'light';
  userName?: string;
}

interface StepInfo {
  step: number;
  title: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  points: string[];
}

export const UserOnboardingModal: React.FC<UserOnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartCreate,
  theme = 'light',
  userName,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const steps: StepInfo[] = [
    {
      step: 1,
      badge: 'Step 1 of 4 • Identity & Relation',
      title: 'Choose Who You Are Celebrating',
      icon: <Sparkles className="w-6 h-6 text-pink-500" />,
      description: 'Select whether you are celebrating a Father, Mother, Sister, Brother, Relative, Friend, or Partner.',
      points: [
        'Personalize their name, affectionate nickname, and relationship title.',
        'Upload two photos: an introductory cover photo and a spotlight portrait.',
        'Choose a custom relationship label if you select Others.',
      ],
    },
    {
      step: 2,
      badge: 'Step 2 of 4 • Rainbow Theme',
      title: 'Select a Vibrant Color Theme',
      icon: <Palette className="w-6 h-6 text-amber-500" />,
      description: 'Birthwish offers dedicated atmospheric rainbow palettes crafted for emotional storytelling.',
      points: [
        'Choose Pink, Yellow, Purple, Indigo, Emerald, Orange, or Rose.',
        'The celebrant’s interactive page, confetti, and cards dynamically adapt to this theme.',
        'Preview the aesthetic in real-time before finalizing.',
      ],
    },
    {
      step: 3,
      badge: 'Step 3 of 4 • Heartfelt Epistle',
      title: 'Craft Chapters of Devotion',
      icon: <FileText className="w-6 h-6 text-indigo-500" />,
      description: 'Write a short opening teaser and a full-length emotional birthday tribute or epistle.',
      points: [
        'Use pre-crafted inspiration templates or write your own heartfelt words.',
        'Your letter is broken down into an immersive, multi-stage interactive journey.',
        'Celebrants read through each chapter accompanied by harmonic celebration sound chimes.',
      ],
    },
    {
      step: 4,
      badge: 'Step 4 of 4 • Secure Cash Holding',
      title: 'Attach a Protected Cash Gift (Optional)',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      description: 'Send a surprise cash gift held securely in escrow until your celebrant claims it directly to their bank.',
      points: [
        'Powered by Kora Settlement Vault holding accounts.',
        'Set a secret claim passcode known only to you and your celebrant.',
        'Your celebrant types their passcode and bank account number to instantly receive payouts.',
      ],
    },
  ];

  const currentStep = steps[currentStepIndex];
  const isLast = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
      onStartCreate();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300' 
            : 'bg-[#0f172a] border-white/15 text-slate-100 shadow-black'
        }`}
      >
        {/* Close / Skip button */}
        <button
          onClick={handleSkip}
          title="Skip tutorial"
          className={`absolute top-5 right-5 p-2 rounded-full transition-colors cursor-pointer ${
            isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator Progress Bar */}
        <div className="flex items-center gap-2 mb-6 pr-8">
          {steps.map((s, idx) => (
            <div
              key={s.step}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'bg-gradient-to-r from-pink-500 to-amber-400'
                  : idx < currentStepIndex
                  ? 'bg-emerald-500'
                  : isLight
                  ? 'bg-slate-200'
                  : 'bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${
              isLight ? 'bg-pink-50 border-pink-100' : 'bg-pink-500/10 border-pink-500/20'
            }`}>
              {currentStep.icon}
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-pink-500 font-mono">
                {currentStep.badge}
              </span>
              <h3 className={`font-haute text-2xl font-bold leading-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {currentStep.title}
              </h3>
            </div>
          </div>

          <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {currentStep.description}
          </p>

          {/* Points list */}
          <div className={`p-4 rounded-2xl border space-y-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
          }`}>
            {currentStep.points.map((pt, pIdx) => (
              <div key={pIdx} className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className={isLight ? 'text-slate-700' : 'text-slate-200'}>{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls (Next & Skip) */}
        <div className={`mt-8 pt-5 border-t flex items-center justify-between gap-4 ${
          isLight ? 'border-slate-100' : 'border-white/10'
        }`}>
          <button
            type="button"
            onClick={handleSkip}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Skip Tutorial
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <span>{isLast ? 'Get Started & Create' : 'Next Step'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

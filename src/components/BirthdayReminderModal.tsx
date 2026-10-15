import React, { useState, useEffect } from 'react';
import { Birthwish, BirthdayReminderSettings, UserProfile } from '../types';
import { calculateDaysUntilBirthday } from '../lib/dateUtils';
import { 
  getNotificationStatus, 
  requestNotificationPermission, 
  saveWishReminderSettings,
  send24HourBirthdayReminder,
  triggerEmailReminder,
  NotificationStatus
} from '../lib/notificationService';
import confetti from 'canvas-confetti';
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  Mail, 
  Globe, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  Send, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

interface BirthdayReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  wish: Birthwish | null;
  user: UserProfile | null;
  onWishUpdated: (updatedWish: Birthwish) => void;
}

export const BirthdayReminderModal: React.FC<BirthdayReminderModalProps> = ({
  isOpen,
  onClose,
  wish,
  user,
  onWishUpdated,
}) => {
  const [notifStatus, setNotifStatus] = useState<NotificationStatus>(() => getNotificationStatus());
  const [enabled, setEnabled] = useState<boolean>(true);
  const [notify24HoursBefore, setNotify24HoursBefore] = useState<boolean>(true);
  const [notifyOnDay, setNotifyOnDay] = useState<boolean>(true);
  const [browserAlertEnabled, setBrowserAlertEnabled] = useState<boolean>(true);
  const [emailAlertEnabled, setEmailAlertEnabled] = useState<boolean>(true);
  const [reminderEmail, setReminderEmail] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  // Initialize form when wish changes
  useEffect(() => {
    if (wish) {
      const existing = wish.reminder;
      setEnabled(existing ? existing.enabled : true);
      setNotify24HoursBefore(existing ? existing.notify24HoursBefore : true);
      setNotifyOnDay(existing ? existing.notifyOnDay : true);
      setBrowserAlertEnabled(existing ? existing.browserAlertEnabled : true);
      setEmailAlertEnabled(existing ? existing.emailAlertEnabled : true);
      setReminderEmail(existing?.reminderEmail || user?.email || '');
      setCustomNote(existing?.customNote || '');
      setFeedbackMessage(null);
      setTestEmailStatus(null);
    }
  }, [wish, user]);

  if (!isOpen || !wish) return null;

  const countdown = calculateDaysUntilBirthday(wish.celebrantDateOfBirth, wish.createdAt);
  const celebrant = wish.celebrantNickname || wish.celebrantName;

  const handleRequestBrowserPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(getNotificationStatus());
    if (granted) {
      setBrowserAlertEnabled(true);
      setFeedbackMessage('✓ Browser notification permission granted!');
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  const handleTest24HourBrowserAlert = () => {
    if (notifStatus.permission !== 'granted') {
      handleRequestBrowserPermission();
      return;
    }

    send24HourBirthdayReminder(wish, () => {
      onClose();
    });

    setFeedbackMessage('⏰ 24-hour preview alert dispatched to your desktop!');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleTestEmailAlert = () => {
    const target = reminderEmail.trim() || user?.email;
    if (!target) {
      setTestEmailStatus('Please enter an email address first.');
      return;
    }

    triggerEmailReminder(wish, '24h', target);
    setTestEmailStatus(`✓ 24-hour reminder email dispatched to ${target}!`);
    setTimeout(() => setTestEmailStatus(null), 4000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedbackMessage(null);

    try {
      const settings: BirthdayReminderSettings = {
        enabled,
        notify24HoursBefore,
        notifyOnDay,
        browserAlertEnabled,
        emailAlertEnabled,
        reminderEmail: reminderEmail.trim() || user?.email || '',
        customNote: customNote.trim(),
      };

      const updated = await saveWishReminderSettings(wish, settings);
      onWishUpdated(updated);

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ec4899', '#10b981', '#3b82f6'],
      });

      setFeedbackMessage('✓ Birthday reminder preferences saved successfully!');
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Failed to save reminder settings:', err);
      setFeedbackMessage('Error saving reminder settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in text-slate-100">
      <div 
        className="w-full max-w-xl bg-[#090d19] border border-amber-500/40 rounded-3xl p-5 sm:p-7 text-left shadow-2xl relative max-h-[92vh] overflow-y-auto"
        style={{
          boxShadow: '0 0 50px rgba(245, 158, 11, 0.2), 0 25px 50px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-bold font-cinzel text-white">
                Birthday Reminder
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                24h Ahead
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Set automated email and browser alerts before <span className="text-white font-semibold">{celebrant}&apos;s</span> birthday.
            </p>
          </div>
        </div>

        {/* Celebrant Countdown Summary Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <img 
              src={wish.mainImage || wish.coverImage} 
              alt={celebrant} 
              className="w-10 h-10 rounded-full object-cover border border-amber-400/40"
            />
            <div>
              <p className="font-bold text-white text-sm">{wish.celebrantName}</p>
              <p className="text-slate-400 text-[11px] flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Date: {countdown.formattedTargetDate}</span>
                <span>·</span>
                <span className="text-pink-400 capitalize">{wish.category}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ${
              countdown.isToday 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                : countdown.isTomorrow
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }`}>
              {countdown.statusText}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* Main Master Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-white/10">
            <div>
              <label htmlFor="reminder-master-toggle" className="font-bold text-sm text-white block cursor-pointer">
                Enable Reminder for this Tribute
              </label>
              <p className="text-[11px] text-slate-400">
                Automatically monitor countdown and trigger alerts before and on their birthday.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="reminder-master-toggle"
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {enabled && (
            <>
              {/* Alert Timings */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                  When would you like to be alerted?
                </label>
                
                {/* 24 Hours Before Box (The Primary Requested Feature) */}
                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  notify24HoursBefore 
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.04]'
                }`}>
                  <input
                    type="checkbox"
                    checked={notify24HoursBefore}
                    onChange={(e) => setNotify24HoursBefore(e.target.checked)}
                    className="mt-1 rounded bg-black/40 border-white/20 text-amber-500 focus:ring-amber-400"
                  />
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>24 Hours Before (1 Day Advance Alert)</span>
                      <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                        Recommended
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Receive an alert one day in advance so you have time to buy gifts, send cakes, or fund the Kora Cash Gift Vault.
                    </p>
                  </div>
                </label>

                {/* Day-of Birthday Box */}
                <label className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                  notifyOnDay 
                    ? 'bg-pink-500/10 border-pink-500/40 text-pink-200' 
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.04]'
                }`}>
                  <input
                    type="checkbox"
                    checked={notifyOnDay}
                    onChange={(e) => setNotifyOnDay(e.target.checked)}
                    className="mt-1 rounded bg-black/40 border-white/20 text-pink-500 focus:ring-pink-400"
                  />
                  <div className="space-y-0.5">
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      <span>On Birthday Morning (Day-Of Alert)</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Celebration morning reminder to call, WhatsApp, and launch their interactive fireworks tribute.
                    </p>
                  </div>
                </label>
              </div>

              {/* Delivery Channels: Email & Browser */}
              <div className="space-y-3 pt-1">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                  Notification Channels
                </label>

                {/* 1. Browser Push Notifications */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-white">Browser Push Notification</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {notifStatus.permission === 'granted' ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                          Permission Granted ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequestBrowserPermission}
                          className="text-[10px] font-bold text-sky-300 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          Allow Browser Alerts
                        </button>
                      )}

                      <input
                        type="checkbox"
                        checked={browserAlertEnabled}
                        onChange={(e) => setBrowserAlertEnabled(e.target.checked)}
                        className="rounded bg-black/40 border-white/20 text-sky-500 focus:ring-sky-400"
                      />
                    </div>
                  </div>

                  {notifStatus.permission === 'granted' && (
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Displays on desktop/mobile even when tab is backgrounded.</span>
                      <button
                        type="button"
                        onClick={handleTest24HourBrowserAlert}
                        className="text-amber-300 hover:text-amber-200 underline font-mono text-[11px] cursor-pointer"
                      >
                        Test 24h Browser Alert
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Email Reminders */}
                <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Email Reminder Alert</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlertEnabled}
                      onChange={(e) => setEmailAlertEnabled(e.target.checked)}
                      className="rounded bg-black/40 border-white/20 text-emerald-500 focus:ring-emerald-400"
                    />
                  </div>

                  {emailAlertEnabled && (
                    <div className="space-y-2">
                      <label className="block text-[11px] text-slate-400">
                        Deliver reminder to this email address:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          required={emailAlertEnabled}
                          value={reminderEmail}
                          onChange={(e) => setReminderEmail(e.target.value)}
                          placeholder="your-email@example.com"
                          className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleTestEmailAlert}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                          title="Simulate sending a 24-hour reminder email right now"
                        >
                          <Send className="w-3 h-3" />
                          <span>Test Email</span>
                        </button>
                      </div>

                      {testEmailStatus && (
                        <p className="text-[11px] text-emerald-400 animate-fade-in font-medium">
                          {testEmailStatus}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Checklist / Personal Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Personal Reminder Note (Optional)
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Order chocolate cake, call at 12 AM, or send ₦10,000 gift"
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </>
          )}

          {/* Feedback Notice */}
          {feedbackMessage && (
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-medium animate-fade-in flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Birthday Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

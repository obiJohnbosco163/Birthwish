import { RainbowColor, RainbowColorConfig } from '../types';

export const RAINBOW_COLORS: Record<RainbowColor, RainbowColorConfig> = {
  red: {
    id: 'red',
    name: 'Crimson Passion',
    primary: '#ef4444',
    secondary: '#f87171',
    glow: 'rgba(239, 68, 68, 0.4)',
    bgGradient: 'from-rose-950/40 via-red-900/20 to-slate-950',
    cardBorder: 'border-red-500/40',
    accentText: 'text-red-400',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-300',
    particleColors: ['#ef4444', '#f87171', '#fecaca', '#fbbf24']
  },
  orange: {
    id: 'orange',
    name: 'Sunset Radiance',
    primary: '#f97316',
    secondary: '#fb923c',
    glow: 'rgba(249, 115, 22, 0.4)',
    bgGradient: 'from-orange-950/40 via-amber-900/20 to-slate-950',
    cardBorder: 'border-orange-500/40',
    accentText: 'text-orange-400',
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-300',
    particleColors: ['#f97316', '#fb923c', '#fed7aa', '#f43f5e']
  },
  yellow: {
    id: 'yellow',
    name: 'Golden Sunshine',
    primary: '#eab308',
    secondary: '#fde047',
    glow: 'rgba(234, 179, 8, 0.4)',
    bgGradient: 'from-amber-950/40 via-yellow-900/20 to-slate-950',
    cardBorder: 'border-yellow-500/40',
    accentText: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/15',
    badgeText: 'text-yellow-300',
    particleColors: ['#eab308', '#fde047', '#fef08a', '#ec4899']
  },
  green: {
    id: 'green',
    name: 'Emerald Aurora',
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.4)',
    bgGradient: 'from-emerald-950/40 via-teal-900/20 to-slate-950',
    cardBorder: 'border-emerald-500/40',
    accentText: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    particleColors: ['#10b981', '#34d399', '#a7f3d0', '#fbbf24']
  },
  blue: {
    id: 'blue',
    name: 'Royal Sapphire',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.4)',
    bgGradient: 'from-blue-950/40 via-sky-900/20 to-slate-950',
    cardBorder: 'border-blue-500/40',
    accentText: 'text-blue-400',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-300',
    particleColors: ['#3b82f6', '#60a5fa', '#bfdbfe', '#f472b6']
  },
  indigo: {
    id: 'indigo',
    name: 'Twilight Mystic',
    primary: '#6366f1',
    secondary: '#818cf8',
    glow: 'rgba(99, 102, 241, 0.4)',
    bgGradient: 'from-indigo-950/40 via-violet-900/20 to-slate-950',
    cardBorder: 'border-indigo-500/40',
    accentText: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-300',
    particleColors: ['#6366f1', '#818cf8', '#c7d2fe', '#ec4899']
  },
  violet: {
    id: 'violet',
    name: 'Imperial Amethyst',
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.4)',
    bgGradient: 'from-purple-950/40 via-fuchsia-900/20 to-slate-950',
    cardBorder: 'border-purple-500/40',
    accentText: 'text-purple-400',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    particleColors: ['#8b5cf6', '#a78bfa', '#ddd6fe', '#f43f5e']
  },
  pink: {
    id: 'pink',
    name: 'Signature Rose Pink',
    primary: '#ec4899',
    secondary: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.4)',
    bgGradient: 'from-pink-950/40 via-rose-900/20 to-slate-950',
    cardBorder: 'border-pink-500/40',
    accentText: 'text-pink-400',
    badgeBg: 'bg-pink-500/15',
    badgeText: 'text-pink-300',
    particleColors: ['#ec4899', '#f472b6', '#fbcfe8', '#fbbf24']
  }
};

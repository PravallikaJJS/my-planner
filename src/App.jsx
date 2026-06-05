import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Home, ListChecks, Wallet, Target, Activity, TrendingUp, Plus, Trash2,
  Check, X, Flame, Zap, Trophy, Star, Sparkles, Award, Calendar, Droplet,
  Dumbbell, ChevronRight, Crown, Rocket, Edit2, Save, ArrowUp, ArrowDown,
  Briefcase, Plane, Car, GraduationCap, Coins, Heart, Salad, Scale,
  BarChart3, Settings, Cherry, Wheat, Egg, Cookie,
  Palette, Gift, Medal, History, Lock
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts';

// =============================================================================
// CONSTANTS
// =============================================================================
const STORAGE_KEY = 'lifePlanner_v2';
const XP_VALUES = { daily: 10, weekly: 35, monthly: 100 };

const C = {
  bg: '#100A24',
  surface: '#1B1138',
  surface2: '#261A48',
  border: '#3D2C5E',
  text: '#F4EDFF',
  muted: '#A294C7',
  lime: '#B6F500',
  pink: '#FF4B91',
  cyan: '#39E0FF',
  amber: '#FFB627',
  violet: '#BD9CFF',
  emerald: '#37E3A8',
  peach: '#FFA764',
  coral: '#FF6B6B',
  sky: '#7AC8FF',
  sun: '#FFE066',
  rose: '#FF85A1',
  mint: '#7FE5C7',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_WORKOUTS = {
  0: { name: 'Rest', exercises: [] },
  1: { name: 'Leg Day', exercises: [] },
  2: { name: 'Push Day', exercises: [] },
  3: { name: 'Pull Day', exercises: [] },
  4: { name: 'Cardio', exercises: [] },
  5: { name: 'Upper Body', exercises: [] },
  6: { name: 'Active Recovery', exercises: [] },
};

const BUDGET_CATEGORIES = [
  { key: 'emergency', label: 'Emergency Fund', icon: Briefcase, color: C.amber, type: 'savings', currency: 'USD' },
  { key: 'travel', label: 'Travel Fund', icon: Plane, color: C.cyan, type: 'savings', currency: 'USD' },
  { key: 'car', label: 'Car Purchase', icon: Car, color: C.lime, type: 'savings', currency: 'USD' },
  { key: 'drivingSchool', label: 'Driving School', icon: Target, color: C.pink, type: 'savings', currency: 'USD' },
  { key: 'educationLoan', label: 'Education Loan', icon: GraduationCap, color: C.violet, type: 'debt', currency: 'INR' },
];

const INVESTMENT_TYPES = [
  { key: 'stocks', label: 'Stocks', emoji: '📈', color: C.lime },
  { key: 'crypto', label: 'Crypto', emoji: '₿', color: C.amber },
  { key: 'mutualFund', label: 'Mutual Fund', emoji: '💼', color: C.cyan },
  { key: 'realEstate', label: 'Real Estate', emoji: '🏠', color: C.emerald },
  { key: 'bonds', label: 'Bonds', emoji: '📜', color: C.violet },
  { key: 'gold', label: 'Gold', emoji: '🪙', color: C.sun },
  { key: 'other', label: 'Other', emoji: '💎', color: C.pink },
];

const ACHIEVEMENTS = [
  { id: 'first_task', name: 'First Steps', desc: 'Complete your first task', icon: '🌱', req: s => s.user.totalTasks >= 1 },
  { id: 'streak_3', name: 'On Fire', desc: '3-day streak', icon: '🔥', req: s => s.user.bestStreak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', desc: '7-day streak', icon: '⚡', req: s => s.user.bestStreak >= 7 },
  { id: 'streak_30', name: 'Unstoppable', desc: '30-day streak', icon: '💎', req: s => s.user.bestStreak >= 30 },
  { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', icon: '⭐', req: s => s.user.level >= 5 },
  { id: 'level_10', name: 'Legend', desc: 'Reach level 10', icon: '👑', req: s => s.user.level >= 10 },
  { id: 'tasks_50', name: 'Half Century', desc: 'Complete 50 tasks', icon: '🏆', req: s => s.user.totalTasks >= 50 },
  { id: 'tasks_100', name: 'Centurion', desc: 'Complete 100 tasks', icon: '🎖️', req: s => s.user.totalTasks >= 100 },
];

const DEFAULT_STATE = {
  user: { xp: 0, level: 1, streak: 0, bestStreak: 0, lastTaskDate: null, totalTasks: 0, achievements: [] },
  tasks: { daily: [], weekly: [], monthly: [] },
  budget: {
    weekly: { budget: 0, transactions: [] },
    emergency: { target: 5000, current: 0, transactions: [] },
    travel: { target: 2000, current: 0, transactions: [] },
    car: { target: 15000, current: 0, transactions: [] },
    drivingSchool: { target: 800, current: 0, transactions: [] },
    // Education loan (amortizing). principal = outstanding balance when tracking began.
    educationLoan: {
      principal: 5396535, // ₹ outstanding principal
      rate: 9.74,         // annual interest rate %
      emi: 43802,         // monthly EMI in ₹
      tenureMonths: 63,   // months remaining at start
      paid: 0,            // total principal+interest paid via logged payments
      transactions: []
    }
  },
  goals: { daily: [], weekly: [], monthly: [] },
  health: {
    workoutSchedule: DEFAULT_WORKOUTS,
    exerciseDone: {}, // 'YYYY-MM-DD-exerciseId' -> true
    nutrition: {
      targets: { protein: 100, carbs: 250, fiber: 30, calories: 2000 },
      meals: [] // {id, date, mealType, name, protein, carbs, fiber, calories, vitamins}
    },
    water: {},
    waterTarget: 8,
    weight: [], // {id, date, value}
    weightGoal: 0,
    weightUnit: 'lbs'
  },
  investments: [], // {id, name, type, invested, current, notes, date}
  ui: { theme: 'space' },
  rewards: { claimed: [] } // ['biweekly-<periodKey>', ...]
};

// =============================================================================
// HELPERS
// =============================================================================
const todayStr = () => new Date().toISOString().slice(0, 10);
const weekKey = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff)).toISOString().slice(0, 10);
};
const monthKey = (d = new Date()) => new Date(d).toISOString().slice(0, 7);
const fmtUSD = (n) => `$${(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const fmtINR = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtCurr = (n, c) => c === 'INR' ? fmtINR(n) : fmtUSD(n);
const uid = () => Math.random().toString(36).slice(2, 10);
const calcLevel = (xp) => { let l = 1; while (25 * (l + 1) * l <= xp) l++; return l; };
const xpAtLevel = (l) => 25 * l * (l - 1);
const xpForNext = (l) => 25 * (l + 1) * l;
const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);

// Loan amortization: applies logged payments in date order against the outstanding
// principal, then projects months remaining at the standard EMI.
const loanState = (loan) => {
  const r = (loan.rate / 100) / 12;
  let balance = loan.principal || 0;
  let totalInterest = 0, totalPaid = 0;
  const payments = [...(loan.transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  for (const p of payments) {
    if (balance <= 0) break;
    const interest = balance * r;
    totalPaid += p.amount;
    totalInterest += Math.min(interest, p.amount);
    balance = Math.max(0, balance - (p.amount - interest));
  }
  const E = loan.emi || 0;
  let monthsLeft = 0;
  if (balance > 0) {
    if (E > balance * r) monthsLeft = Math.ceil(-Math.log(1 - (r * balance) / E) / Math.log(1 + r));
    else monthsLeft = Infinity;
  }
  const projInterest = monthsLeft === Infinity ? Infinity : Math.max(0, monthsLeft * E - balance);
  const startBalance = loan.principal || 0;
  const pct = startBalance ? Math.min(100, ((startBalance - balance) / startBalance) * 100) : 0;
  return { balance, totalInterest, totalPaid, monthsLeft, projInterest, pct, paymentsCount: payments.length };
};
const fmtMonths = (m) => {
  if (m === Infinity) return '∞';
  const y = Math.floor(m / 12), mo = m % 12;
  if (y && mo) return `${y}y ${mo}m`;
  if (y) return `${y}y`;
  return `${mo}m`;
};

// Reward period keys (used to track which rewards have been claimed in which period)
const biweekKey = (d = new Date()) => {
  const start = new Date(2025, 0, 5); // anchor (a Sunday)
  const weeks = Math.floor((new Date(d) - start) / (7 * 86400000));
  return `bw-${Math.floor(weeks / 2)}`;
};
const quarterKey = (d = new Date()) => {
  const date = new Date(d);
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
};
const yearKey = (d = new Date()) => `${new Date(d).getFullYear()}`;

const deepMerge = (target, source) => {
  if (!source) return target;
  const out = Array.isArray(target) ? [...source] : { ...target };
  for (const k in source) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k]) && target[k]) {
      out[k] = deepMerge(target[k], source[k]);
    } else {
      out[k] = source[k];
    }
  }
  return out;
};

const loadState = async () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return deepMerge(DEFAULT_STATE, JSON.parse(raw));
  } catch {}
  return DEFAULT_STATE;
};
const saveState = async (state) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { console.error('save failed', e); }
};

// =============================================================================
// CONFETTI + TOAST
// =============================================================================
const Confetti = ({ active }) => {
  if (!active) return null;
  const pieces = Array.from({ length: 80 });
  const colors = [C.lime, C.pink, C.cyan, C.amber, C.violet, C.emerald, C.sun, C.coral];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((_, i) => (
        <div key={i} className="absolute top-0"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            background: colors[i % colors.length],
            animation: `confettiFall ${2 + Math.random() * 2}s linear forwards`,
            animationDelay: `${Math.random() * 0.6}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }} />
      ))}
    </div>
  );
};

const Toast = ({ toast }) => {
  if (!toast) return null;
  const map = { xp: C.lime, level: C.amber, achievement: C.pink, streak: C.cyan, info: C.violet };
  const col = map[toast.type] || C.lime;
  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className="px-5 py-3 rounded-2xl backdrop-blur-md flex items-center gap-3 shadow-2xl"
        style={{ background: 'rgba(27, 17, 56, 0.96)', border: `1px solid ${col}`, boxShadow: `0 0 30px ${col}55` }}>
        <div className="text-2xl">{toast.icon}</div>
        <div>
          <div className="font-bold text-sm" style={{ color: col }}>{toast.title}</div>
          {toast.desc && <div className="text-xs" style={{ color: C.muted }}>{toast.desc}</div>}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// HEADER + NAV
// =============================================================================
// =============================================================================
// THEMES + ANIMATED BACKGROUNDS
// =============================================================================
const THEMES = {
  space:   { id: 'space',   label: 'Deep Space',     emoji: '🌌', bg: 'linear-gradient(180deg, #100A24 0%, #0A0618 100%)' },
  ocean:   { id: 'ocean',   label: 'Ocean Waves',    emoji: '🌊', bg: 'linear-gradient(180deg, #07273F 0%, #04141F 100%)' },
  blossom: { id: 'blossom', label: 'Cherry Blossom', emoji: '🌸', bg: 'linear-gradient(180deg, #2B1533 0%, #190C21 100%)' },
  cats:    { id: 'cats',    label: 'Cat World',      emoji: '🐱', bg: 'linear-gradient(180deg, #2C2017 0%, #1A130D 100%)' },
};
const CAT_SPRITES = ['🐱', '😺', '😸', '🐈', '🐾', '🧶', '🐟', '😻'];

const AnimatedBackground = ({ theme }) => {
  const t = theme || 'space';
  if (t === 'space') {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full" style={{ width: 320, height: 320, top: '-6%', left: '-12%', background: `radial-gradient(circle, ${C.violet}33, transparent 70%)`, animation: 'auroraShift 16s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 340, height: 340, bottom: '-10%', right: '-14%', background: `radial-gradient(circle, ${C.cyan}22, transparent 70%)`, animation: 'auroraShift 22s ease-in-out infinite reverse' }} />
        {Array.from({ length: 46 }).map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{ width: i % 5 === 0 ? 3 : 2, height: i % 5 === 0 ? 3 : 2, background: '#fff', top: `${(i * 53) % 100}%`, left: `${(i * 37) % 100}%`, opacity: 0.55, animation: `twinkle ${2 + (i % 4)}s ease-in-out infinite`, animationDelay: `${(i % 7) * 0.4}s` }} />
        ))}
        <div className="absolute" style={{ top: '14%', left: '-12%', width: 110, height: 2, background: 'linear-gradient(90deg, transparent, #fff)', borderRadius: 9, animation: 'shoot 7s linear infinite', animationDelay: '1s' }} />
        <div className="absolute" style={{ top: '44%', left: '-12%', width: 80, height: 2, background: 'linear-gradient(90deg, transparent, #fff)', borderRadius: 9, animation: 'shoot 11s linear infinite', animationDelay: '5s' }} />
      </div>
    );
  }
  if (t === 'ocean') {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full" style={{ width: 300, height: 300, top: '-8%', right: '-10%', background: `radial-gradient(circle, ${C.cyan}22, transparent 70%)`, animation: 'auroraShift 18s ease-in-out infinite' }} />
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{ width: 5 + (i % 4) * 4, height: 5 + (i % 4) * 4, left: `${(i * 61) % 100}%`, bottom: -24, background: C.sky, opacity: 0.18, animation: `rise ${6 + (i % 5)}s linear infinite`, animationDelay: `${(i % 6) * 0.8}s` }} />
        ))}
        <div className="absolute" style={{ bottom: -40, left: '-50%', width: '200%', height: 150, background: `${C.cyan}14`, borderRadius: '45%', animation: 'waveMove 13s linear infinite' }} />
        <div className="absolute" style={{ bottom: -55, left: '-50%', width: '200%', height: 120, background: `${C.sky}14`, borderRadius: '43%', animation: 'waveMove 9s linear infinite reverse' }} />
      </div>
    );
  }
  if (t === 'blossom') {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full" style={{ width: 300, height: 300, top: '-6%', left: '-10%', background: `radial-gradient(circle, ${C.rose}33, transparent 70%)`, animation: 'auroraShift 17s ease-in-out infinite' }} />
        <div className="absolute rounded-full" style={{ width: 280, height: 280, bottom: '-8%', right: '-10%', background: `radial-gradient(circle, ${C.pink}22, transparent 70%)`, animation: 'auroraShift 20s ease-in-out infinite reverse' }} />
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="absolute" style={{ left: `${(i * 61) % 100}%`, top: -34, fontSize: `${12 + (i % 4) * 5}px`, opacity: 0.85, animation: `petalFall ${7 + (i % 5)}s linear infinite`, animationDelay: `${(i % 7) * 0.9}s` }}>🌸</div>
        ))}
      </div>
    );
  }
  // cats
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute rounded-full" style={{ width: 300, height: 300, top: '-6%', right: '-10%', background: `radial-gradient(circle, ${C.peach}33, transparent 70%)`, animation: 'auroraShift 18s ease-in-out infinite' }} />
      <div className="absolute rounded-full" style={{ width: 280, height: 280, bottom: '-8%', left: '-10%', background: `radial-gradient(circle, ${C.amber}22, transparent 70%)`, animation: 'auroraShift 21s ease-in-out infinite reverse' }} />
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="absolute" style={{ left: `${(i * 53) % 100}%`, top: `${(i * 41) % 100}%`, fontSize: `${16 + (i % 3) * 8}px`, opacity: 0.7, animation: `floatDrift ${8 + (i % 5)}s ease-in-out infinite`, animationDelay: `${(i % 6) * 0.7}s` }}>
          {CAT_SPRITES[i % CAT_SPRITES.length]}
        </div>
      ))}
    </div>
  );
};

const ThemePicker = ({ theme, setTheme }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: `${C.violet}22`, border: `1px solid ${C.violet}44` }}>
        <Palette size={14} style={{ color: C.violet }} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 p-2 rounded-2xl w-44 animate-slideIn"
          style={{ background: 'rgba(27,17,56,0.98)', border: `1px solid ${C.border}`, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
          <div className="text-[10px] uppercase tracking-wider px-2 py-1 font-semibold" style={{ color: C.muted }}>Theme</div>
          {Object.values(THEMES).map(th => (
            <button key={th.id} onClick={() => { setTheme(th.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-sm transition-all"
              style={{ background: theme === th.id ? `${C.violet}22` : 'transparent', color: theme === th.id ? C.text : C.muted }}>
              <span className="text-lg">{th.emoji}</span>
              <span>{th.label}</span>
              {theme === th.id && <Check size={14} style={{ color: C.violet, marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// BADGES / CHIPS
// =============================================================================
const tierFromPct = (pct) => {
  if (pct >= 100) return { label: 'Complete', icon: '🏆', rank: 4 };
  if (pct >= 75) return { label: 'Gold', icon: '🥇', rank: 3 };
  if (pct >= 50) return { label: 'Silver', icon: '🥈', rank: 2 };
  if (pct >= 25) return { label: 'Bronze', icon: '🥉', rank: 1 };
  return null;
};

const computeBadges = (state) => {
  const today = todayStr();
  const groups = [];

  // Money chips (one per fund/loan, tiered)
  const money = BUDGET_CATEGORIES.map(c => {
    let pct;
    if (c.type === 'debt') pct = loanState(state.budget.educationLoan).pct;
    else { const cat = state.budget[c.key]; pct = cat.target ? (cat.current / cat.target) * 100 : 0; }
    return { key: c.key, label: c.label, color: c.color, tier: tierFromPct(pct), pct };
  });
  groups.push({ title: 'Money', icon: Coins, color: C.amber, items: money });

  // Task chips
  const u = state.user;
  const tasks = [
    { key: 't7', label: '7-Day Streak', color: C.coral, icon: '🔥', earned: u.bestStreak >= 7 },
    { key: 't30', label: '30-Day Streak', color: C.coral, icon: '⚡', earned: u.bestStreak >= 30 },
    { key: 't50', label: '50 Tasks', color: C.lime, icon: '🏅', earned: u.totalTasks >= 50 },
    { key: 't100', label: '100 Tasks', color: C.lime, icon: '🎖️', earned: u.totalTasks >= 100 },
  ];
  groups.push({ title: 'Tasks', icon: ListChecks, color: C.cyan, items: tasks });

  // Health chips
  const waterToday = state.health.water[today] || 0;
  const exDoneToday = Object.keys(state.health.exerciseDone).filter(k => k.startsWith(today) && state.health.exerciseDone[k]).length;
  const mealsToday = state.health.nutrition.meals.filter(m => m.date === today).length;
  const health = [
    { key: 'hydrate', label: 'Hydrated', color: C.cyan, icon: '💧', earned: waterToday >= state.health.waterTarget },
    { key: 'active', label: 'Active', color: C.emerald, icon: '💪', earned: exDoneToday > 0 },
    { key: 'nourished', label: 'Nourished', color: C.coral, icon: '🥗', earned: mealsToday > 0 },
    { key: 'weighIn', label: 'Weigh-In', color: C.violet, icon: '⚖️', earned: state.health.weight.some(w => w.date === today) },
  ];
  groups.push({ title: 'Health (today)', icon: Activity, color: C.emerald, items: health });

  // Investment chips
  const inv = state.investments;
  const totalGain = inv.reduce((s, i) => s + (i.current - i.invested), 0);
  const investments = [
    { key: 'firstInv', label: 'First Investment', color: C.violet, icon: '🌱', earned: inv.length >= 1 },
    { key: 'green', label: 'In The Green', color: C.emerald, icon: '📈', earned: inv.length > 0 && totalGain >= 0 },
    { key: 'diversified', label: 'Diversified', color: C.amber, icon: '💎', earned: new Set(inv.map(i => i.type)).size >= 3 },
  ];
  groups.push({ title: 'Investments', icon: TrendingUp, color: C.violet, items: investments });

  return groups;
};

const BadgeShelf = ({ state }) => {
  const groups = computeBadges(state);
  return (
    <div className="p-5 rounded-3xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2 mb-4">
        <Medal size={16} style={{ color: C.amber }} />
        <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.text }}>Badges & Chips</div>
      </div>
      <div className="space-y-4">
        {groups.map(g => {
          const Icon = g.icon;
          return (
            <div key={g.title}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={12} style={{ color: g.color }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: g.color }}>{g.title}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.items.map(it => {
                  const earned = it.tier ? true : it.earned;
                  const icon = it.tier ? it.tier.icon : it.icon;
                  const sub = it.tier ? it.tier.label : null;
                  return (
                    <div key={it.key} className="px-2.5 py-1.5 rounded-full flex items-center gap-1.5 text-[11px]"
                      style={{
                        background: earned ? `${it.color}1F` : C.surface2,
                        border: `1px solid ${earned ? it.color + '66' : C.border}`,
                        opacity: earned ? 1 : 0.4
                      }}>
                      <span>{earned ? icon : '🔒'}</span>
                      <span style={{ color: earned ? it.color : C.muted }}>{it.label}{sub ? ` · ${sub}` : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// REWARDS
// =============================================================================
const REWARDS = [
  { id: 'biweekly',  label: 'Biweekly Treat',   reward: 'Dessert of your choice', emoji: '🍰', need: 14,  color: C.pink,   period: biweekKey },
  { id: 'monthly',   label: 'Monthly Reward',   reward: 'Takeout night',          emoji: '🥡', need: 30,  color: C.amber,  period: monthKey },
  { id: 'quarterly', label: 'Quarterly Reward', reward: 'Buy a new dress',        emoji: '👗', need: 90,  color: C.violet, period: quarterKey },
  { id: 'yearly',    label: 'Yearly Reward',    reward: '$100 for anything',      emoji: '💰', need: 365, color: C.lime,   period: yearKey },
];

const RewardTracker = ({ state, claimReward }) => {
  const streak = state.user.streak;
  const claimed = state.rewards?.claimed || [];
  return (
    <div className="space-y-3">
      <div className="text-center py-1">
        <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.pink }}>streak rewards</div>
        <div className="text-[10px]" style={{ color: C.muted }}>keep your daily streak alive to unlock treats</div>
      </div>
      {REWARDS.map(r => {
        const pct = Math.min(100, (streak / r.need) * 100);
        const unlocked = streak >= r.need;
        const claimKey = `${r.id}-${r.period()}`;
        const isClaimed = claimed.includes(claimKey);
        return (
          <div key={r.id} className="p-4 rounded-2xl relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${C.surface}, ${r.color}12)`, border: `1px solid ${r.color}33` }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${r.color}20`, filter: unlocked ? 'none' : 'grayscale(1)', opacity: unlocked ? 1 : 0.6 }}>
                {r.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm" style={{ color: C.text }}>{r.label}</div>
                <div className="text-[11px]" style={{ color: C.muted }}>{r.reward}</div>
              </div>
              {unlocked ? (
                isClaimed ? (
                  <div className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${C.emerald}22`, color: C.emerald }}>Claimed ✓</div>
                ) : (
                  <button onClick={() => claimReward(claimKey)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full" style={{ background: r.color, color: C.bg }}>Claim 🎉</button>
                )
              ) : (
                <div className="flex items-center gap-1 text-[11px]" style={{ color: C.muted }}>
                  <Lock size={11} /> {r.need - streak}d
                </div>
              )}
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
              <div className="h-full transition-all duration-700 rounded-full" style={{ width: `${pct}%`, background: r.color, boxShadow: `0 0 8px ${r.color}88` }} />
            </div>
            <div className="text-[10px] mt-1 tabular-nums" style={{ color: C.muted }}>{Math.min(streak, r.need)} / {r.need} day streak</div>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// HEALTH HISTORY (weekly / monthly / quarterly / yearly summaries)
// =============================================================================
const inPeriod = (dateStr, period) => {
  if (!dateStr) return false;
  const d = new Date(dateStr), now = new Date();
  if (period === 'week') return d >= new Date(weekKey());
  if (period === 'month') return dateStr.slice(0, 7) === monthKey();
  if (period === 'quarter') return quarterKey(d) === quarterKey();
  if (period === 'year') return d.getFullYear() === now.getFullYear();
  return false;
};

const HealthHistory = ({ state }) => {
  const [period, setPeriod] = useState('week');
  const periods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
  ];

  // Workouts: distinct active days + exercises done
  const exKeys = Object.keys(state.health.exerciseDone).filter(k => state.health.exerciseDone[k]);
  const exInPeriod = exKeys.filter(k => inPeriod(k.slice(0, 10), period));
  const activeDays = new Set(exInPeriod.map(k => k.slice(0, 10))).size;

  // Meals + avg macros per logged day
  const meals = state.health.nutrition.meals.filter(m => inPeriod(m.date, period));
  const mealDays = new Set(meals.map(m => m.date)).size || 1;
  const macroAvg = meals.reduce((a, m) => ({
    protein: a.protein + (m.protein || 0), carbs: a.carbs + (m.carbs || 0),
    fiber: a.fiber + (m.fiber || 0), calories: a.calories + (m.calories || 0)
  }), { protein: 0, carbs: 0, fiber: 0, calories: 0 });

  // Water avg per day
  const waterEntries = Object.entries(state.health.water).filter(([d]) => inPeriod(d, period));
  const waterAvg = waterEntries.length ? waterEntries.reduce((s, [, v]) => s + v, 0) / waterEntries.length : 0;

  // Weight change
  const weights = state.health.weight.filter(w => inPeriod(w.date, period)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const wChange = weights.length > 1 ? weights[weights.length - 1].value - weights[0].value : 0;

  const cards = [
    { label: 'Active Days', value: activeDays, sub: 'workouts logged', color: C.emerald, icon: Dumbbell },
    { label: 'Exercises Done', value: exInPeriod.length, sub: 'total reps logged', color: C.lime, icon: Check },
    { label: 'Meals Logged', value: meals.length, sub: `${Math.round(macroAvg.protein / mealDays)}g protein/day avg`, color: C.coral, icon: Salad },
    { label: 'Avg Water', value: waterAvg.toFixed(1), sub: 'glasses per day', color: C.cyan, icon: Droplet },
    { label: 'Avg Calories', value: Math.round(macroAvg.calories / mealDays), sub: 'per logged day', color: C.amber, icon: Cookie },
    { label: 'Weight Change', value: `${wChange > 0 ? '+' : ''}${wChange.toFixed(1)}`, sub: state.health.weightUnit, color: wChange <= 0 ? C.emerald : C.coral, icon: Scale },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {periods.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={{ background: period === p.id ? `${C.emerald}22` : 'transparent', color: period === p.id ? C.emerald : C.muted }}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="p-4 rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${C.surface}, ${c.color}10)`, border: `1px solid ${c.color}33` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{c.label}</div>
                <Icon size={14} style={{ color: c.color }} />
              </div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: c.color, fontFamily: 'JetBrains Mono, monospace' }}>{c.value}</div>
              <div className="text-[10px] mt-1" style={{ color: C.muted }}>{c.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// LOAN CALCULATOR CARD
// =============================================================================
const LoanCard = ({ loan, onAddPayment, onDeletePayment, onEditLoan }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [amount, setAmount] = useState(loan.emi);
  const [note, setNote] = useState('');
  const [p, setP] = useState(loan.principal);
  const [rate, setRate] = useState(loan.rate);
  const [emi, setEmi] = useState(loan.emi);

  const calc = loanState(loan);
  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!isNaN(amt) && amt > 0) { onAddPayment(amt, note); setNote(''); setShowAdd(false); }
  };

  return (
    <div className="p-4 rounded-2xl" style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.violet}0C)`, border: `1px solid ${C.violet}33` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${C.violet}20` }}>
            <GraduationCap size={18} style={{ color: C.violet }} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: C.text }}>Education Loan</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>amortizing • INR</div>
          </div>
        </div>
        <button onClick={() => setShowEdit(!showEdit)}><Settings size={14} style={{ color: C.muted }} /></button>
      </div>

      {showEdit && (
        <div className="mb-3 p-3 rounded-xl space-y-2" style={{ background: C.surface2 }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>loan details</div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] w-24" style={{ color: C.text }}>Principal ₹</span>
            <input type="number" value={p} onChange={e => setP(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] w-24" style={{ color: C.text }}>Rate % p.a.</span>
            <input type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] w-24" style={{ color: C.text }}>EMI ₹/mo</span>
            <input type="number" value={emi} onChange={e => setEmi(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
          <button onClick={() => { onEditLoan({ principal: parseFloat(p) || 0, rate: parseFloat(rate) || 0, emi: parseFloat(emi) || 0 }); setShowEdit(false); }}
            className="w-full py-2 rounded-lg text-xs font-semibold" style={{ background: C.violet, color: C.bg }}>save details</button>
        </div>
      )}

      {/* Outstanding balance */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>outstanding balance</div>
        <div className="text-3xl font-bold tabular-nums" style={{ color: C.violet, fontFamily: 'JetBrains Mono, monospace' }}>{fmtINR(Math.round(calc.balance))}</div>
        <div className="h-2 rounded-full overflow-hidden mt-2" style={{ background: C.surface2 }}>
          <div className="h-full transition-all duration-700 rounded-full" style={{ width: `${calc.pct}%`, background: `linear-gradient(90deg, ${C.violet}aa, ${C.violet})`, boxShadow: `0 0 12px ${C.violet}77` }} />
        </div>
        <div className="text-[10px] mt-1" style={{ color: C.muted }}>{calc.pct.toFixed(1)}% paid off</div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: C.surface2 }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>time left</div>
          <div className="text-base font-bold tabular-nums" style={{ color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMonths(calc.monthsLeft)}</div>
          <div className="text-[9px]" style={{ color: C.muted }}>{calc.monthsLeft === Infinity ? 'EMI too low' : `${calc.monthsLeft} payments`}</div>
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: C.surface2 }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>interest left</div>
          <div className="text-base font-bold tabular-nums" style={{ color: C.coral, fontFamily: 'JetBrains Mono, monospace' }}>{calc.projInterest === Infinity ? '∞' : fmtINR(Math.round(calc.projInterest))}</div>
          <div className="text-[9px]" style={{ color: C.muted }}>at ₹{(loan.emi || 0).toLocaleString('en-IN')}/mo</div>
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: C.surface2 }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>rate</div>
          <div className="text-base font-bold tabular-nums" style={{ color: C.amber, fontFamily: 'JetBrains Mono, monospace' }}>{loan.rate}%</div>
          <div className="text-[9px]" style={{ color: C.muted }}>per annum</div>
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: C.surface2 }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>total paid</div>
          <div className="text-base font-bold tabular-nums" style={{ color: C.emerald, fontFamily: 'JetBrains Mono, monospace' }}>{fmtINR(Math.round(calc.totalPaid))}</div>
          <div className="text-[9px]" style={{ color: C.muted }}>{calc.paymentsCount} payments</div>
        </div>
      </div>

      <button onClick={() => setShowAdd(!showAdd)}
        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
        style={{ background: showAdd ? C.surface2 : `${C.violet}15`, color: C.violet, border: `1px dashed ${C.violet}55` }}>
        <Plus size={12} /> Log a payment
      </button>

      {showAdd && (
        <div className="mt-3 space-y-2">
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Payment amount" autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
          <button onClick={handleAdd} className="w-full py-2 rounded-lg text-xs font-semibold" style={{ background: C.violet, color: C.bg }}>
            Log {fmtINR(parseFloat(amount) || 0)}
          </button>
        </div>
      )}

      {loan.transactions.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px dashed ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>Recent payments</div>
          <div className="space-y-1.5">
            {[...loan.transactions].reverse().slice(0, 4).map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs group">
                <div className="flex-1 min-w-0">
                  <div style={{ color: C.text }} className="truncate">{t.note || 'EMI payment'}</div>
                  <div className="text-[10px]" style={{ color: C.muted }}>{t.date}</div>
                </div>
                <div className="tabular-nums font-semibold" style={{ color: C.violet, fontFamily: 'JetBrains Mono, monospace' }}>-{fmtINR(t.amount)}</div>
                <button onClick={() => onDeletePayment(t.id)} className="ml-2 opacity-0 group-hover:opacity-100"><X size={12} style={{ color: C.muted }} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Header = ({ state, theme, setTheme }) => {
  const { level, xp, streak } = state.user;
  const cur = xpAtLevel(level), nxt = xpForNext(level);
  const pct = ((xp - cur) / (nxt - cur)) * 100;
  return (
    <div className="px-5 pt-5 pb-3">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase font-semibold" style={{ color: C.lime }}>
            ✦ Mission Control
          </div>
          <h1 className="text-2xl italic" style={{
            fontFamily: 'Fraunces, serif',
            background: `linear-gradient(135deg, ${C.lime}, ${C.cyan}, ${C.pink})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            your day, your build.
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemePicker theme={theme} setTheme={setTheme} />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: `${C.coral}22`, border: `1px solid ${C.coral}44` }}>
            <Flame size={13} style={{ color: C.coral }} />
            <span className="text-xs font-bold tabular-nums" style={{ color: C.coral, fontFamily: 'JetBrains Mono, monospace' }}>{streak}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: `${C.lime}22`, border: `1px solid ${C.lime}44` }}>
            <Crown size={13} style={{ color: C.lime }} />
            <span className="text-xs font-bold tabular-nums" style={{ color: C.lime, fontFamily: 'JetBrains Mono, monospace' }}>LVL {level}</span>
          </div>
        </div>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
        <div className="absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${C.lime}, ${C.cyan}, ${C.pink})`, boxShadow: `0 0 12px ${C.lime}88` }}>
          <div className="absolute inset-0 opacity-50" style={{ background: 'linear-gradient(90deg, transparent, white, transparent)', animation: 'shimmer 2s linear infinite' }} />
        </div>
      </div>
      <div className="flex justify-between mt-1 text-[10px] tabular-nums" style={{ color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>
        <span>{xp} XP</span>
        <span>{nxt} XP → LVL {level + 1}</span>
      </div>
    </div>
  );
};

const Nav = ({ active, setActive }) => {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Home', color: C.lime },
    { id: 'tasks', icon: ListChecks, label: 'Tasks', color: C.cyan },
    { id: 'budget', icon: Wallet, label: 'Money', color: C.amber },
    { id: 'goals', icon: Target, label: 'Goals', color: C.pink },
    { id: 'health', icon: Activity, label: 'Health', color: C.emerald },
    { id: 'invest', icon: TrendingUp, label: 'Invest', color: C.violet },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-2 py-2 backdrop-blur-xl"
      style={{ background: 'rgba(16, 10, 36, 0.94)', borderTop: `1px solid ${C.border}` }}>
      <div className="flex justify-around items-center max-w-2xl mx-auto">
        {tabs.map(t => {
          const Icon = t.icon, isActive = active === t.id;
          return (
            <button key={t.id} onClick={() => setActive(t.id)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-xl transition-all"
              style={{ background: isActive ? `${t.color}18` : 'transparent', color: isActive ? t.color : C.muted }}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[9px] font-semibold tracking-wide uppercase">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// =============================================================================
// DASHBOARD
// =============================================================================
const StatCard = ({ label, value, sub, color, icon: Icon, gradient }) => (
  <div className="p-4 rounded-2xl relative overflow-hidden"
    style={{
      background: gradient || C.surface,
      border: `1px solid ${color}33`
    }}>
    <div className="flex items-start justify-between mb-2">
      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{label}</div>
      {Icon && <Icon size={15} style={{ color }} />}
    </div>
    <div className="text-2xl font-bold tabular-nums" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    {sub && <div className="text-[10px] mt-1" style={{ color: C.muted }}>{sub}</div>}
  </div>
);

const Dashboard = ({ state, toggleTask }) => {
  const today = todayStr();
  const wk = weekKey();
  const mo = monthKey();

  const dailyTasksToday = state.tasks.daily.filter(t => t.dueDate === today);
  const dailyDone = dailyTasksToday.filter(t => t.done).length;
  const dailyPct = dailyTasksToday.length ? (dailyDone / dailyTasksToday.length) * 100 : 0;

  const monthlyTasks = state.tasks.monthly.filter(t => t.monthKey === mo);
  const monthlyDone = monthlyTasks.filter(t => t.done).length;

  // Weekly budget
  const weekTxns = state.budget.weekly.transactions.filter(t => {
    const d = new Date(t.date);
    return d >= new Date(wk);
  });
  const weekSpent = weekTxns.reduce((s, t) => s + t.amount, 0);
  const weekBudget = state.budget.weekly.budget;
  const weekLeft = weekBudget - weekSpent;

  // Monthly: saved & spent
  const monthSaved = ['emergency', 'travel', 'car', 'drivingSchool'].reduce((sum, k) => {
    const cat = state.budget[k];
    return sum + cat.transactions.filter(t => t.date.startsWith(mo)).reduce((s, t) => s + t.amount, 0);
  }, 0);
  const monthSpent = state.budget.weekly.transactions
    .filter(t => t.date.startsWith(mo)).reduce((s, t) => s + t.amount, 0);

  const loanCalc = loanState(state.budget.educationLoan);
  const loanRemaining = loanCalc.balance;
  const loanPct = loanCalc.pct;

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      {/* Today's quest hero */}
      <div className="p-5 rounded-3xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.surface2})`, border: `1px solid ${C.lime}33` }}>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-25"
          style={{ background: `radial-gradient(circle, ${C.lime}, transparent 70%)` }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${C.pink}, transparent 70%)` }} />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.2em] mb-1 font-semibold" style={{ color: C.lime }}>✦ Today's Quest</div>
          <div className="flex items-end gap-3 mb-3">
            <div className="text-5xl font-bold tabular-nums" style={{ color: C.lime, fontFamily: 'JetBrains Mono, monospace' }}>{dailyDone}</div>
            <div className="text-2xl pb-1" style={{ color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>/ {dailyTasksToday.length || 0}</div>
            <div className="ml-auto text-xs px-2 py-1 rounded-full"
              style={{ background: dailyPct === 100 ? `${C.lime}33` : `${C.amber}22`, color: dailyPct === 100 ? C.lime : C.amber }}>
              {dailyPct === 100 ? '🎉 ALL DONE' : `${Math.round(dailyPct)}%`}
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
            <div className="h-full transition-all duration-700 rounded-full"
              style={{ width: `${dailyPct}%`, background: `linear-gradient(90deg, ${C.lime}, ${C.cyan})`, boxShadow: `0 0 10px ${C.lime}66` }} />
          </div>
        </div>
      </div>

      {/* TODAY'S TASKS — tappable list */}
      <div className="p-5 rounded-3xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks size={16} style={{ color: C.cyan }} />
          <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.text }}>
            Today's Tasks
          </div>
        </div>
        {dailyTasksToday.length === 0 ? (
          <div className="text-center py-6 text-xs" style={{ color: C.muted }}>
            no tasks for today — head to the Tasks tab to add some ✨
          </div>
        ) : (
          <div className="space-y-2">
            {dailyTasksToday.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl transition-all"
                style={{ background: t.done ? `${C.lime}10` : C.surface2 }}>
                <button onClick={() => toggleTask(t.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0"
                  style={{
                    background: t.done ? C.lime : 'transparent',
                    border: `2px solid ${C.lime}`,
                    boxShadow: t.done ? `0 0 12px ${C.lime}88` : 'none'
                  }}>
                  {t.done && <Check size={13} style={{ color: C.bg }} strokeWidth={3} />}
                </button>
                <div className="flex-1 text-sm" style={{
                  color: t.done ? C.muted : C.text,
                  textDecoration: t.done ? 'line-through' : 'none'
                }}>{t.text}</div>
                <div className="text-[10px] tabular-nums px-2 py-0.5 rounded-full"
                  style={{ background: `${C.lime}15`, color: C.lime, fontFamily: 'JetBrains Mono, monospace' }}>+10</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Monthly Goals" value={`${monthlyDone}/${monthlyTasks.length}`}
          sub="this month" color={C.pink} icon={Trophy}
          gradient={`linear-gradient(135deg, ${C.surface}, ${C.pink}15)`} />
        <StatCard label="Week Budget"
          value={weekLeft >= 0 ? fmtUSD(weekLeft) : fmtUSD(-weekLeft)}
          sub={weekLeft >= 0 ? `of ${fmtUSD(weekBudget)} left` : 'over budget'}
          color={weekLeft >= 0 ? C.cyan : C.coral} icon={Wallet}
          gradient={`linear-gradient(135deg, ${C.surface}, ${C.cyan}15)`} />
        <StatCard label="Saved (Mo)" value={fmtUSD(monthSaved)}
          sub="across all funds" color={C.lime} icon={Coins}
          gradient={`linear-gradient(135deg, ${C.surface}, ${C.lime}15)`} />
        <StatCard label="Spent (Mo)" value={fmtUSD(monthSpent)}
          sub="weekly expenses" color={C.amber} icon={ArrowDown}
          gradient={`linear-gradient(135deg, ${C.surface}, ${C.amber}15)`} />
      </div>

      {/* Big picture */}
      <div className="p-5 rounded-3xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: C.lime }} />
          <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.text }}>The Big Picture</div>
        </div>
        <div className="space-y-3">
          {BUDGET_CATEGORIES.filter(c => c.type === 'savings').map(c => {
            const cat = state.budget[c.key];
            const pct = cat.target ? Math.min(100, (cat.current / cat.target) * 100) : 0;
            return (
              <div key={c.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5" style={{ color: C.text }}>
                    <c.icon size={11} style={{ color: c.color }} />{c.label}
                  </span>
                  <span className="tabular-nums" style={{ color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                    {fmtUSD(cat.current)} / {fmtUSD(cat.target)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
                  <div className="h-full transition-all duration-700 rounded-full"
                    style={{ width: `${pct}%`, background: c.color, boxShadow: `0 0 8px ${c.color}66` }} />
                </div>
              </div>
            );
          })}
          <div className="pt-3 mt-3" style={{ borderTop: `1px dashed ${C.border}` }}>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5" style={{ color: C.text }}>
                <GraduationCap size={11} style={{ color: C.violet }} /> Loan Cleared
              </span>
              <span className="tabular-nums" style={{ color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                {loanPct.toFixed(1)}% • {fmtMonths(loanCalc.monthsLeft)} left
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
              <div className="h-full transition-all duration-700 rounded-full"
                style={{ width: `${loanPct}%`, background: C.violet, boxShadow: `0 0 8px ${C.violet}66` }} />
            </div>
            <div className="text-[10px] mt-1" style={{ color: C.muted }}>{fmtINR(Math.round(loanRemaining))} outstanding</div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="p-5 rounded-3xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} style={{ color: C.amber }} />
          <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.text }}>
            Trophies ({state.user.achievements.length}/{ACHIEVEMENTS.length})
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ACHIEVEMENTS.map(a => {
            const got = state.user.achievements.includes(a.id);
            return (
              <div key={a.id} className="px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs"
                style={{
                  background: got ? `${C.amber}20` : C.surface2,
                  border: `1px solid ${got ? C.amber + '66' : C.border}`,
                  opacity: got ? 1 : 0.4
                }}>
                <span>{a.icon}</span>
                <span style={{ color: got ? C.amber : C.muted }}>{a.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges & chips */}
      <BadgeShelf state={state} />
    </div>
  );
};

// =============================================================================
// TASKS
// =============================================================================
const TaskItem = ({ task, onToggle, onDelete, accent, xpValue }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl group transition-all"
    style={{ background: task.done ? `${accent}10` : C.surface2, border: `1px solid ${task.done ? accent + '33' : C.border}` }}>
    <button onClick={() => onToggle(task.id)}
      className="w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0"
      style={{ background: task.done ? accent : 'transparent', border: `2px solid ${accent}`, boxShadow: task.done ? `0 0 12px ${accent}88` : 'none' }}>
      {task.done && <Check size={14} style={{ color: C.bg }} strokeWidth={3} />}
    </button>
    <div className="flex-1 text-sm" style={{ color: task.done ? C.muted : C.text, textDecoration: task.done ? 'line-through' : 'none' }}>
      {task.text}
    </div>
    <div className="text-xs tabular-nums px-2 py-0.5 rounded-full"
      style={{ background: `${accent}15`, color: accent, fontFamily: 'JetBrains Mono, monospace' }}>+{xpValue}</div>
    <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
      <Trash2 size={14} style={{ color: C.muted }} />
    </button>
  </div>
);

const TaskSection = ({ title, type, tasks, accent, icon: Icon, onAdd, onToggle, onDelete }) => {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const xp = XP_VALUES[type];
  const handleSubmit = () => { if (text.trim()) { onAdd(type, text.trim()); setText(''); setAdding(false); } };
  const done = tasks.filter(t => t.done).length, total = tasks.length;
  const pct = total ? (done / total) * 100 : 0;
  return (
    <div className="p-4 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}20` }}>
            <Icon size={16} style={{ color: accent }} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: C.text }}>{title}</div>
            <div className="text-[10px]" style={{ color: C.muted }}>{done}/{total} • +{xp} XP each</div>
          </div>
        </div>
        <button onClick={() => setAdding(!adding)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ background: adding ? `${accent}22` : C.surface2, color: accent }}>
          {adding ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>
      {total > 0 && (
        <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: C.surface2 }}>
          <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${pct}%`, background: accent, boxShadow: `0 0 6px ${accent}88` }} />
        </div>
      )}
      {adding && (
        <div className="flex gap-2 mb-3">
          <input value={text} onChange={e => setText(e.target.value)} autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={`New ${type} task...`}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: accent, color: C.bg }}>Add</button>
        </div>
      )}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-xs" style={{ color: C.muted }}>no {type} tasks yet — tap + to add one</div>
        ) : tasks.map(t => <TaskItem key={t.id} task={t} accent={accent} xpValue={xp} onToggle={onToggle} onDelete={onDelete} />)}
      </div>
    </div>
  );
};

const Tasks = ({ state, addTask, toggleTask, deleteTask }) => {
  const today = todayStr(), wk = weekKey(), mo = monthKey();
  const dailyTasks = state.tasks.daily.filter(t => t.dueDate === today);
  const weeklyTasks = state.tasks.weekly.filter(t => t.weekStart === wk);
  const monthlyTasks = state.tasks.monthly.filter(t => t.monthKey === mo);
  const dailyAllDone = dailyTasks.length > 0 && dailyTasks.every(t => t.done);
  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      {dailyAllDone && (
        <div className="p-4 rounded-2xl text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${C.lime}25, ${C.cyan}25, ${C.pink}25)`, border: `1px solid ${C.lime}66` }}>
          <Sparkles size={20} style={{ color: C.lime, margin: '0 auto 4px' }} />
          <div className="text-sm font-bold" style={{ color: C.lime }}>DAILY QUEST CONQUERED</div>
          <div className="text-xs" style={{ color: C.muted }}>+20 bonus XP earned for full completion</div>
        </div>
      )}
      <TaskSection title="Daily" type="daily" tasks={dailyTasks} accent={C.lime} icon={Zap}
        onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
      <TaskSection title="This Week" type="weekly" tasks={weeklyTasks} accent={C.cyan} icon={Calendar}
        onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
      <TaskSection title="This Month" type="monthly" tasks={monthlyTasks} accent={C.pink} icon={Trophy}
        onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
    </div>
  );
};

// =============================================================================
// BUDGET
// =============================================================================
const BudgetCategoryCard = ({ catKey, cat, definition, onAddTxn, onEditTarget, onDeleteTxn }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [newTarget, setNewTarget] = useState(definition.type === 'debt' ? cat.total : cat.target);
  const Icon = definition.icon;
  const isLoan = definition.type === 'debt';
  const current = isLoan ? cat.paid : cat.current;
  const target = isLoan ? cat.total : cat.target;
  const pct = target ? Math.min(100, (current / target) * 100) : 0;
  const remaining = target - current;
  const fmt = (n) => fmtCurr(n, definition.currency);

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!isNaN(amt) && amt > 0) { onAddTxn(catKey, amt, note); setAmount(''); setNote(''); setShowAdd(false); }
  };
  const handleEditTarget = () => {
    const t = parseFloat(newTarget);
    if (!isNaN(t) && t >= 0) { onEditTarget(catKey, t); setShowEdit(false); }
  };

  return (
    <div className="p-4 rounded-2xl" style={{ background: `linear-gradient(135deg, ${C.surface}, ${definition.color}08)`, border: `1px solid ${definition.color}33` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${definition.color}20` }}>
            <Icon size={18} style={{ color: definition.color }} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: C.text }}>{definition.label}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>
              {isLoan ? 'paying off' : 'saving up'} • {definition.currency}
            </div>
          </div>
        </div>
        <button onClick={() => setShowEdit(!showEdit)}><Edit2 size={14} style={{ color: C.muted }} /></button>
      </div>
      {showEdit && (
        <div className="mb-3 flex gap-2">
          <input type="number" value={newTarget} onChange={e => setNewTarget(e.target.value)}
            placeholder={isLoan ? 'Total loan amount' : 'Target amount'}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          <button onClick={handleEditTarget} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: definition.color, color: C.bg }}>save</button>
        </div>
      )}
      <div className="mb-2">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="text-2xl font-bold tabular-nums" style={{ color: definition.color, fontFamily: 'JetBrains Mono, monospace' }}>{fmt(current)}</div>
          <div className="text-xs tabular-nums" style={{ color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>/ {fmt(target)}</div>
        </div>
        <div className="h-2 rounded-full overflow-hidden relative" style={{ background: C.surface2 }}>
          <div className="h-full transition-all duration-700 rounded-full"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${definition.color}aa, ${definition.color})`, boxShadow: `0 0 12px ${definition.color}88` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px]">
          <span style={{ color: C.muted }}>{pct.toFixed(1)}% {isLoan ? 'cleared' : 'saved'}</span>
          <span style={{ color: C.muted }}>{fmt(remaining)} to go</span>
        </div>
      </div>
      <button onClick={() => setShowAdd(!showAdd)}
        className="w-full mt-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
        style={{ background: showAdd ? C.surface2 : `${definition.color}15`, color: definition.color, border: `1px dashed ${definition.color}55` }}>
        <Plus size={12} /> {isLoan ? 'Log payment' : 'Add contribution'}
      </button>
      {showAdd && (
        <div className="mt-3 space-y-2">
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
          <button onClick={handleAdd} className="w-full py-2 rounded-lg text-xs font-semibold" style={{ background: definition.color, color: C.bg }}>
            Add {fmt(parseFloat(amount) || 0)}
          </button>
        </div>
      )}
      {cat.transactions.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px dashed ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>Recent</div>
          <div className="space-y-1.5">
            {[...cat.transactions].reverse().slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs group">
                <div className="flex-1 min-w-0">
                  <div style={{ color: C.text }} className="truncate">{t.note || (isLoan ? 'payment' : 'contribution')}</div>
                  <div className="text-[10px]" style={{ color: C.muted }}>{t.date}</div>
                </div>
                <div className="tabular-nums font-semibold" style={{ color: definition.color, fontFamily: 'JetBrains Mono, monospace' }}>+{fmt(t.amount)}</div>
                <button onClick={() => onDeleteTxn(catKey, t.id)} className="ml-2 opacity-0 group-hover:opacity-100"><X size={12} style={{ color: C.muted }} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const WeeklyExpenses = ({ state, addExpense, setBudget, deleteExpense }) => {
  const [adding, setAdding] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [newBudget, setNewBudget] = useState(state.budget.weekly.budget);

  const wk = weekKey();
  const weekTxns = state.budget.weekly.transactions.filter(t => new Date(t.date) >= new Date(wk));
  const spent = weekTxns.reduce((s, t) => s + t.amount, 0);
  const budget = state.budget.weekly.budget;
  const left = budget - spent;
  const pct = budget ? Math.min(100, (spent / budget) * 100) : 0;
  const overBudget = spent > budget;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const total = state.budget.weekly.transactions.filter(t => t.date === key).reduce((s, t) => s + t.amount, 0);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), amount: total };
  });

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!isNaN(amt) && amt > 0) { addExpense(amt, note); setAmount(''); setNote(''); setAdding(false); }
  };

  return (
    <div className="p-4 rounded-2xl" style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.amber}08)`, border: `1px solid ${C.amber}33` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${C.amber}20` }}>
            <Wallet size={18} style={{ color: C.amber }} />
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ color: C.text }}>Weekly Expenses</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>weekly budget</div>
          </div>
        </div>
        <button onClick={() => setEditingBudget(!editingBudget)}><Edit2 size={14} style={{ color: C.muted }} /></button>
      </div>
      {editingBudget && (
        <div className="mb-3 flex gap-2">
          <input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="Weekly budget"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          <button onClick={() => { setBudget(parseFloat(newBudget) || 0); setEditingBudget(false); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: C.amber, color: C.bg }}>save</button>
        </div>
      )}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="text-2xl font-bold tabular-nums" style={{ color: overBudget ? C.coral : C.amber, fontFamily: 'JetBrains Mono, monospace' }}>{fmtUSD(spent)}</div>
          <div className="text-xs tabular-nums" style={{ color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>of {fmtUSD(budget)}</div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: C.surface2 }}>
          <div className="h-full transition-all duration-700 rounded-full"
            style={{ width: `${pct}%`, background: overBudget ? `linear-gradient(90deg, ${C.amber}, ${C.coral})` : `linear-gradient(90deg, ${C.amber}aa, ${C.amber})`, boxShadow: `0 0 12px ${(overBudget ? C.coral : C.amber)}77` }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px]">
          <span style={{ color: C.muted }}>{pct.toFixed(1)}% used</span>
          <span style={{ color: overBudget ? C.coral : C.muted }}>
            {overBudget ? `${fmtUSD(-left)} over` : `${fmtUSD(left)} remaining`}
          </span>
        </div>
      </div>
      <div className="my-4" style={{ height: 80 }}>
        <ResponsiveContainer>
          <BarChart data={last7} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="day" stroke={C.muted} fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: C.text }} formatter={(v) => [fmtUSD(v), 'spent']} />
            <Bar dataKey="amount" fill={C.amber} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <button onClick={() => setAdding(!adding)}
        className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
        style={{ background: adding ? C.surface2 : `${C.amber}15`, color: C.amber, border: `1px dashed ${C.amber}55` }}>
        <Plus size={12} /> Log expense
      </button>
      {adding && (
        <div className="mt-3 space-y-2">
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="What was it for?"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
          <button onClick={handleAdd} className="w-full py-2 rounded-lg text-xs font-semibold" style={{ background: C.amber, color: C.bg }}>
            Log {fmtUSD(parseFloat(amount) || 0)}
          </button>
        </div>
      )}
      {weekTxns.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px dashed ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>This Week</div>
          <div className="space-y-1.5">
            {[...weekTxns].reverse().slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs group">
                <div className="flex-1 min-w-0">
                  <div style={{ color: C.text }} className="truncate">{t.note || 'expense'}</div>
                  <div className="text-[10px]" style={{ color: C.muted }}>{t.date}</div>
                </div>
                <div className="tabular-nums font-semibold" style={{ color: C.amber, fontFamily: 'JetBrains Mono, monospace' }}>-{fmtUSD(t.amount)}</div>
                <button onClick={() => deleteExpense(t.id)} className="ml-2 opacity-0 group-hover:opacity-100"><X size={12} style={{ color: C.muted }} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Budget = ({ state, ...handlers }) => {
  const savingsData = BUDGET_CATEGORIES.filter(c => c.type === 'savings')
    .map(c => ({ name: c.label, value: state.budget[c.key].current || 0.0001, color: c.color }));
  const totalUSD = savingsData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="p-5 rounded-3xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 mb-2">
          <Coins size={16} style={{ color: C.lime }} />
          <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.text }}>Wealth Distribution</div>
        </div>
        <div className="flex items-center gap-4">
          <div style={{ width: 120, height: 120 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={savingsData} dataKey="value" innerRadius={35} outerRadius={55} paddingAngle={3}>
                  {savingsData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Total saved</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: C.lime, fontFamily: 'JetBrains Mono, monospace' }}>{fmtUSD(totalUSD)}</div>
            <div className="space-y-1 pt-1">
              {savingsData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span style={{ color: C.muted }}>{d.name}</span>
                  </div>
                  <span className="tabular-nums" style={{ color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>
                    {fmtUSD(d.value < 0.001 ? 0 : d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <WeeklyExpenses state={state} addExpense={handlers.addWeeklyExpense}
        deleteExpense={handlers.deleteWeeklyExpense} setBudget={handlers.setWeeklyBudget} />
      {BUDGET_CATEGORIES.filter(c => c.key !== 'educationLoan').map(c => (
        <BudgetCategoryCard key={c.key} catKey={c.key} cat={state.budget[c.key]} definition={c}
          onAddTxn={handlers.addBudgetTxn} onEditTarget={handlers.editBudgetTarget} onDeleteTxn={handlers.deleteBudgetTxn} />
      ))}
      <LoanCard loan={state.budget.educationLoan}
        onAddPayment={(amt, note) => handlers.addBudgetTxn('educationLoan', amt, note)}
        onDeletePayment={(id) => handlers.deleteBudgetTxn('educationLoan', id)}
        onEditLoan={handlers.editLoan} />
    </div>
  );
};

// =============================================================================
// GOAL ANIMATIONS — Flower (daily), Balloon (weekly), Rocket (monthly)
// =============================================================================
const FlowerViz = ({ pct }) => {
  const petals = Array.from({ length: 8 }, (_, i) => {
    const threshold = ((i + 1) / 8) * 100;
    const colors = ['#FF85A1', '#FFA764', '#FFE066', '#B6F500', '#7FE5C7', '#39E0FF', '#BD9CFF', '#FF4B91'];
    return { bloomed: pct >= threshold, angle: (i / 8) * 360, color: colors[i] };
  });
  return (
    <svg viewBox="0 0 200 200" style={{ width: '100%', maxHeight: 160 }}>
      <path d="M 100 130 Q 102 165 100 195" stroke="#4ADE80" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="115" cy="160" rx="12" ry="5" fill="#22C55E" transform="rotate(30 115 160)" />
      <ellipse cx="85" cy="175" rx="10" ry="4" fill="#22C55E" transform="rotate(-30 85 175)" />
      {petals.map((p, i) => (
        <g key={i} transform={`rotate(${p.angle} 100 100)`}>
          <ellipse cx="100" cy="68" rx="13" ry="22" fill={p.color}
            style={{
              transform: p.bloomed ? 'scale(1)' : 'scale(0)',
              transformOrigin: '100px 100px',
              transition: `transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08}s`,
              opacity: p.bloomed ? 0.95 : 0,
              filter: p.bloomed ? `drop-shadow(0 0 4px ${p.color}88)` : 'none'
            }} />
        </g>
      ))}
      <circle cx="100" cy="100" r="14" fill="#FFE066" stroke="#FFB627" strokeWidth="2" />
      {[0, 60, 120, 180, 240, 300].map(a => (
        <circle key={a} cx={100 + 5 * Math.cos(a * Math.PI / 180)} cy={100 + 5 * Math.sin(a * Math.PI / 180)} r="1.5" fill="#F59E0B" />
      ))}
    </svg>
  );
};

const BalloonViz = ({ pct }) => {
  const yShift = -(140 * (pct / 100));
  return (
    <svg viewBox="0 0 200 200" style={{ width: '100%', maxHeight: 160 }}>
      <ellipse cx="30" cy="50" rx="22" ry="11" fill="white" opacity="0.25" />
      <ellipse cx="170" cy="80" rx="18" ry="9" fill="white" opacity="0.25" />
      <ellipse cx="45" cy="130" rx="15" ry="7" fill="white" opacity="0.22" />
      <ellipse cx="160" cy="160" rx="14" ry="6" fill="white" opacity="0.22" />
      <g style={{ transform: `translateY(${yShift}px)`, transition: 'transform 0.9s ease-out' }}>
        <ellipse cx="100" cy="155" rx="35" ry="40" fill="url(#balloonGrad)" />
        <path d="M 65 155 Q 100 145 135 155 M 70 175 Q 100 168 130 175 M 80 130 Q 100 118 120 130" stroke="#FF4B91" strokeWidth="1.5" fill="none" opacity="0.6" />
        <line x1="80" y1="190" x2="90" y2="208" stroke="#92400E" strokeWidth="1" />
        <line x1="120" y1="190" x2="110" y2="208" stroke="#92400E" strokeWidth="1" />
        <rect x="86" y="206" width="28" height="18" fill="#A0522D" rx="2" />
        <rect x="88" y="208" width="24" height="3" fill="#8B4513" />
        <rect x="88" y="214" width="24" height="3" fill="#8B4513" />
      </g>
      <defs>
        <linearGradient id="balloonGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#FFA764" />
          <stop offset="100%" stopColor="#FF4B91" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const RocketViz = ({ pct }) => {
  const yShift = -(150 * (pct / 100));
  return (
    <svg viewBox="0 0 200 200" style={{ width: '100%', maxHeight: 160 }}>
      {Array.from({ length: 25 }).map((_, i) => (
        <circle key={i} cx={(i * 47) % 200} cy={(i * 31) % 200} r={0.5 + (i % 3) * 0.6} fill="white"
          opacity={0.3 + (i % 4) * 0.2}
          style={{ animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
      ))}
      <circle cx="155" cy="40" r="22" fill="#FFE066" opacity={pct > 70 ? 1 : 0.4} style={{ transition: 'opacity 0.5s' }} />
      <circle cx="148" cy="34" r="3" fill="#FFB627" opacity={pct > 70 ? 0.6 : 0.2} />
      <circle cx="162" cy="46" r="2" fill="#FFB627" opacity={pct > 70 ? 0.6 : 0.2} />
      <g style={{ transform: `translateY(${yShift}px)`, transition: 'transform 1s ease-out' }}>
        <path d={`M 100 175 L 100 ${175 + Math.max(20, 80 - pct)}`} stroke="url(#flameTrail)" strokeWidth="4" opacity="0.7" strokeLinecap="round" />
        <path d="M 100 105 L 85 145 L 115 145 Z" fill="#FF4B91" />
        <rect x="85" y="145" width="30" height="35" fill="#E5E7EB" rx="3" />
        <circle cx="100" cy="160" r="6" fill="#39E0FF" stroke="#0EA5E9" strokeWidth="1.5" />
        <path d="M 85 175 L 75 192 L 85 188 Z" fill="#FF4B91" />
        <path d="M 115 175 L 125 192 L 115 188 Z" fill="#FF4B91" />
        <path d="M 92 180 Q 100 200 108 180 Q 102 195 100 188 Q 98 195 92 180" fill="#FFE066">
          <animate attributeName="opacity" values="1;0.6;1" dur="0.3s" repeatCount="indefinite" />
        </path>
        <path d="M 95 178 Q 100 192 105 178 Q 102 188 100 184 Q 98 188 95 178" fill="#FF4B91">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="0.3s" repeatCount="indefinite" />
        </path>
      </g>
      <defs>
        <linearGradient id="flameTrail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB627" />
          <stop offset="100%" stopColor="#FFB627" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// =============================================================================
// GOALS — daily, weekly, monthly with animations
// =============================================================================
const GoalCard = ({ goal, type, accent, vizComponent: Viz, onUpdate, onDelete, onIncrement }) => {
  const [showEdit, setShowEdit] = useState(false);
  const [val, setVal] = useState(goal.current);
  const pct = goal.target ? Math.min(100, (goal.current / goal.target) * 100) : 0;
  const isDone = pct >= 100;

  return (
    <div className="p-4 rounded-2xl relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${C.surface}, ${accent}10)`, border: `1px solid ${accent}33` }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: accent }}>
            {type} goal {isDone && '· ✓ done'}
          </div>
          <div className="text-lg font-bold truncate" style={{ color: C.text, fontFamily: 'Fraunces, serif' }}>{goal.name}</div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowEdit(!showEdit)} className="p-1.5 rounded-lg" style={{ background: C.surface2 }}>
            <Edit2 size={12} style={{ color: C.muted }} />
          </button>
          <button onClick={() => onDelete(type, goal.id)} className="p-1.5 rounded-lg" style={{ background: C.surface2 }}>
            <Trash2 size={12} style={{ color: C.muted }} />
          </button>
        </div>
      </div>

      <Viz pct={pct} />

      <div className="flex items-baseline justify-between mt-2 mb-2">
        <div className="text-2xl font-bold tabular-nums" style={{ color: accent, fontFamily: 'JetBrains Mono, monospace' }}>{goal.current}</div>
        <div className="text-xs tabular-nums" style={{ color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>/ {goal.target} {goal.unit || ''}</div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: C.surface2 }}>
        <div className="h-full transition-all duration-700 rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}aa, ${accent})`, boxShadow: `0 0 8px ${accent}88` }} />
      </div>

      <div className="flex gap-2">
        <button onClick={() => onIncrement(type, goal.id, 1)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold"
          style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}>+1</button>
        <button onClick={() => onIncrement(type, goal.id, 5)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold"
          style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}>+5</button>
        <button onClick={() => onIncrement(type, goal.id, -1)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold"
          style={{ background: C.surface2, color: C.muted, border: `1px solid ${C.border}` }}>-1</button>
      </div>

      {showEdit && (
        <div className="mt-3 flex gap-2">
          <input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="Set value"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          <button onClick={() => { onUpdate(type, goal.id, parseFloat(val) || 0); setShowEdit(false); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: accent, color: C.bg }}>save</button>
        </div>
      )}
    </div>
  );
};

const AddGoalForm = ({ type, accent, onAdd, onCancel }) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  return (
    <div className="p-4 rounded-2xl space-y-2" style={{ background: C.surface, border: `1px dashed ${accent}` }}>
      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: accent }}>new {type} goal</div>
      <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="Goal name"
        className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
      <div className="flex gap-2">
        <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="Target"
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
          style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
        <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="unit (optional)"
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-xs font-semibold"
          style={{ background: C.surface2, color: C.muted }}>cancel</button>
        <button onClick={() => { if (name && target) { onAdd(type, name, parseFloat(target), unit); }}}
          className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: accent, color: C.bg }}>add</button>
      </div>
    </div>
  );
};

const GoalsTabSection = ({ type, accent, label, viz, vizName, goals, onAdd, onUpdate, onIncrement, onDelete }) => {
  const [adding, setAdding] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: accent }}>{label}</div>
          <div className="text-[10px]" style={{ color: C.muted }}>watch your {vizName}{goals.length !== 1 ? 's' : ''} {type === 'daily' ? 'bloom' : type === 'weekly' ? 'rise' : 'launch'}</div>
        </div>
        <button onClick={() => setAdding(!adding)} className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}20`, color: accent }}>
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>
      {adding && <AddGoalForm type={type} accent={accent} onCancel={() => setAdding(false)}
        onAdd={(...args) => { onAdd(...args); setAdding(false); }} />}
      {goals.length === 0 && !adding ? (
        <div className="text-center py-6 text-xs rounded-2xl"
          style={{ color: C.muted, background: C.surface, border: `1px dashed ${C.border}` }}>
          no {type} goals yet
        </div>
      ) : goals.map(g => (
        <GoalCard key={g.id} goal={g} type={type} accent={accent} vizComponent={viz}
          onUpdate={onUpdate} onIncrement={onIncrement} onDelete={onDelete} />
      ))}
    </div>
  );
};

const Goals = ({ state, addGoal, updateGoal, incrementGoal, deleteGoal }) => {
  const [tab, setTab] = useState('daily');
  const tabs = [
    { id: 'daily', label: 'Daily', accent: C.pink, viz: FlowerViz, vizName: 'flower' },
    { id: 'weekly', label: 'Weekly', accent: C.amber, viz: BalloonViz, vizName: 'balloon' },
    { id: 'monthly', label: 'Monthly', accent: C.cyan, viz: RocketViz, vizName: 'rocket' },
  ];
  const current = tabs.find(t => t.id === tab);
  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="text-center py-3">
        <div className="text-xs uppercase tracking-[0.3em] font-semibold" style={{ color: current.accent }}>
          ✦ Goals & Progress ✦
        </div>
        <div className="text-sm italic mt-1" style={{ color: C.text, fontFamily: 'Fraunces, serif' }}>
          every step counts.
        </div>
      </div>
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: tab === t.id ? `${t.accent}22` : 'transparent',
              color: tab === t.id ? t.accent : C.muted,
              border: tab === t.id ? `1px solid ${t.accent}55` : '1px solid transparent'
            }}>{t.label}</button>
        ))}
      </div>
      <GoalsTabSection type={tab} accent={current.accent} label={`${current.label} Goals`}
        viz={current.viz} vizName={current.vizName} goals={state.goals[tab]}
        onAdd={addGoal} onUpdate={updateGoal} onIncrement={incrementGoal} onDelete={deleteGoal} />
    </div>
  );
};

// =============================================================================
// HEALTH — 4 sub-tabs: Workouts, Nutrition, Water, Weight
// =============================================================================
const WorkoutSchedule = ({ state, updateDay, addExercise, deleteExercise, toggleExerciseDone }) => {
  const today = new Date().getDay();
  const [editingDay, setEditingDay] = useState(null);
  const [editName, setEditName] = useState('');
  const [addingTo, setAddingTo] = useState(null);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('');
  const [exDur, setExDur] = useState('');
  const todayKey = todayStr();

  return (
    <div className="space-y-3">
      <div className="text-center py-2">
        <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.emerald }}>weekly schedule</div>
        <div className="text-[10px]" style={{ color: C.muted }}>tap any day to edit · today highlighted</div>
      </div>
      {[1, 2, 3, 4, 5, 6, 0].map(d => {
        const day = state.health.workoutSchedule[d];
        const isToday = d === today;
        const isEditing = editingDay === d;
        const isAdding = addingTo === d;
        const todaysExDone = day.exercises.filter(e => state.health.exerciseDone[`${todayKey}-${e.id}`]).length;
        return (
          <div key={d} className="rounded-2xl overflow-hidden"
            style={{
              background: isToday ? `linear-gradient(135deg, ${C.surface}, ${C.emerald}15)` : C.surface,
              border: `1px solid ${isToday ? C.emerald + '55' : C.border}`,
              boxShadow: isToday ? `0 0 16px ${C.emerald}22` : 'none'
            }}>
            <div className="p-3 flex items-center gap-3">
              <div className="w-12 text-center">
                <div className="text-[10px] uppercase tracking-wider" style={{ color: isToday ? C.emerald : C.muted }}>{DAY_SHORT[d]}</div>
                {isToday && <div className="text-[8px] font-bold" style={{ color: C.emerald }}>TODAY</div>}
              </div>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                    onBlur={() => { updateDay(d, editName); setEditingDay(null); }}
                    onKeyDown={e => e.key === 'Enter' && (updateDay(d, editName), setEditingDay(null))}
                    className="w-full px-2 py-1 rounded-lg text-sm outline-none"
                    style={{ background: C.surface2, color: C.text, border: `1px solid ${C.emerald}` }} />
                ) : (
                  <button onClick={() => { setEditName(day.name); setEditingDay(d); }}
                    className="text-left w-full">
                    <div className="font-bold text-sm" style={{ color: C.text }}>{day.name}</div>
                    <div className="text-[10px]" style={{ color: C.muted }}>
                      {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                      {isToday && day.exercises.length > 0 && ` · ${todaysExDone}/${day.exercises.length} done`}
                    </div>
                  </button>
                )}
              </div>
              <button onClick={() => setAddingTo(isAdding ? null : d)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${C.emerald}20`, color: C.emerald }}>
                {isAdding ? <X size={14} /> : <Plus size={14} />}
              </button>
            </div>
            {isAdding && (
              <div className="px-3 pb-3 space-y-2" style={{ borderTop: `1px dashed ${C.border}` }}>
                <input value={exName} onChange={e => setExName(e.target.value)} autoFocus
                  placeholder="Exercise (e.g. Squats)"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none mt-2"
                  style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
                <div className="flex gap-2">
                  <input value={exSets} onChange={e => setExSets(e.target.value)} placeholder="Sets × Reps (e.g. 4×10)"
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
                  <input type="number" value={exDur} onChange={e => setExDur(e.target.value)} placeholder="Min"
                    className="w-20 px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
                    style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
                </div>
                <button onClick={() => { if (exName) { addExercise(d, exName, exSets, parseInt(exDur) || 0); setExName(''); setExSets(''); setExDur(''); setAddingTo(null); } }}
                  className="w-full py-2 rounded-lg text-xs font-semibold" style={{ background: C.emerald, color: C.bg }}>add exercise</button>
              </div>
            )}
            {day.exercises.length > 0 && (
              <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: `1px dashed ${C.border}` }}>
                {day.exercises.map(ex => {
                  const doneKey = `${todayKey}-${ex.id}`;
                  const isDone = state.health.exerciseDone[doneKey];
                  return (
                    <div key={ex.id} className="flex items-center gap-2 mt-2 p-2 rounded-lg group"
                      style={{ background: isDone && isToday ? `${C.emerald}10` : C.surface2 }}>
                      {isToday && (
                        <button onClick={() => toggleExerciseDone(doneKey)}
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: isDone ? C.emerald : 'transparent', border: `2px solid ${C.emerald}` }}>
                          {isDone && <Check size={10} style={{ color: C.bg }} strokeWidth={3} />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold" style={{
                          color: isDone && isToday ? C.muted : C.text,
                          textDecoration: isDone && isToday ? 'line-through' : 'none'
                        }}>{ex.name}</div>
                        <div className="text-[10px]" style={{ color: C.muted }}>
                          {ex.setsReps && <span>{ex.setsReps}</span>}
                          {ex.setsReps && ex.duration ? ' · ' : ''}
                          {ex.duration ? `${ex.duration}min` : ''}
                        </div>
                      </div>
                      <button onClick={() => deleteExercise(d, ex.id)} className="opacity-0 group-hover:opacity-100">
                        <Trash2 size={11} style={{ color: C.muted }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const NutritionTab = ({ state, addMeal, deleteMeal, updateTargets }) => {
  const today = todayStr();
  const todayMeals = state.health.nutrition.meals.filter(m => m.date === today);
  const totals = todayMeals.reduce((acc, m) => ({
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fiber: acc.fiber + (m.fiber || 0),
    calories: acc.calories + (m.calories || 0)
  }), { protein: 0, carbs: 0, fiber: 0, calories: 0 });
  const targets = state.health.nutrition.targets;

  const [showTargets, setShowTargets] = useState(false);
  const [tP, setTP] = useState(targets.protein);
  const [tC, setTC] = useState(targets.carbs);
  const [tF, setTF] = useState(targets.fiber);
  const [tCal, setTCal] = useState(targets.calories);

  const [adding, setAdding] = useState(false);
  const [mt, setMt] = useState('breakfast');
  const [mn, setMn] = useState('');
  const [mp, setMp] = useState('');
  const [mc, setMc] = useState('');
  const [mf, setMf] = useState('');
  const [mcal, setMcal] = useState('');
  const [mv, setMv] = useState('');

  const macros = [
    { key: 'protein', label: 'Protein', icon: Egg, color: C.coral, unit: 'g' },
    { key: 'carbs', label: 'Carbs', icon: Wheat, color: C.amber, unit: 'g' },
    { key: 'fiber', label: 'Fiber', icon: Cherry, color: C.emerald, unit: 'g' },
    { key: 'calories', label: 'Calories', icon: Cookie, color: C.pink, unit: 'kcal' },
  ];

  const handleAddMeal = () => {
    if (mn.trim()) {
      addMeal({
        mealType: mt, name: mn.trim(),
        protein: parseFloat(mp) || 0,
        carbs: parseFloat(mc) || 0,
        fiber: parseFloat(mf) || 0,
        calories: parseFloat(mcal) || 0,
        vitamins: mv.trim()
      });
      setMn(''); setMp(''); setMc(''); setMf(''); setMcal(''); setMv(''); setAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.coral }}>nutrition today</div>
          <div className="text-[10px]" style={{ color: C.muted }}>{todayMeals.length} meal{todayMeals.length !== 1 ? 's' : ''} logged</div>
        </div>
        <button onClick={() => setShowTargets(!showTargets)} className="p-2 rounded-lg" style={{ background: C.surface }}>
          <Settings size={14} style={{ color: C.muted }} />
        </button>
      </div>

      {/* 4 macro rings */}
      <div className="grid grid-cols-2 gap-3">
        {macros.map(m => {
          const val = totals[m.key];
          const tgt = targets[m.key];
          const pct = tgt ? Math.min(100, (val / tgt) * 100) : 0;
          const Icon = m.icon;
          return (
            <div key={m.key} className="p-3 rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${C.surface}, ${m.color}10)`, border: `1px solid ${m.color}33` }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color: m.color }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: m.color }}>{m.label}</span>
              </div>
              <div className="relative aspect-square">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke={C.surface2} strokeWidth="3" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke={m.color} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${Math.min(100, pct) * 0.88} 100`}
                    style={{ transition: 'stroke-dasharray 0.7s', filter: `drop-shadow(0 0 4px ${m.color}88)` }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold tabular-nums" style={{ color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(val)}</div>
                  <div className="text-[9px] tabular-nums" style={{ color: C.muted }}>/ {tgt}{m.unit}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showTargets && (
        <div className="p-4 rounded-2xl space-y-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>daily targets</div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={tP} onChange={e => setTP(e.target.value)} placeholder="Protein (g)"
              className="px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
            <input type="number" value={tC} onChange={e => setTC(e.target.value)} placeholder="Carbs (g)"
              className="px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
            <input type="number" value={tF} onChange={e => setTF(e.target.value)} placeholder="Fiber (g)"
              className="px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
            <input type="number" value={tCal} onChange={e => setTCal(e.target.value)} placeholder="Calories"
              className="px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
          <button onClick={() => {
            updateTargets({
              protein: parseFloat(tP) || 0, carbs: parseFloat(tC) || 0,
              fiber: parseFloat(tF) || 0, calories: parseFloat(tCal) || 0
            });
            setShowTargets(false);
          }} className="w-full py-2 rounded-lg text-xs font-semibold" style={{ background: C.coral, color: C.bg }}>save targets</button>
        </div>
      )}

      <button onClick={() => setAdding(!adding)}
        className="w-full py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5"
        style={{ background: adding ? C.surface : `${C.coral}15`, color: C.coral, border: `1px dashed ${C.coral}55` }}>
        {adding ? <X size={12} /> : <Plus size={12} />} {adding ? 'cancel' : 'Log a meal'}
      </button>

      {adding && (
        <div className="p-4 rounded-2xl space-y-2" style={{ background: C.surface, border: `1px solid ${C.coral}44` }}>
          <div className="flex gap-1">
            {['breakfast', 'lunch', 'dinner', 'snack'].map(t => (
              <button key={t} onClick={() => setMt(t)}
                className="flex-1 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider"
                style={{ background: mt === t ? C.coral : C.surface2, color: mt === t ? C.bg : C.muted }}>{t}</button>
            ))}
          </div>
          <input value={mn} onChange={e => setMn(e.target.value)} placeholder="Meal name (e.g. Grilled chicken salad)"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={mp} onChange={e => setMp(e.target.value)} placeholder="Protein (g)"
              className="px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
            <input type="number" value={mc} onChange={e => setMc(e.target.value)} placeholder="Carbs (g)"
              className="px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
            <input type="number" value={mf} onChange={e => setMf(e.target.value)} placeholder="Fiber (g)"
              className="px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
            <input type="number" value={mcal} onChange={e => setMcal(e.target.value)} placeholder="Calories"
              className="px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
          <input value={mv} onChange={e => setMv(e.target.value)} placeholder="Vitamins / minerals (e.g. Vit C, Iron)"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
          <button onClick={handleAddMeal} className="w-full py-2 rounded-lg text-xs font-semibold" style={{ background: C.coral, color: C.bg }}>log meal</button>
        </div>
      )}

      {/* Today's meals */}
      {todayMeals.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold px-1" style={{ color: C.muted }}>today's meals</div>
          {todayMeals.map(m => (
            <div key={m.id} className="p-3 rounded-2xl group"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: C.coral }}>{m.mealType}</div>
                  <div className="text-sm font-semibold" style={{ color: C.text }}>{m.name}</div>
                </div>
                <button onClick={() => deleteMeal(m.id)} className="opacity-0 group-hover:opacity-100">
                  <Trash2 size={12} style={{ color: C.muted }} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1 mt-2">
                <div className="text-center p-1.5 rounded-lg" style={{ background: `${C.coral}15` }}>
                  <div className="text-[9px]" style={{ color: C.muted }}>P</div>
                  <div className="text-xs font-bold tabular-nums" style={{ color: C.coral, fontFamily: 'JetBrains Mono, monospace' }}>{m.protein}g</div>
                </div>
                <div className="text-center p-1.5 rounded-lg" style={{ background: `${C.amber}15` }}>
                  <div className="text-[9px]" style={{ color: C.muted }}>C</div>
                  <div className="text-xs font-bold tabular-nums" style={{ color: C.amber, fontFamily: 'JetBrains Mono, monospace' }}>{m.carbs}g</div>
                </div>
                <div className="text-center p-1.5 rounded-lg" style={{ background: `${C.emerald}15` }}>
                  <div className="text-[9px]" style={{ color: C.muted }}>F</div>
                  <div className="text-xs font-bold tabular-nums" style={{ color: C.emerald, fontFamily: 'JetBrains Mono, monospace' }}>{m.fiber}g</div>
                </div>
                <div className="text-center p-1.5 rounded-lg" style={{ background: `${C.pink}15` }}>
                  <div className="text-[9px]" style={{ color: C.muted }}>kcal</div>
                  <div className="text-xs font-bold tabular-nums" style={{ color: C.pink, fontFamily: 'JetBrains Mono, monospace' }}>{m.calories}</div>
                </div>
              </div>
              {m.vitamins && (
                <div className="mt-2 text-[10px] px-2 py-1 rounded-lg" style={{ background: C.surface2, color: C.muted }}>
                  💊 {m.vitamins}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WaterTab = ({ state, setWater, setTarget }) => {
  const today = todayStr();
  const cur = state.health.water[today] || 0;
  const tgt = state.health.waterTarget;
  const pct = (cur / tgt) * 100;
  const [editing, setEditing] = useState(false);
  const [newTgt, setNewTgt] = useState(tgt);

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const k = d.toISOString().slice(0, 10);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), glasses: state.health.water[k] || 0 };
  });

  return (
    <div className="space-y-3">
      <div className="text-center py-2">
        <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.cyan }}>water intake</div>
        <div className="text-[10px]" style={{ color: C.muted }}>tap glasses to log</div>
      </div>

      {/* Big animated glass */}
      <div className="p-5 rounded-3xl text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.cyan}10)`, border: `1px solid ${C.cyan}44` }}>
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                bottom: `${(i * 17) % 100}%`,
                left: `${(i * 23) % 100}%`,
                width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px`,
                background: C.cyan, opacity: 0.15,
                animation: `bubble ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`
              }} />
          ))}
        </div>
        <div className="relative">
          <svg viewBox="0 0 100 120" style={{ width: 80, height: 100, margin: '0 auto' }}>
            <defs>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.cyan} stopOpacity="0.6" />
                <stop offset="100%" stopColor={C.sky} stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* glass outline */}
            <path d="M 20 10 L 25 110 Q 25 115 30 115 L 70 115 Q 75 115 75 110 L 80 10"
              fill="none" stroke={C.cyan} strokeWidth="2" />
            {/* water fill */}
            <clipPath id="glassClip">
              <path d="M 22 12 L 26 109 Q 26 112 30 112 L 70 112 Q 74 112 74 109 L 78 12 Z" />
            </clipPath>
            <rect x="20" y={110 - pct * 0.98} width="60" height={pct * 1.2} fill="url(#waterGrad)"
              clipPath="url(#glassClip)" style={{ transition: 'all 0.7s ease-out' }}>
              <animate attributeName="y" values={`${110 - pct * 0.98};${108 - pct * 0.98};${110 - pct * 0.98}`} dur="3s" repeatCount="indefinite" />
            </rect>
          </svg>
          <div className="mt-3">
            <div className="text-4xl font-bold tabular-nums" style={{ color: C.cyan, fontFamily: 'JetBrains Mono, monospace' }}>{cur}</div>
            <div className="text-xs tabular-nums" style={{ color: C.muted }}>of {tgt} glasses · {Math.round(pct)}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: tgt }).map((_, i) => (
          <button key={i} onClick={() => setWater(today, i + 1 === cur ? i : i + 1)}
            className="aspect-square rounded-2xl transition-all flex items-center justify-center"
            style={{
              background: i < cur ? `linear-gradient(135deg, ${C.cyan}33, ${C.sky}33)` : C.surface,
              border: `1px solid ${i < cur ? C.cyan : C.border}`,
              boxShadow: i < cur ? `0 0 12px ${C.cyan}44` : 'none'
            }}>
            <Droplet size={20} style={{ color: i < cur ? C.cyan : C.muted, fill: i < cur ? C.cyan : 'none' }} />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div>
          <div className="text-xs" style={{ color: C.text }}>Daily target</div>
          <div className="text-[10px]" style={{ color: C.muted }}>{tgt} glasses</div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <input type="number" value={newTgt} onChange={e => setNewTgt(e.target.value)}
              className="w-16 px-2 py-1 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
            <button onClick={() => { setTarget(parseInt(newTgt) || 8); setEditing(false); }}
              className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: C.cyan, color: C.bg }}>save</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs px-3 py-1 rounded-lg"
            style={{ background: C.surface2, color: C.cyan }}>edit</button>
        )}
      </div>

      <div className="p-4 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div className="text-[10px] uppercase tracking-wider mb-2 font-semibold" style={{ color: C.muted }}>last 7 days</div>
        <div style={{ height: 80 }}>
          <ResponsiveContainer>
            <BarChart data={last7} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="day" stroke={C.muted} fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: C.text }} />
              <ReferenceLine y={tgt} stroke={C.cyan} strokeDasharray="3 3" opacity={0.5} />
              <Bar dataKey="glasses" fill={C.cyan} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const WeightTab = ({ state, addWeight, deleteWeight, setGoal }) => {
  const [adding, setAdding] = useState(false);
  const [w, setW] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [g, setG] = useState(state.health.weightGoal);

  const entries = state.health.weight.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = entries[entries.length - 1];
  const first = entries[0];
  const change = latest && first ? latest.value - first.value : 0;
  const goal = state.health.weightGoal;
  const unit = state.health.weightUnit;

  const chartData = entries.slice(-12).map(e => ({
    date: new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    weight: e.value
  }));

  return (
    <div className="space-y-3">
      <div className="text-center py-2">
        <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: C.violet }}>weight tracker</div>
        <div className="text-[10px]" style={{ color: C.muted }}>log weekly to see your trend</div>
      </div>

      {/* Hero current weight */}
      <div className="p-5 rounded-3xl text-center"
        style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.violet}15)`, border: `1px solid ${C.violet}44` }}>
        <Scale size={24} style={{ color: C.violet, margin: '0 auto 8px' }} />
        <div className="text-4xl font-bold tabular-nums" style={{ color: C.violet, fontFamily: 'JetBrains Mono, monospace' }}>
          {latest ? latest.value : '—'}<span className="text-lg ml-1" style={{ color: C.muted }}>{unit}</span>
        </div>
        {latest && (
          <div className="text-xs mt-1" style={{ color: C.muted }}>logged {new Date(latest.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
        )}
        {change !== 0 && (
          <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs"
            style={{
              background: change < 0 ? `${C.emerald}20` : `${C.coral}20`,
              color: change < 0 ? C.emerald : C.coral
            }}>
            {change < 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
            {Math.abs(change).toFixed(1)} {unit} since first log
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="p-4 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider mb-2 font-semibold" style={{ color: C.muted }}>last 12 entries</div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.violet} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={C.violet} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke={C.muted} fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke={C.muted} fontSize={9} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: C.text }} />
                {goal > 0 && <ReferenceLine y={goal} stroke={C.lime} strokeDasharray="3 3" label={{ value: 'goal', position: 'right', fill: C.lime, fontSize: 9 }} />}
                <Area type="monotone" dataKey="weight" stroke={C.violet} strokeWidth={2.5} fill="url(#wGrad)" dot={{ fill: C.violet, r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Goal */}
      <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        <div>
          <div className="text-xs" style={{ color: C.text }}>Goal weight</div>
          <div className="text-[10px]" style={{ color: C.muted }}>{goal ? `${goal} ${unit}` : 'not set'}</div>
        </div>
        {editingGoal ? (
          <div className="flex gap-2">
            <input type="number" value={g} onChange={e => setG(e.target.value)}
              className="w-20 px-2 py-1 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
            <button onClick={() => { setGoal(parseFloat(g) || 0); setEditingGoal(false); }}
              className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: C.lime, color: C.bg }}>save</button>
          </div>
        ) : (
          <button onClick={() => setEditingGoal(true)} className="text-xs px-3 py-1 rounded-lg"
            style={{ background: C.surface2, color: C.lime }}>set goal</button>
        )}
      </div>

      <button onClick={() => setAdding(!adding)}
        className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: adding ? C.surface : `${C.violet}15`, color: C.violet, border: `1px dashed ${C.violet}66` }}>
        {adding ? <X size={14} /> : <Plus size={14} />} {adding ? 'cancel' : 'Log weight'}
      </button>

      {adding && (
        <div className="p-4 rounded-2xl space-y-2" style={{ background: C.surface, border: `1px solid ${C.violet}44` }}>
          <div className="flex gap-2">
            <input type="number" step="0.1" value={w} onChange={e => setW(e.target.value)} autoFocus
              placeholder={`Weight in ${unit}`}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
          <button onClick={() => { if (parseFloat(w) > 0) { addWeight(parseFloat(w)); setW(''); setAdding(false); } }}
            className="w-full py-2 rounded-lg text-xs font-semibold" style={{ background: C.violet, color: C.bg }}>log</button>
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div className="p-4 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider mb-2 font-semibold" style={{ color: C.muted }}>recent entries</div>
          <div className="space-y-1.5">
            {[...entries].reverse().slice(0, 8).map(e => (
              <div key={e.id} className="flex items-center justify-between text-xs p-2 rounded-lg group" style={{ background: C.surface2 }}>
                <div style={{ color: C.muted }}>{new Date(e.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="flex items-center gap-2">
                  <div className="tabular-nums font-bold" style={{ color: C.violet, fontFamily: 'JetBrains Mono, monospace' }}>{e.value} {unit}</div>
                  <button onClick={() => deleteWeight(e.id)} className="opacity-0 group-hover:opacity-100">
                    <X size={11} style={{ color: C.muted }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Health = ({ state, ...handlers }) => {
  const [tab, setTab] = useState('workouts');
  const tabs = [
    { id: 'workouts', label: 'Workouts', icon: Dumbbell, color: C.emerald },
    { id: 'nutrition', label: 'Nutrition', icon: Salad, color: C.coral },
    { id: 'water', label: 'Water', icon: Droplet, color: C.cyan },
    { id: 'weight', label: 'Weight', icon: Scale, color: C.violet },
    { id: 'history', label: 'History', icon: History, color: C.pink },
  ];
  const current = tabs.find(t => t.id === tab);

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="text-center py-2">
        <div className="text-xs uppercase tracking-[0.3em] font-semibold" style={{ color: current.color }}>
          ✦ {current.label} ✦
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
              style={{
                background: tab === t.id ? `${t.color}22` : 'transparent',
                color: tab === t.id ? t.color : C.muted
              }}>
              <Icon size={13} />
              <span className="hidden xs:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'workouts' && <WorkoutSchedule state={state}
        updateDay={handlers.updateWorkoutDay}
        addExercise={handlers.addExercise}
        deleteExercise={handlers.deleteExercise}
        toggleExerciseDone={handlers.toggleExerciseDone} />}
      {tab === 'nutrition' && <NutritionTab state={state}
        addMeal={handlers.addMeal}
        deleteMeal={handlers.deleteMeal}
        updateTargets={handlers.updateNutritionTargets} />}
      {tab === 'water' && <WaterTab state={state}
        setWater={handlers.setWater}
        setTarget={handlers.setWaterTarget} />}
      {tab === 'weight' && <WeightTab state={state}
        addWeight={handlers.addWeight}
        deleteWeight={handlers.deleteWeight}
        setGoal={handlers.setWeightGoal} />}
      {tab === 'history' && (
        <div className="space-y-5">
          <HealthHistory state={state} />
          <RewardTracker state={state} claimReward={handlers.claimReward} />
        </div>
      )}
    </div>
  );
};

// =============================================================================
// INVESTMENTS
// =============================================================================
const InvestmentCard = ({ inv, definition, onUpdateCurrent, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [cur, setCur] = useState(inv.current);
  const gain = inv.current - inv.invested;
  const gainPct = inv.invested ? (gain / inv.invested) * 100 : 0;
  const isUp = gain >= 0;

  return (
    <div className="p-4 rounded-2xl"
      style={{ background: `linear-gradient(135deg, ${C.surface}, ${definition.color}08)`, border: `1px solid ${definition.color}33` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${definition.color}20` }}>{definition.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: C.text }}>{inv.name}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: definition.color }}>{definition.label}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setEditing(!editing)} className="p-1.5 rounded-lg" style={{ background: C.surface2 }}>
            <Edit2 size={12} style={{ color: C.muted }} />
          </button>
          <button onClick={() => onDelete(inv.id)} className="p-1.5 rounded-lg" style={{ background: C.surface2 }}>
            <Trash2 size={12} style={{ color: C.muted }} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: C.surface2 }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>invested</div>
          <div className="text-base font-bold tabular-nums" style={{ color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{fmtUSD(inv.invested)}</div>
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: C.surface2 }}>
          <div className="text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>current</div>
          <div className="text-base font-bold tabular-nums" style={{ color: definition.color, fontFamily: 'JetBrains Mono, monospace' }}>{fmtUSD(inv.current)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-xl"
        style={{ background: isUp ? `${C.emerald}15` : `${C.coral}15`, border: `1px solid ${(isUp ? C.emerald : C.coral)}44` }}>
        <div className="flex items-center gap-2">
          {isUp ? <ArrowUp size={14} style={{ color: C.emerald }} /> : <ArrowDown size={14} style={{ color: C.coral }} />}
          <span className="text-xs font-semibold" style={{ color: isUp ? C.emerald : C.coral }}>
            {isUp ? 'Gain' : 'Loss'}
          </span>
        </div>
        <div className="text-right">
          <div className="text-base font-bold tabular-nums" style={{ color: isUp ? C.emerald : C.coral, fontFamily: 'JetBrains Mono, monospace' }}>
            {isUp ? '+' : ''}{fmtUSD(gain)}
          </div>
          <div className="text-[10px] tabular-nums" style={{ color: isUp ? C.emerald : C.coral, fontFamily: 'JetBrains Mono, monospace' }}>
            {isUp ? '+' : ''}{gainPct.toFixed(2)}%
          </div>
        </div>
      </div>

      {editing && (
        <div className="mt-3 flex gap-2">
          <input type="number" value={cur} onChange={e => setCur(e.target.value)} placeholder="Current value"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          <button onClick={() => { onUpdateCurrent(inv.id, parseFloat(cur) || 0); setEditing(false); }}
            className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: definition.color, color: C.bg }}>update</button>
        </div>
      )}

      {inv.notes && (
        <div className="mt-3 text-[10px] px-3 py-2 rounded-lg" style={{ background: C.surface2, color: C.muted }}>
          📝 {inv.notes}
        </div>
      )}
    </div>
  );
};

const Investments = ({ state, addInvestment, updateInvestmentCurrent, deleteInvestment }) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('stocks');
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const [notes, setNotes] = useState('');

  const totalInvested = state.investments.reduce((s, i) => s + i.invested, 0);
  const totalCurrent = state.investments.reduce((s, i) => s + i.current, 0);
  const totalGain = totalCurrent - totalInvested;
  const totalGainPct = totalInvested ? (totalGain / totalInvested) * 100 : 0;
  const isUp = totalGain >= 0;

  // Distribution by type
  const byType = INVESTMENT_TYPES.map(t => ({
    name: t.label, color: t.color,
    value: state.investments.filter(i => i.type === t.key).reduce((s, i) => s + i.current, 0)
  })).filter(d => d.value > 0);

  const handleAdd = () => {
    if (name.trim() && parseFloat(invested) > 0) {
      addInvestment({
        name: name.trim(), type,
        invested: parseFloat(invested),
        current: parseFloat(current) || parseFloat(invested),
        notes: notes.trim()
      });
      setName(''); setInvested(''); setCurrent(''); setNotes(''); setAdding(false);
    }
  };

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      <div className="text-center py-2">
        <div className="text-xs uppercase tracking-[0.3em] font-semibold" style={{ color: C.violet }}>✦ Portfolio ✦</div>
        <div className="text-sm italic mt-1" style={{ color: C.text, fontFamily: 'Fraunces, serif' }}>your money working for you.</div>
      </div>

      {/* Summary */}
      <div className="p-5 rounded-3xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.surface}, ${C.violet}15)`, border: `1px solid ${C.violet}44` }}>
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${isUp ? C.emerald : C.coral}, transparent 70%)` }} />
        <div className="relative">
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: C.violet }}>portfolio value</div>
          <div className="text-4xl font-bold tabular-nums" style={{ color: C.violet, fontFamily: 'JetBrains Mono, monospace' }}>{fmtUSD(totalCurrent)}</div>
          <div className="text-xs tabular-nums mt-1" style={{ color: C.muted }}>invested {fmtUSD(totalInvested)}</div>
          {state.investments.length > 0 && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full"
              style={{ background: isUp ? `${C.emerald}22` : `${C.coral}22`, border: `1px solid ${(isUp ? C.emerald : C.coral)}66` }}>
              {isUp ? <ArrowUp size={14} style={{ color: C.emerald }} /> : <ArrowDown size={14} style={{ color: C.coral }} />}
              <span className="text-sm font-bold tabular-nums" style={{ color: isUp ? C.emerald : C.coral, fontFamily: 'JetBrains Mono, monospace' }}>
                {isUp ? '+' : ''}{fmtUSD(totalGain)} ({isUp ? '+' : ''}{totalGainPct.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Distribution donut */}
      {byType.length > 0 && (
        <div className="p-5 rounded-3xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: C.text }}>by asset type</div>
          <div className="flex items-center gap-4">
            <div style={{ width: 120, height: 120 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byType} dataKey="value" innerRadius={35} outerRadius={55} paddingAngle={3}>
                    {byType.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {byType.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span style={{ color: C.muted }}>{d.name}</span>
                  </div>
                  <span className="tabular-nums" style={{ color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{fmtUSD(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add investment */}
      {adding ? (
        <div className="p-4 rounded-2xl space-y-2" style={{ background: C.surface, border: `1px dashed ${C.violet}` }}>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus
            placeholder="Investment name (e.g. NVDA, S&P 500 ETF)"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
          <div className="flex gap-1 flex-wrap">
            {INVESTMENT_TYPES.map(t => (
              <button key={t.key} onClick={() => setType(t.key)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1"
                style={{
                  background: type === t.key ? t.color : C.surface2,
                  color: type === t.key ? C.bg : C.muted
                }}>
                <span>{t.emoji}</span>{t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={invested} onChange={e => setInvested(e.target.value)} placeholder="Invested ($)"
              className="px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
            <input type="number" value={current} onChange={e => setCurrent(e.target.value)} placeholder="Current ($)"
              className="px-3 py-2 rounded-lg text-sm outline-none tabular-nums"
              style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional, e.g. broker, strategy)"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }} />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-lg text-xs font-semibold"
              style={{ background: C.surface2, color: C.muted }}>cancel</button>
            <button onClick={handleAdd} className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: C.violet, color: C.bg }}>add</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: 'transparent', color: C.violet, border: `1px dashed ${C.violet}66` }}>
          <Plus size={16} /> Add investment
        </button>
      )}

      {state.investments.length === 0 && !adding && (
        <div className="text-center py-8">
          <TrendingUp size={40} style={{ color: C.muted, margin: '0 auto 12px' }} />
          <div className="text-sm" style={{ color: C.muted }}>no investments tracked yet</div>
        </div>
      )}

      {state.investments.map(inv => {
        const def = INVESTMENT_TYPES.find(t => t.key === inv.type) || INVESTMENT_TYPES[6];
        return (
          <InvestmentCard key={inv.id} inv={inv} definition={def}
            onUpdateCurrent={updateInvestmentCurrent} onDelete={deleteInvestment} />
        );
      })}
    </div>
  );
};

// =============================================================================
// MAIN APP
// =============================================================================
export default function App() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [active, setActive] = useState('dashboard');
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => { (async () => { const s = await loadState(); setState(s); setLoaded(true); })(); }, []);
  useEffect(() => { if (loaded) saveState(state); }, [state, loaded]);

  const showToast = useCallback((t) => { setToast(t); setTimeout(() => setToast(null), 3000); }, []);
  const triggerConfetti = useCallback(() => { setConfetti(true); setTimeout(() => setConfetti(false), 4000); }, []);

  const processGains = (ns, gainedXp) => {
    const oldLevel = calcLevel(ns.user.xp - gainedXp);
    const newLevel = calcLevel(ns.user.xp);
    if (newLevel > oldLevel) {
      ns.user.level = newLevel;
      triggerConfetti();
      showToast({ type: 'level', icon: '👑', title: `LEVEL UP — ${newLevel}!`, desc: 'New rank unlocked.' });
    }
    ACHIEVEMENTS.forEach(a => {
      if (!ns.user.achievements.includes(a.id) && a.req(ns)) {
        ns.user.achievements.push(a.id);
        setTimeout(() => showToast({ type: 'achievement', icon: a.icon, title: a.name, desc: a.desc }), 500);
      }
    });
    return ns;
  };

  const updateStreak = (ns) => {
    const today = todayStr();
    const last = ns.user.lastTaskDate;
    if (last !== today) {
      const diff = last ? daysBetween(last, today) : null;
      if (diff === 1) ns.user.streak += 1;
      else if (diff === null || diff > 1) ns.user.streak = 1;
      ns.user.lastTaskDate = today;
      ns.user.bestStreak = Math.max(ns.user.bestStreak, ns.user.streak);
    }
    return ns;
  };

  // TASKS
  const addTask = (type, text) => {
    setState(s => {
      const ns = { ...s };
      const newTask = { id: uid(), text, done: false };
      if (type === 'daily') newTask.dueDate = todayStr();
      else if (type === 'weekly') newTask.weekStart = weekKey();
      else if (type === 'monthly') newTask.monthKey = monthKey();
      ns.tasks = { ...s.tasks, [type]: [...s.tasks[type], newTask] };
      return ns;
    });
  };
  const toggleTask = (id) => {
    setState(s => {
      let ns = JSON.parse(JSON.stringify(s));
      ['daily', 'weekly', 'monthly'].forEach(type => {
        const idx = ns.tasks[type].findIndex(t => t.id === id);
        if (idx !== -1) {
          const wasDone = ns.tasks[type][idx].done;
          ns.tasks[type][idx].done = !wasDone;
          if (!wasDone) {
            const xp = XP_VALUES[type];
            ns.user.xp += xp;
            ns.user.totalTasks += 1;
            if (type === 'daily') {
              const todays = ns.tasks.daily.filter(t => t.dueDate === todayStr());
              if (todays.length > 0 && todays.every(t => t.done)) {
                ns.user.xp += 20;
                setTimeout(() => showToast({ type: 'xp', icon: '⚡', title: '+20 BONUS XP', desc: 'All daily tasks done!' }), 800);
              }
            }
            setTimeout(() => showToast({ type: 'xp', icon: '✨', title: `+${xp} XP`, desc: `${type} task done` }), 100);
            ns = updateStreak(ns);
            ns = processGains(ns, xp);
          } else {
            ns.user.xp = Math.max(0, ns.user.xp - XP_VALUES[type]);
            ns.user.totalTasks = Math.max(0, ns.user.totalTasks - 1);
            ns.user.level = calcLevel(ns.user.xp);
          }
        }
      });
      return ns;
    });
  };
  const deleteTask = (id) => {
    setState(s => {
      const ns = { ...s, tasks: { ...s.tasks } };
      ['daily', 'weekly', 'monthly'].forEach(type => {
        ns.tasks[type] = ns.tasks[type].filter(t => t.id !== id);
      });
      return ns;
    });
  };

  // BUDGET
  const addWeeklyExpense = (amount, note) => {
    setState(s => ({ ...s, budget: { ...s.budget, weekly: {
      ...s.budget.weekly,
      transactions: [...s.budget.weekly.transactions, { id: uid(), date: todayStr(), amount, note }]
    }}}));
  };
  const deleteWeeklyExpense = (id) => {
    setState(s => ({ ...s, budget: { ...s.budget, weekly: {
      ...s.budget.weekly,
      transactions: s.budget.weekly.transactions.filter(t => t.id !== id)
    }}}));
  };
  const setWeeklyBudget = (amt) => {
    setState(s => ({ ...s, budget: { ...s.budget, weekly: { ...s.budget.weekly, budget: amt }}}));
  };
  const addBudgetTxn = (catKey, amount, note) => {
    setState(s => {
      const ns = { ...s, budget: { ...s.budget } };
      const cat = { ...ns.budget[catKey] };
      const isLoan = catKey === 'educationLoan';
      const oldPct = isLoan ? loanState(cat).pct : (cat.target ? (cat.current / cat.target) * 100 : 0);
      cat.transactions = [...cat.transactions, { id: uid(), date: todayStr(), amount, note }];
      if (isLoan) cat.paid = (cat.paid || 0) + amount;
      else cat.current = (cat.current || 0) + amount;
      const newPct = isLoan ? loanState(cat).pct : (cat.target ? (cat.current / cat.target) * 100 : 0);
      ns.budget[catKey] = cat;
      [25, 50, 75, 100].forEach(m => {
        if (oldPct < m && newPct >= m) {
          triggerConfetti();
          const def = BUDGET_CATEGORIES.find(c => c.key === catKey);
          setTimeout(() => showToast({ type: 'achievement', icon: '🎯', title: `${m}% milestone!`, desc: def?.label }), 200);
        }
      });
      return ns;
    });
  };
  const deleteBudgetTxn = (catKey, txnId) => {
    setState(s => {
      const ns = { ...s, budget: { ...s.budget } };
      const cat = { ...ns.budget[catKey] };
      const txn = cat.transactions.find(t => t.id === txnId);
      if (txn) {
        cat.transactions = cat.transactions.filter(t => t.id !== txnId);
        if (catKey === 'educationLoan') cat.paid = Math.max(0, cat.paid - txn.amount);
        else cat.current = Math.max(0, cat.current - txn.amount);
      }
      ns.budget[catKey] = cat;
      return ns;
    });
  };
  const editBudgetTarget = (catKey, target) => {
    setState(s => {
      const ns = { ...s, budget: { ...s.budget } };
      const cat = { ...ns.budget[catKey] };
      if (catKey === 'educationLoan') cat.total = target; else cat.target = target;
      ns.budget[catKey] = cat;
      return ns;
    });
  };

  // GOALS
  const addGoal = (type, name, target, unit) => {
    setState(s => ({ ...s, goals: { ...s.goals,
      [type]: [...s.goals[type], { id: uid(), name, target, current: 0, unit, createdAt: todayStr() }]
    }}));
  };
  const updateGoal = (type, id, current) => {
    setState(s => {
      const goals = s.goals[type].map(g => {
        if (g.id === id) {
          const oldPct = g.target ? (g.current / g.target) * 100 : 0;
          const newPct = g.target ? (current / g.target) * 100 : 0;
          [25, 50, 75, 100].forEach(m => {
            if (oldPct < m && newPct >= m) {
              triggerConfetti();
              setTimeout(() => showToast({ type: 'achievement', icon: '🎯', title: `${m}% reached!`, desc: g.name }), 200);
            }
          });
          return { ...g, current };
        }
        return g;
      });
      return { ...s, goals: { ...s.goals, [type]: goals } };
    });
  };
  const incrementGoal = (type, id, delta) => {
    setState(s => {
      const goals = s.goals[type].map(g => {
        if (g.id === id) {
          const newCurrent = Math.max(0, g.current + delta);
          const oldPct = g.target ? (g.current / g.target) * 100 : 0;
          const newPct = g.target ? (newCurrent / g.target) * 100 : 0;
          [25, 50, 75, 100].forEach(m => {
            if (oldPct < m && newPct >= m) {
              triggerConfetti();
              setTimeout(() => showToast({ type: 'achievement', icon: '🎯', title: `${m}% reached!`, desc: g.name }), 200);
            }
          });
          return { ...g, current: newCurrent };
        }
        return g;
      });
      return { ...s, goals: { ...s.goals, [type]: goals } };
    });
  };
  const deleteGoal = (type, id) => {
    setState(s => ({ ...s, goals: { ...s.goals, [type]: s.goals[type].filter(g => g.id !== id) }}));
  };

  // HEALTH
  const updateWorkoutDay = (day, name) => {
    setState(s => ({ ...s, health: { ...s.health, workoutSchedule: {
      ...s.health.workoutSchedule,
      [day]: { ...s.health.workoutSchedule[day], name: name || s.health.workoutSchedule[day].name }
    }}}));
  };
  const addExercise = (day, name, setsReps, duration) => {
    setState(s => {
      const sched = { ...s.health.workoutSchedule };
      sched[day] = { ...sched[day], exercises: [...sched[day].exercises, { id: uid(), name, setsReps, duration }] };
      return { ...s, health: { ...s.health, workoutSchedule: sched }};
    });
  };
  const deleteExercise = (day, id) => {
    setState(s => {
      const sched = { ...s.health.workoutSchedule };
      sched[day] = { ...sched[day], exercises: sched[day].exercises.filter(e => e.id !== id) };
      return { ...s, health: { ...s.health, workoutSchedule: sched }};
    });
  };
  const toggleExerciseDone = (key) => {
    setState(s => {
      const done = { ...s.health.exerciseDone };
      if (done[key]) delete done[key]; else done[key] = true;
      return { ...s, health: { ...s.health, exerciseDone: done }};
    });
  };
  const addMeal = (meal) => {
    setState(s => ({ ...s, health: { ...s.health, nutrition: {
      ...s.health.nutrition,
      meals: [...s.health.nutrition.meals, { id: uid(), date: todayStr(), ...meal }]
    }}}));
  };
  const deleteMeal = (id) => {
    setState(s => ({ ...s, health: { ...s.health, nutrition: {
      ...s.health.nutrition,
      meals: s.health.nutrition.meals.filter(m => m.id !== id)
    }}}));
  };
  const updateNutritionTargets = (targets) => {
    setState(s => ({ ...s, health: { ...s.health, nutrition: { ...s.health.nutrition, targets }}}));
  };
  const setWater = (date, count) => {
    setState(s => ({ ...s, health: { ...s.health, water: { ...s.health.water, [date]: Math.max(0, count) }}}));
  };
  const setWaterTarget = (t) => {
    setState(s => ({ ...s, health: { ...s.health, waterTarget: Math.max(1, t) }}));
  };
  const addWeight = (value) => {
    setState(s => ({ ...s, health: { ...s.health,
      weight: [...s.health.weight, { id: uid(), date: todayStr(), value }]
    }}));
  };
  const deleteWeight = (id) => {
    setState(s => ({ ...s, health: { ...s.health, weight: s.health.weight.filter(w => w.id !== id) }}));
  };
  const setWeightGoal = (v) => {
    setState(s => ({ ...s, health: { ...s.health, weightGoal: v }}));
  };

  // INVESTMENTS
  const addInvestment = (inv) => {
    setState(s => ({ ...s, investments: [...s.investments, { id: uid(), date: todayStr(), ...inv }]}));
  };
  const updateInvestmentCurrent = (id, current) => {
    setState(s => ({ ...s, investments: s.investments.map(i => i.id === id ? { ...i, current } : i)}));
  };
  const deleteInvestment = (id) => {
    setState(s => ({ ...s, investments: s.investments.filter(i => i.id !== id)}));
  };

  // LOAN / REWARDS / THEME
  const editLoan = (fields) => {
    setState(s => ({ ...s, budget: { ...s.budget, educationLoan: { ...s.budget.educationLoan, ...fields } } }));
  };
  const claimReward = (claimKey) => {
    setState(s => {
      const claimed = s.rewards?.claimed || [];
      if (claimed.includes(claimKey)) return s;
      triggerConfetti();
      const r = REWARDS.find(x => claimKey.startsWith(x.id + '-'));
      setTimeout(() => showToast({ type: 'achievement', icon: r?.emoji || '🎉', title: 'Reward unlocked!', desc: r?.reward }), 150);
      return { ...s, rewards: { ...s.rewards, claimed: [...claimed, claimKey] } };
    });
  };
  const setTheme = (theme) => {
    setState(s => ({ ...s, ui: { ...s.ui, theme } }));
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="text-center">
          <Sparkles size={32} style={{ color: C.lime, margin: '0 auto 8px', animation: 'spin 1.5s linear infinite' }} />
          <div className="text-sm" style={{ color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>loading your life...</div>
        </div>
      </div>
    );
  }

  const theme = state.ui?.theme || 'space';
  const themeBg = (THEMES[theme] || THEMES.space).bg;

  return (
    <div className="min-h-screen relative" style={{ background: themeBg, color: C.text, fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <AnimatedBackground theme={theme} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400;1,700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes confettiFall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0.5; }
        }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes slideIn { 0% { transform: translateX(120%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        @keyframes bubble { 0%, 100% { transform: translateY(0); opacity: 0.15; } 50% { transform: translateY(-20px); opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes auroraShift { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,20px) scale(1.15); } }
        @keyframes shoot { 0% { transform: translateX(0) translateY(0); opacity: 0; } 10% { opacity: 1; } 60% { opacity: 1; } 100% { transform: translateX(130vw) translateY(40vh); opacity: 0; } }
        @keyframes rise { 0% { transform: translateY(0) translateX(0); opacity: 0; } 15% { opacity: 0.3; } 100% { transform: translateY(-110vh) translateX(20px); opacity: 0; } }
        @keyframes waveMove { 0% { transform: translateX(0) rotate(0deg); } 100% { transform: translateX(-12%) rotate(2deg); } }
        @keyframes petalFall { 0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; } 10% { opacity: 0.85; } 100% { transform: translateY(110vh) translateX(60px) rotate(360deg); opacity: 0; } }
        @keyframes floatDrift { 0%, 100% { transform: translateY(0) rotate(-6deg); opacity: 0.6; } 50% { transform: translateY(-22px) rotate(6deg); opacity: 0.85; } }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <Confetti active={confetti} />
      <Toast toast={toast} />

      <div className="max-w-2xl mx-auto pb-20 relative z-10">
        <Header state={state} theme={theme} setTheme={setTheme} />
        {active === 'dashboard' && <Dashboard state={state} toggleTask={toggleTask} />}
        {active === 'tasks' && <Tasks state={state} addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask} />}
        {active === 'budget' && <Budget state={state}
          addWeeklyExpense={addWeeklyExpense} deleteWeeklyExpense={deleteWeeklyExpense}
          setWeeklyBudget={setWeeklyBudget} addBudgetTxn={addBudgetTxn}
          deleteBudgetTxn={deleteBudgetTxn} editBudgetTarget={editBudgetTarget} editLoan={editLoan} />}
        {active === 'goals' && <Goals state={state}
          addGoal={addGoal} updateGoal={updateGoal} incrementGoal={incrementGoal} deleteGoal={deleteGoal} />}
        {active === 'health' && <Health state={state}
          updateWorkoutDay={updateWorkoutDay} addExercise={addExercise} deleteExercise={deleteExercise}
          toggleExerciseDone={toggleExerciseDone} addMeal={addMeal} deleteMeal={deleteMeal}
          updateNutritionTargets={updateNutritionTargets} setWater={setWater} setWaterTarget={setWaterTarget}
          addWeight={addWeight} deleteWeight={deleteWeight} setWeightGoal={setWeightGoal} claimReward={claimReward} />}
        {active === 'invest' && <Investments state={state}
          addInvestment={addInvestment} updateInvestmentCurrent={updateInvestmentCurrent}
          deleteInvestment={deleteInvestment} />}
      </div>

      <Nav active={active} setActive={setActive} />
    </div>
  );
}
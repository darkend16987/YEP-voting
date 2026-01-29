import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, activeAppId } from '../config/firebase';
import { VIDEOS, TOTAL_EXPECTED_USERS } from '../config/constants';
import logoPlaceholder from '../assets/logo-placeholder.png';
import {
  BarChart3,
  Users,
  TrendingUp,
  Crown,
  Medal,
  Award,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity
} from 'lucide-react';

// Animated number component
const AnimatedNumber = ({ value, duration = 800 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const start = previousValue.current;
    const end = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

// Rank change indicator
const RankIndicator = ({ previousRank, currentRank }) => {
  if (previousRank === currentRank || previousRank === 0) {
    return <Minus size={14} className="text-slate-600" />;
  }
  if (currentRank < previousRank) {
    return (
      <div className="flex items-center text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded text-xs font-bold animate-pulse">
        <ArrowUp size={12} className="mr-0.5" />
        <span>{previousRank - currentRank}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded text-xs font-bold">
      <ArrowDown size={12} className="mr-0.5" />
      <span>{currentRank - previousRank}</span>
    </div>
  );
};

// Individual score bar
const ScoreBar = ({ item, index, maxScore, previousRank }) => {
  const percentage = maxScore > 0 ? (item.score / (maxScore * 1.1)) * 100 : 0;
  const isLeader = index === 0;

  const getRankIcon = () => {
    if (index === 0) return <Crown size={28} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />;
    if (index === 1) return <Medal size={24} className="text-slate-300" />;
    if (index === 2) return <Award size={24} className="text-amber-600" />;
    return <span className="text-slate-500 font-display font-bold text-xl">#{index + 1}</span>;
  };

  return (
    <div
      className={`glass-card relative transition-all duration-700 ease-out p-4 group hover:bg-white/5 ${isLeader ? 'ring-1 ring-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : ''
        }`}
      style={{
        transform: `translateY(${index * 0}px)`,
        transitionDelay: `${index * 50}ms`
      }}
    >
      {/* Header with name and score */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-5">
          {/* Rank icon/number */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/20' :
              index === 1 ? 'bg-slate-400/10 border border-slate-400/20' :
                index === 2 ? 'bg-amber-600/10 border border-amber-600/20' :
                  'bg-slate-800/50 border border-slate-700'
            }`}>
            {getRankIcon()}
          </div>

          {/* Name and team */}
          <div>
            <h2 className={`text-2xl font-display font-bold leading-tight ${isLeader ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200' : 'text-white'
              }`}>
              {item.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 ${item.textColor}`}>
                {item.team}
              </span>
            </div>
          </div>
        </div>

        {/* Score and rank change */}
        <div className="text-right flex items-center gap-6">
          <RankIndicator previousRank={previousRank} currentRank={index + 1} />
          <div>
            <span className={`text-4xl font-display font-bold tracking-tight ${isLeader ? 'text-yellow-400' : 'text-white'
              }`}>
              <AnimatedNumber value={item.score} />
            </span>
            <span className="text-sm text-slate-500 ml-1 font-medium">pts</span>
          </div>
        </div>
      </div>

      {/* Progress bar container */}
      <div className="relative h-12 bg-slate-950/50 rounded-xl overflow-hidden shadow-inner ring-1 ring-white/5">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(90deg, transparent 95%, rgba(255,255,255,0.1) 95%)',
          backgroundSize: '10% 100%'
        }} />

        {/* Progress fill */}
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.gradientFrom} ${item.gradientTo} transition-all duration-1000 ease-out flex items-center justify-end rounded-r-xl group-hover:brightness-110`}
          style={{
            width: `${Math.max(percentage, 2)}%`,
            minWidth: '6px'
          }}
        >
          {/* Shimmer effect for leader */}
          {isLeader && (
            <div className="absolute inset-0 overflow-hidden rounded-r-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite] skew-x-12" />
            </div>
          )}

          {/* Glow at the tip */}
          <div className={`absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]`} />
        </div>

        {/* Leading Indicator inside bar if space permits, else outside or hidden */}
        {isLeader && item.score > 0 && percentage > 15 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
            <div className="relative">
              <div className="w-2 h-2 bg-white rounded-full animate-ping absolute top-0 left-0" />
              <div className="w-2 h-2 bg-white rounded-full relative" />
            </div>
            <span className="text-white text-xs font-bold tracking-wider shadow-black drop-shadow-md">LEADING</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Dashboard Component
const DashboardScreen = ({ onExit }) => {
  const [scores, setScores] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [previousRanks, setPreviousRanks] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const q = collection(db, 'artifacts', activeAppId, 'public_votes');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tempScores = {};
      VIDEOS.forEach(v => tempScores[v.id] = 0);
      let count = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.points) {
          count++;
          Object.entries(data.points).forEach(([vid, point]) => {
            if (tempScores[vid] !== undefined) tempScores[vid] += point;
          });
        }
      });

      // Calculate new rankings, ensuring stable sort for same scores (optional) but simplistic here
      const sorted = VIDEOS.map(v => ({
        ...v,
        score: tempScores[v.id]
      })).sort((a, b) => b.score - a.score);

      // Save previous ranks before updating
      const newPreviousRanks = {};
      scores.forEach((item, idx) => {
        newPreviousRanks[item.id] = idx + 1;
      });
      setPreviousRanks(newPreviousRanks);

      setScores(sorted);
      setTotalVotes(count);
      setLastUpdate(new Date());
    });

    return () => unsubscribe();
  }, []); // Only run once on mount, listener is persistent but we don't need 'scores' in dependency array because we use functional updates or separate logic. 'scores' for prev ranks needs care. 
  // Actually, for previousRanks, we need the *previous* scores state. 
  // The closure on useEffect means 'scores' is always [] inside the effect unless we use refs or dependencies.
  // Correct pattern for maintaining prev state inside effect: use a Ref or functional update doesn't help with side-effects *before* update.
  // We can track previous ranks via a ref inside the effect or outside.

  // FIX: Use a ref to track the last sorted order to derive previous ranks correctly without re-subscribing.
  const lastSortedRef = useRef([]);

  useEffect(() => {
    // Re-implementing logic with ref to avoid dependency loop or stale closures
    const q = collection(db, 'artifacts', activeAppId, 'public_votes');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tempScores = {};
      VIDEOS.forEach(v => tempScores[v.id] = 0);
      let count = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.points) {
          count++;
          Object.entries(data.points).forEach(([vid, point]) => {
            if (tempScores[vid] !== undefined) tempScores[vid] += point;
          });
        }
      });

      const sorted = VIDEOS.map(v => ({
        ...v,
        score: tempScores[v.id]
      })).sort((a, b) => b.score - a.score);

      // Calculate ranks from the REF (the state before this update)
      const newPreviousRanks = {};
      lastSortedRef.current.forEach((item, idx) => {
        newPreviousRanks[item.id] = idx + 1;
      });

      setPreviousRanks(newPreviousRanks);
      setScores(sorted);
      setTotalVotes(count);
      setLastUpdate(new Date());

      // Update ref
      lastSortedRef.current = sorted;
    });
    return () => unsubscribe();
  }, []);

  const maxScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 1;
  const votingProgress = (totalVotes / TOTAL_EXPECTED_USERS) * 100;

  return (
    <div className="min-h-screen bg-dark-bg text-white relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/20 rounded-full blur-[150px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-900/20 rounded-full blur-[150px] animate-blob animation-delay-4000" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <img src={logoPlaceholder} alt="Logo" className="h-10 object-contain brightness-0 invert opacity-80" />

              <div className="h-8 w-px bg-white/10 hidden md:block"></div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold flex items-center gap-2">
                    Live Results
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 tracking-wider">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      LIVE
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">
                    Last update: {lastUpdate?.toLocaleTimeString('vi-VN') || '--:--'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              {/* Vote count */}
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1.5 justify-end text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">
                  <Users size={12} />
                  Tổng phiếu
                </div>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl font-display font-bold text-emerald-400 drop-shadow-sm">
                    <AnimatedNumber value={totalVotes} />
                  </span>
                  <span className="text-slate-600 font-medium">/{TOTAL_EXPECTED_USERS}</span>
                </div>
              </div>

              {/* Progress ring */}
              <div className="relative w-14 h-14 hidden sm:block">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-white/5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${votingProgress * 1.5} 150`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">
                    {Math.round(votingProgress)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="space-y-4">
          {scores.map((item, index) => (
            <ScoreBar
              key={item.id}
              item={item}
              index={index}
              maxScore={maxScore}
              previousRank={previousRanks[item.id] || 0}
            />
          ))}
        </div>

        {/* Empty state */}
        {scores.length === 0 && (
          <div className="text-center py-32 glass-card rounded-3xl border-dashed border-white/10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity size={40} className="text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-300">Đang chờ dữ liệu...</h3>
            <p className="text-slate-500 mt-2">Hệ thống chưa ghi nhận phiếu bầu nào.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cơ chế tính điểm</h3>
              <p className="text-xs text-slate-400">Điểm số được cập nhật theo thời gian thực</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <span className="text-2xl drop-shadow-sm">🏆</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giải Nhất</span>
                <span className="text-yellow-400 font-bold font-display text-lg">+5 pts</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <span className="text-2xl drop-shadow-sm">🥈</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giải Nhì</span>
                <span className="text-slate-300 font-bold font-display text-lg">+3 pts</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <span className="text-2xl drop-shadow-sm">🥉</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giải Ba</span>
                <span className="text-amber-600 font-bold font-display text-lg">+2 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit button */}
      {onExit && (
        <button
          onClick={onExit}
          className="fixed top-24 right-6 lg:top-6 lg:right-6 bg-slate-900/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 backdrop-blur-md text-slate-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700/50 flex items-center gap-2 group z-50"
        >
          <LogOut size={12} className="group-hover:-translate-x-0.5 transition-transform" />
          EXIT <span className="hidden sm:inline">DASHBOARD</span>
        </button>
      )}
    </div>
  );
};

export default DashboardScreen;
function LogOut({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  )
}

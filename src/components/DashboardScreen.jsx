import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, activeAppId } from '../config/firebase';
import { VIDEOS, TOTAL_EXPECTED_USERS } from '../config/constants';
import {
  Trophy,
  BarChart3,
  Users,
  TrendingUp,
  Crown,
  Medal,
  Award,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// Animated number component
const AnimatedNumber = ({ value, duration = 500 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const start = previousValue.current;
    const end = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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
    return <Minus size={12} className="text-slate-500" />;
  }
  if (currentRank < previousRank) {
    return (
      <div className="flex items-center text-green-400">
        <ArrowUp size={14} />
        <span className="text-xs font-bold">{previousRank - currentRank}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center text-red-400">
      <ArrowDown size={14} />
      <span className="text-xs font-bold">{currentRank - previousRank}</span>
    </div>
  );
};

// Individual score bar
const ScoreBar = ({ item, index, maxScore, previousRank }) => {
  const percentage = maxScore > 0 ? (item.score / (maxScore * 1.1)) * 100 : 0;
  const isLeader = index === 0;

  const getRankIcon = () => {
    if (index === 0) return <Crown size={24} className="text-yellow-400" />;
    if (index === 1) return <Medal size={20} className="text-slate-300" />;
    if (index === 2) return <Award size={20} className="text-amber-600" />;
    return <span className="text-slate-500 font-bold text-lg">#{index + 1}</span>;
  };

  return (
    <div
      className={`relative transition-all duration-700 ease-out ${
        isLeader ? 'scale-[1.02]' : ''
      }`}
      style={{
        transform: `translateY(${index * 0}px)`,
        transitionDelay: `${index * 50}ms`
      }}
    >
      {/* Header with name and score */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4">
          {/* Rank icon/number */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            index === 0 ? 'bg-yellow-500/20' :
            index === 1 ? 'bg-slate-400/20' :
            index === 2 ? 'bg-amber-600/20' :
            'bg-slate-800'
          }`}>
            {getRankIcon()}
          </div>

          {/* Name and team */}
          <div>
            <h2 className={`text-xl font-bold ${
              isLeader ? 'text-yellow-400' : 'text-white'
            }`}>
              {item.name}
            </h2>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <Users size={12} />
              {item.team}
            </p>
          </div>
        </div>

        {/* Score and rank change */}
        <div className="text-right flex items-center gap-4">
          <RankIndicator previousRank={previousRank} currentRank={index + 1} />
          <div>
            <span className={`text-3xl font-bold font-mono ${
              isLeader ? 'text-yellow-400' : 'text-white'
            }`}>
              <AnimatedNumber value={item.score} />
            </span>
            <span className="text-sm text-slate-500 ml-1">pts</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-14 bg-slate-800/50 rounded-xl overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)'
          }} />
        </div>

        {/* Progress fill */}
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.gradientFrom} ${item.gradientTo} transition-all duration-1000 ease-out flex items-center justify-end rounded-xl`}
          style={{
            width: `${Math.max(percentage, 5)}%`,
            minWidth: '80px'
          }}
        >
          {/* Shimmer effect for leader */}
          {isLeader && (
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          )}

          {/* Live indicator for leader */}
          {isLeader && item.score > 0 && (
            <div className="absolute right-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white/80 text-sm font-medium">LEADING</span>
            </div>
          )}
        </div>

        {/* Glow effect */}
        <div
          className={`absolute inset-y-0 left-0 ${item.color} blur-xl opacity-30 transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
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
    const q = collection(db, 'artifacts', activeAppId, 'public', 'data', 'all_votes');

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

      // Calculate new rankings
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
  }, []);

  const maxScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 1;
  const votingProgress = (totalVotes / TOTAL_EXPECTED_USERS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Live Results
                  <span className="flex items-center gap-1 text-sm font-normal text-red-400">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                </h1>
                <p className="text-sm text-slate-400">
                  Cập nhật realtime • {lastUpdate?.toLocaleTimeString('vi-VN') || '--:--'}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              {/* Vote count */}
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                  <Users size={14} />
                  Số phiếu
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-mono text-green-400">
                    <AnimatedNumber value={totalVotes} />
                  </span>
                  <span className="text-slate-500">/{TOTAL_EXPECTED_USERS}</span>
                </div>
              </div>

              {/* Progress ring */}
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-slate-800"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${votingProgress * 1.76} 176`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {Math.round(votingProgress)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-6">
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
          <div className="text-center py-20">
            <TrendingUp size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">Chưa có phiếu bầu nào</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="max-w-5xl mx-auto px-6 pb-8">
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
            <Zap size={14} />
            Quy đổi điểm
          </h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span className="text-slate-300">Giải Nhất</span>
              <span className="text-yellow-400 font-bold">+5 điểm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🥈</span>
              <span className="text-slate-300">Giải Nhì</span>
              <span className="text-slate-400 font-bold">+3 điểm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🥉</span>
              <span className="text-slate-300">Giải Ba</span>
              <span className="text-amber-600 font-bold">+2 điểm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exit button */}
      {onExit && (
        <button
          onClick={onExit}
          className="fixed top-4 right-4 bg-slate-800/80 backdrop-blur-sm text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors border border-slate-700"
        >
          Thoát
        </button>
      )}

      {/* Custom styles for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default DashboardScreen;

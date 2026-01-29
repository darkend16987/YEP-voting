import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, deleteDoc, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { db, activeAppId, auth } from '../config/firebase';
import { VIDEOS, TOTAL_EXPECTED_USERS, ADMIN_EMAIL, SECURITY_CODE } from '../config/constants';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  RotateCcw,
  Lock,
  AlertTriangle,
  X,
  Check,
  Sparkles,
  PartyPopper,
  Trophy,
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
      const eased = 1 - Math.pow(1 - progress, 3);
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
      <motion.div
        className="flex items-center text-green-400"
        initial={{ scale: 1.5, y: -10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
      >
        <ArrowUp size={14} />
        <span className="text-xs font-bold">{previousRank - currentRank}</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      className="flex items-center text-red-400"
      initial={{ scale: 1.5, y: 10 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      <ArrowDown size={14} />
      <span className="text-xs font-bold">{currentRank - previousRank}</span>
    </motion.div>
  );
};

// Individual score bar with framer-motion
const ScoreBar = ({ item, index, maxScore, previousRank }) => {
  const percentage = maxScore > 0 ? (item.score / (maxScore * 1.1)) * 100 : 0;
  const isLeader = index === 0;

  const getRankIcon = () => {
    if (index === 0) return <Crown size={28} className="text-yellow-400" />;
    if (index === 1) return <Medal size={22} className="text-slate-300" />;
    if (index === 2) return <Award size={22} className="text-amber-600" />;
    return <span className="text-slate-500 font-bold text-lg">#{index + 1}</span>;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        y: { duration: 0.3 }
      }}
      className={`relative ${isLeader ? 'z-10' : ''}`}
    >
      {/* Leader highlight glow */}
      {isLeader && (
        <motion.div
          className="absolute -inset-2 bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-500/20 rounded-2xl blur-xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className={`relative bg-slate-900/50 rounded-2xl border transition-all duration-500 ${
        isLeader
          ? 'border-yellow-500/30 p-6 scale-[1.02]'
          : 'border-slate-800 p-4'
      }`}>
        {/* Header with name and score */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            {/* Rank icon/number */}
            <motion.div
              className={`flex items-center justify-center rounded-xl ${
                index === 0 ? 'w-14 h-14 bg-gradient-to-br from-yellow-500/30 to-amber-500/20' :
                index === 1 ? 'w-12 h-12 bg-slate-400/20' :
                index === 2 ? 'w-12 h-12 bg-amber-600/20' :
                'w-10 h-10 bg-slate-800'
              }`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {getRankIcon()}
            </motion.div>

            {/* Name and team */}
            <div>
              <h2 className={`font-bold ${
                isLeader ? 'text-2xl text-yellow-400' : 'text-xl text-white'
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
              <motion.span
                className={`font-bold font-mono ${
                  isLeader ? 'text-4xl text-yellow-400' : 'text-3xl text-white'
                }`}
                key={item.score}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <AnimatedNumber value={item.score} />
              </motion.span>
              <span className="text-sm text-slate-500 ml-1">pts</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`relative bg-slate-800/50 rounded-xl overflow-hidden ${
          isLeader ? 'h-16' : 'h-12'
        }`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)'
            }} />
          </div>

          {/* Progress fill with smooth animation */}
          <motion.div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.gradientFrom} ${item.gradientTo} flex items-center justify-end rounded-xl`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(percentage, 5)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ minWidth: '80px' }}
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
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-white/80 text-sm font-bold tracking-wider">LEADING</span>
              </div>
            )}
          </motion.div>

          {/* Glow effect */}
          <motion.div
            className={`absolute inset-y-0 left-0 ${item.color} blur-xl opacity-30`}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Security Dialog Component
const SecurityDialog = ({ isOpen, onClose, onConfirm, title, description, isLoading }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const currentUserEmail = auth.currentUser?.email;
  const isAdmin = currentUserEmail === ADMIN_EMAIL;

  const handleConfirm = () => {
    if (isAdmin) {
      onConfirm();
      return;
    }

    if (code === SECURITY_CODE) {
      onConfirm();
    } else {
      setError('Mã bảo mật không đúng!');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <AlertTriangle size={24} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </div>

        {isAdmin ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-green-400">
              <Check size={18} />
              <span className="font-medium">Đã xác thực Admin</span>
            </div>
            <p className="text-sm text-green-400/70 mt-1">
              Email: {currentUserEmail}
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="text-sm text-slate-400 mb-2 block">
              Nhập mã bảo mật để tiếp tục:
            </label>
            <input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Nhập mã..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check size={18} />
                Xác nhận
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Final Results Podium Component
const FinalResultsView = ({ scores, totalVotes }) => {
  const hasTriggeredConfetti = useRef(false);

  useEffect(() => {
    if (!hasTriggeredConfetti.current && scores.length > 0) {
      hasTriggeredConfetti.current = true;
      // Trigger confetti celebration
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#4169E1', '#32CD32']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#4169E1', '#32CD32']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [scores]);

  if (scores.length === 0) return null;

  const winner = scores[0];
  const secondPlace = scores[1];
  const thirdPlace = scores[2];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-12 px-6"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <PartyPopper size={32} className="text-yellow-400" />
          <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            KẾT QUẢ CHUNG CUỘC
          </h1>
          <PartyPopper size={32} className="text-yellow-400 transform scale-x-[-1]" />
        </div>
        <p className="text-slate-400">
          INNO YEP CLIP CONTEST 2025 - Tổng số phiếu: {totalVotes}
        </p>
      </motion.div>

      {/* Winner - First Place */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/30 via-amber-500/20 to-yellow-500/30 rounded-3xl blur-2xl" />

          <div className="relative bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-2 border-yellow-500/50 rounded-3xl p-8 text-center">
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Crown size={80} className="text-yellow-400 mx-auto mb-4" />
            </motion.div>
            <div className="text-6xl mb-2">🏆</div>
            <div className="text-sm text-yellow-400/70 uppercase tracking-widest mb-2">Vô địch</div>
            <h2 className="text-4xl font-black text-yellow-400 mb-2">{winner.name}</h2>
            <p className="text-lg text-slate-400 mb-4">{winner.team}</p>
            <div className="inline-flex items-center gap-2 bg-yellow-500/20 px-6 py-3 rounded-full">
              <Sparkles size={20} className="text-yellow-400" />
              <span className="text-3xl font-bold text-yellow-400">{winner.score}</span>
              <span className="text-yellow-400/70">điểm</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Second and Third Place */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 mb-8">
        {/* Second Place */}
        {secondPlace && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-2 bg-slate-400/10 rounded-2xl blur-xl" />
            <div className="relative bg-slate-800/50 border border-slate-400/30 rounded-2xl p-6 text-center">
              <Medal size={48} className="text-slate-300 mx-auto mb-3" />
              <div className="text-4xl mb-2">🥈</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Á quân</div>
              <h3 className="text-2xl font-bold text-white mb-1">{secondPlace.name}</h3>
              <p className="text-sm text-slate-500 mb-3">{secondPlace.team}</p>
              <div className="inline-flex items-center gap-2 bg-slate-700/50 px-4 py-2 rounded-full">
                <span className="text-2xl font-bold text-slate-300">{secondPlace.score}</span>
                <span className="text-slate-500">điểm</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Third Place */}
        {thirdPlace && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1 }}
            className="relative"
          >
            <div className="absolute -inset-2 bg-amber-600/10 rounded-2xl blur-xl" />
            <div className="relative bg-slate-800/50 border border-amber-600/30 rounded-2xl p-6 text-center">
              <Award size={48} className="text-amber-600 mx-auto mb-3" />
              <div className="text-4xl mb-2">🥉</div>
              <div className="text-xs text-amber-600/70 uppercase tracking-widest mb-2">Hạng Ba</div>
              <h3 className="text-2xl font-bold text-white mb-1">{thirdPlace.name}</h3>
              <p className="text-sm text-slate-500 mb-3">{thirdPlace.team}</p>
              <div className="inline-flex items-center gap-2 bg-amber-600/20 px-4 py-2 rounded-full">
                <span className="text-2xl font-bold text-amber-500">{thirdPlace.score}</span>
                <span className="text-amber-600/70">điểm</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Other participants */}
      {scores.length > 3 && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="max-w-2xl mx-auto"
        >
          <h3 className="text-center text-slate-500 text-sm uppercase tracking-widest mb-4">
            Các đội tham gia
          </h3>
          <div className="space-y-3">
            {scores.slice(3).map((item, idx) => (
              <div
                key={item.id}
                className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-bold">#{idx + 4}</span>
                  <div>
                    <h4 className="font-medium text-white">{item.name}</h4>
                    <p className="text-xs text-slate-500">{item.team}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-slate-400">{item.score} pts</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Main Dashboard Component
const DashboardScreen = ({ onExit }) => {
  const [scores, setScores] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [previousRanks, setPreviousRanks] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isVotingLocked, setIsVotingLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref to track previous scores for rank change detection
  const lastSortedRef = useRef([]);

  // Admin dialogs
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showEndVoteDialog, setShowEndVoteDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Listen to voting status
  useEffect(() => {
    const statusRef = doc(db, 'artifacts', activeAppId, 'config', 'voting_status');
    const unsubscribe = onSnapshot(statusRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setIsVotingLocked(docSnap.data().isLocked || false);
        }
      },
      (err) => {
        console.error('Error listening to voting status:', err);
        // Don't show error for config as it may not exist yet
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen to votes
  useEffect(() => {
    const q = collection(db, 'artifacts', activeAppId, 'public_votes');
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
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

        const newPreviousRanks = {};
        lastSortedRef.current.forEach((item, idx) => {
          newPreviousRanks[item.id] = idx + 1;
        });

        setPreviousRanks(newPreviousRanks);
        setScores(sorted);
        setTotalVotes(count);
        setLastUpdate(new Date());
        setIsLoading(false);
        setError(null);

        lastSortedRef.current = sorted;
      },
      (err) => {
        console.error('Error listening to votes:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle Reset All Votes
  const handleResetVotes = async () => {
    setIsProcessing(true);
    try {
      // Delete all user_votes
      const userVotesRef = collection(db, 'artifacts', activeAppId, 'user_votes');
      const userVotesSnapshot = await getDocs(userVotesRef);
      const deleteUserVotes = userVotesSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // Delete all public_votes
      const publicVotesRef = collection(db, 'artifacts', activeAppId, 'public_votes');
      const publicVotesSnapshot = await getDocs(publicVotesRef);
      const deletePublicVotes = publicVotesSnapshot.docs.map(doc => deleteDoc(doc.ref));

      // Reset voting status
      const statusRef = doc(db, 'artifacts', activeAppId, 'config', 'voting_status');
      await setDoc(statusRef, { isLocked: false });

      await Promise.all([...deleteUserVotes, ...deletePublicVotes]);

      setShowResetDialog(false);
      alert('Đã reset tất cả phiếu bầu thành công!');
    } catch (error) {
      console.error('Error resetting votes:', error);
      alert('Lỗi khi reset: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle End Voting
  const handleEndVoting = async () => {
    setIsProcessing(true);
    try {
      const statusRef = doc(db, 'artifacts', activeAppId, 'config', 'voting_status');
      await setDoc(statusRef, {
        isLocked: true,
        lockedAt: new Date().toISOString(),
        finalScores: scores.map(s => ({ id: s.id, name: s.name, team: s.team, score: s.score }))
      });
      setShowEndVoteDialog(false);
    } catch (error) {
      console.error('Error ending vote:', error);
      alert('Lỗi: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const maxScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 1;
  const votingProgress = (totalVotes / TOTAL_EXPECTED_USERS) * 100;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 max-w-md text-center">
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-400 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Show Final Results if voting is locked
  if (isVotingLocked) {
    return (
      <>
        <FinalResultsView scores={scores} totalVotes={totalVotes} />

        {/* Admin controls for locked state */}
        <div className="fixed bottom-6 right-6 flex gap-3">
          <button
            onClick={() => setShowResetDialog(true)}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-500/30 transition-colors"
          >
            <RotateCcw size={16} />
            Reset Vote
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm transition-colors border border-slate-700"
            >
              Thoát
            </button>
          )}
        </div>

        <AnimatePresence>
          {showResetDialog && (
            <SecurityDialog
              isOpen={showResetDialog}
              onClose={() => setShowResetDialog(false)}
              onConfirm={handleResetVotes}
              title="Reset tất cả Vote"
              description="Xóa toàn bộ phiếu bầu và mở lại voting"
              isLoading={isProcessing}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

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
                  Cập nhật realtime - {lastUpdate?.toLocaleTimeString('vi-VN') || '--:--'}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                  <Users size={14} />
                  Số phiếu
                </div>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl font-display font-bold text-emerald-400 drop-shadow-sm">
                    <AnimatedNumber value={totalVotes} />
                  </span>
                  <span className="text-slate-600 font-medium">/{TOTAL_EXPECTED_USERS}</span>
                </div>
              </div>

              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-800" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${votingProgress * 1.76} 176`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{Math.round(votingProgress)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence>
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
        </AnimatePresence>

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
              <Trophy size={20} className="text-yellow-400" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giải Nhất</span>
                <span className="text-yellow-400 font-bold font-display text-lg">+5 pts</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <Medal size={20} className="text-slate-300" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giải Nhì</span>
                <span className="text-slate-300 font-bold font-display text-lg">+3 pts</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <Medal size={20} className="text-amber-600" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giải Ba</span>
                <span className="text-amber-600 font-bold font-display text-lg">+2 pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="fixed bottom-6 right-6 flex gap-3">
        <button
          onClick={() => setShowResetDialog(true)}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-500/30 transition-colors"
        >
          <RotateCcw size={16} />
          Reset Vote
        </button>
        <button
          onClick={() => setShowEndVoteDialog(true)}
          className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 border border-amber-500/30 transition-colors"
        >
          <Lock size={16} />
          End Vote
        </button>
        {onExit && (
          <button
            onClick={onExit}
            className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm transition-colors border border-slate-700"
          >
            Thoát
          </button>
        )}
      </div>

      {/* Security Dialogs */}
      <AnimatePresence>
        {showResetDialog && (
          <SecurityDialog
            isOpen={showResetDialog}
            onClose={() => setShowResetDialog(false)}
            onConfirm={handleResetVotes}
            title="Reset tất cả Vote"
            description="Hành động này sẽ xóa toàn bộ phiếu bầu. Không thể hoàn tác!"
            isLoading={isProcessing}
          />
        )}
        {showEndVoteDialog && (
          <SecurityDialog
            isOpen={showEndVoteDialog}
            onClose={() => setShowEndVoteDialog(false)}
            onConfirm={handleEndVoting}
            title="Kết thúc Vote"
            description="Khóa voting và hiển thị kết quả chung cuộc"
            isLoading={isProcessing}
          />
        )}
      </AnimatePresence>

      {/* Custom styles */}
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

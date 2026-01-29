import React, { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, activeAppId } from '../config/firebase';
import { VIDEOS, AWARDS, ADMIN_EMAIL } from '../config/constants';
import logoPlaceholder from '../assets/logo-placeholder.png';
import {
  LogOut,
  CheckCircle,
  AlertCircle,
  Users,
  ChevronRight,
  ArrowLeft,
  Send,
  Award,
  Loader2,
  Lock,
  Trophy,
  Medal,
  Play
} from 'lucide-react';

// Award Icon Component
const AwardIcon = ({ id, size = 24 }) => {
  if (id === 'first') return <Trophy size={size} className="text-yellow-400" />;
  if (id === 'second') return <Medal size={size} className="text-slate-300" />;
  if (id === 'third') return <Award size={size} className="text-amber-600" />;
  return <div className="w-1 h-1 bg-slate-600 rounded-full" />;
};

// Card hiển thị khi voting đã bị khóa
const VotingLockedCard = ({ user, onAdminClick }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 flex flex-col items-center justify-center">
    <div className="w-full max-w-md">
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 p-8 rounded-3xl text-center backdrop-blur-sm">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
          <Lock size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-amber-400 mb-2">
          Bình chọn đã kết thúc!
        </h2>
        <p className="text-slate-400 mb-6">
          Cuộc bình chọn đã được đóng lại. Cảm ơn bạn đã quan tâm!
        </p>

        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
            <Trophy size={20} />
            <span className="font-medium">Kết quả chung cuộc</span>
          </div>
          <p className="text-sm text-slate-500">
            Vui lòng truy cập trang Dashboard để xem kết quả
          </p>
        </div>

        {user.email === ADMIN_EMAIL && onAdminClick && (
          <button
            onClick={onAdminClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mb-4 transition-colors flex items-center justify-center gap-2"
          >
            Vào Dashboard
          </button>
        )}

        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-500 mb-1">Đăng nhập với</p>
          <p className="text-slate-300 font-medium">{user.email}</p>
        </div>

        <button
          onClick={() => signOut(auth)}
          className="text-slate-400 hover:text-white underline underline-offset-4 transition-colors flex items-center gap-2 mx-auto"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </div>
  </div>
);

// Card hiển thị thông tin đã vote xong
const VotedSuccessCard = ({ user, onAdminClick }) => (
  <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
    {/* Background elements */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-[100px]" />
    </div>

    <div className="w-full max-w-md relative z-10 animate-fade-in">
      <div className="glass-card p-10 text-center border-emerald-500/20 shadow-emerald-500/10">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/30 animate-blob">
          <CheckCircle size={48} className="text-white drop-shadow-md" />
        </div>
        <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-emerald-200 via-white to-emerald-200 bg-clip-text text-transparent mb-4">
          Cảm ơn bạn!
        </h2>
        <p className="text-slate-300 mb-8 font-light text-lg">
          Phiếu bình chọn của bạn đã được ghi nhận.
        </p>

        {user.email === ADMIN_EMAIL && onAdminClick && (
          <button
            onClick={onAdminClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mb-8 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
          >
            Vào Dashboard
          </button>
        )}

        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Đăng nhập với</p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-xs font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <p className="text-white font-medium">{user.email}</p>
          </div>
        </div>

        <p className="text-slate-400 mb-8 leading-relaxed">
          Kết quả cuối cùng sẽ được công bố tại <br />
          <span className="text-primary-400 font-semibold">Year End Party 2025</span>
        </p>

        <button
          onClick={onAdminClick}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl mb-8 border border-white/10 transition-all flex items-center justify-center gap-2"
        >
          <Trophy size={20} className="text-yellow-400" />
          Xem kết quả Dashboard
        </button>

        <button
          onClick={() => signOut(auth)}
          className="group text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto py-2 px-4 rounded-lg hover:bg-white/5"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Đăng xuất</span>
        </button>
      </div>
      <div className="mt-8 opacity-50 flex justify-center">
        <img src={logoPlaceholder} alt="Logo" className="h-8 object-contain grayscale opacity-50" />
      </div>
    </div>
  </div>
);

// Card xác nhận vote
const ConfirmationScreen = ({ selections, onBack, onSubmit, submitting }) => (
  <div className="min-h-screen bg-dark-bg p-4 flex flex-col items-center justify-center relative">
    <div className="w-full max-w-lg relative z-10 animate-fade-in">
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
              <AlertCircle className="text-amber-400" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-50">Xác nhận phiếu bầu</h2>
              <p className="text-sm text-slate-400">Vui lòng kiểm tra kỹ trước khi gửi</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {VIDEOS.map(video => {
            const awardId = selections[video.id];
            const award = AWARDS.find(a => a.id === awardId);
            const isAwarded = awardId && awardId !== 'none';

            return (
              <div
                key={video.id}
                className={`flex justify-between items-center p-4 rounded-xl border transition-all ${isAwarded
                  ? 'bg-white/10 border-white/10'
                  : 'bg-white/5 border-transparent opacity-60'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-1 h-12 rounded-full bg-gradient-to-b ${video.gradientFrom} ${video.gradientTo}`} />
                  <div>
                    <p className="font-bold text-slate-200">{video.name}</p>
                    <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{video.team}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 ${awardId === 'first' ? 'text-yellow-400' :
                  awardId === 'second' ? 'text-slate-300' :
                    awardId === 'third' ? 'text-amber-600' :
                      'text-slate-600'
                  }`}>
                  <AwardIcon id={awardId} size={24} />
                  <span className="font-bold text-sm">{award?.label || '-'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning */}
        <div className="px-6 pb-2">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-red-300 text-sm font-bold flex items-center justify-center gap-2">
              <AlertCircle size={16} /> Lưu ý quan trọng
            </p>
            <p className="text-red-400/70 text-xs mt-1">
              Bạn chỉ được bình chọn một lần duy nhất. Không thể thay đổi sau khi gửi.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-4">
          <button
            onClick={onBack}
            disabled={submitting}
            className="flex-1 py-4 rounded-xl btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={20} />
                Gửi ngay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Video Card Component
const VideoCard = ({ video, selectedAward, onSelectAward, validation }) => {
  const getAwardButton = (award) => {
    const isSelected = selectedAward === award.id;
    const isLimitReached = validation.counts[award.id] >= award.limit;
    const isDisabled = !isSelected && isLimitReached;
    const remaining = award.limit - validation.counts[award.id];

    return (
      <button
        key={award.id}
        onClick={() => onSelectAward(video.id, isSelected ? 'none' : award.id)}
        disabled={isDisabled}
        className={`
          relative p-4 rounded-xl text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-1 group
          ${isSelected
            ? `${award.selectedBg} border-transparent text-white shadow-lg scale-[1.02] ring-2 ring-white/20`
            : isDisabled
              ? 'bg-slate-900/40 border-slate-800 text-slate-700 cursor-not-allowed opacity-50'
              : `bg-slate-800/80 ${award.borderColor || 'border-slate-700/50'} text-slate-400 hover:bg-slate-700 hover:text-white hover:border-white/20 hover:scale-[1.02]`
          }
        `}
      >
        <div className="group-hover:scale-110 transition-transform duration-200">
          <AwardIcon id={award.id} size={28} />
        </div>
        <span className="text-[10px] uppercase tracking-wider">{award.shortLabel}</span>

        {!isDisabled && !isSelected && remaining <= award.limit && (
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={`glass-card relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10 group ${selectedAward !== 'none' ? 'border-primary-500/30' : ''
      }`}>
      {/* Background Gradient Accent */}
      <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${video.gradientFrom} ${video.gradientTo}`} />
      <div className={`absolute inset-0 bg-gradient-to-r ${video.gradientFrom} ${video.gradientTo} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

      <div className="p-6 pl-8">
        {/* Video info */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest py-1 px-2 rounded-md bg-white/5 border border-white/5 ${video.textColor}`}>
                {video.team}
              </span>
              {selectedAward && selectedAward !== 'none' && (
                <div className="animate-fade-in px-2 py-1 rounded-md bg-white/10 border border-white/10 backdrop-blur-md flex items-center gap-1">
                  <CheckCircle size={10} className="text-green-400" />
                  <span className="text-[10px] font-bold text-white">Đã chọn</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-display font-bold text-white leading-tight">{video.name}</h3>
          </div>

          <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors ${video.textColor}`}>
            <Play size={24} fill="currentColor" className="opacity-80" />
          </div>
        </div>

        {/* Award buttons */}
        <div className="grid grid-cols-3 gap-3">
          {AWARDS.filter(a => a.id !== 'none').map(award => getAwardButton(award))}
        </div>
      </div>
    </div>
  );
};

// Main VotingScreen Component
const VotingScreen = ({ user, existingVote, onAdminClick }) => {
  const [selections, setSelections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [isVotingLocked, setIsVotingLocked] = useState(false);

  // Listen to voting status
  useEffect(() => {
    const statusRef = doc(db, 'artifacts', activeAppId, 'config', 'voting_status');
    const unsubscribe = onSnapshot(statusRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsVotingLocked(docSnap.data().isLocked || false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const initial = {};
    VIDEOS.forEach(v => initial[v.id] = 'none');
    setSelections(initial);
  }, []);

  const handleSelect = (videoId, awardId) => {
    setSelections(prev => ({ ...prev, [videoId]: awardId }));
  };

  const validation = useMemo(() => {
    const counts = { first: 0, second: 0, third: 0, none: 0 };
    let isComplete = true;

    Object.values(selections).forEach(awardId => {
      if (counts[awardId] !== undefined) counts[awardId]++;
      if (awardId === 'none') isComplete = false;
    });

    const errors = [];
    AWARDS.forEach(award => {
      if (award.id !== 'none' && counts[award.id] > award.limit) {
        errors.push(`Chỉ được chọn tối đa ${award.limit} ${award.label}.`);
      }
    });

    return { isValid: errors.length === 0, errors, isComplete, counts };
  }, [selections]);

  const handleSubmit = async () => {
    if (!validation.isValid || !validation.isComplete) return;
    setSubmitting(true);

    try {
      const pointsMap = {};
      Object.entries(selections).forEach(([vid, awardId]) => {
        const award = AWARDS.find(a => a.id === awardId);
        if (award && award.point > 0) pointsMap[vid] = award.point;
      });

      const voteRef = doc(db, 'artifacts', activeAppId, 'user_votes', user.uid);
      const voteData = {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        selections: selections,
        points: pointsMap,
        timestamp: serverTimestamp()
      };

      await setDoc(voteRef, voteData);

      // Also sync to public_votes for dashboard
      const publicVoteRef = doc(db, 'artifacts', activeAppId, 'public_votes', user.uid);
      await setDoc(publicVoteRef, voteData);

    } catch (error) {
      console.error("Error submitting vote:", error);
      alert("Lỗi khi gửi đánh giá. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  // Check if voting is locked
  if (isVotingLocked) {
    return <VotingLockedCard user={user} onAdminClick={onAdminClick} />;
  }

  if (existingVote) {
    return <VotedSuccessCard user={user} onAdminClick={onAdminClick} />;
  }

  if (confirmStep) {
    return (
      <ConfirmationScreen
        selections={selections}
        onBack={() => setConfirmStep(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    );
  }

  const awardedCount = Object.values(selections).filter(s => s !== 'none').length;
  const progress = (awardedCount / VIDEOS.length) * 100;

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-32">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logoPlaceholder} alt="Logo" className="h-8 object-contain opacity-90" />
            <div className="h-6 w-px bg-white/10"></div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none text-white">Bình Chọn</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">YEAR END PARTY 2025</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.email === ADMIN_EMAIL && (
              <button
                onClick={onAdminClick}
                className="p-2 hover:bg-blue-500/10 rounded-xl transition-colors text-blue-400 hover:text-blue-300 font-bold text-xs border border-blue-500/20"
              >
                Dashboard
              </button>
            )}
            <button
              onClick={() => signOut(auth)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-900 w-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(14,165,233,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Rules banner */}
      <div className="relative z-10 bg-primary-500/10 border-b border-primary-500/20 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 text-center">
          <p className="text-xs md:text-sm text-primary-200 font-medium">
            <span className="font-bold text-white uppercase tracking-wider mr-2">Luật chơi:</span>
            Tối đa 1 giải Nhất • 2 giải Nhì • 3 giải Ba
          </p>
        </div>
      </div>

      {/* Video cards */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-5">
        {VIDEOS.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            selectedAward={selections[video.id]}
            onSelectAward={handleSelect}
            validation={validation}
          />
        ))}

        {/* Footer info */}
        <div className="pt-8 pb-4 text-center opacity-40 hover:opacity-100 transition-opacity duration-300">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-2">Powered by</p>
          <img src={logoPlaceholder} alt="Company Logo" className="h-6 w-auto mx-auto grayscale hover:grayscale-0 transition-all" />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />

        <div className="relative bg-slate-950/80 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <div className="flex-1">
              {validation.errors.length > 0 ? (
                <div className="flex items-center gap-2 text-red-400 animate-pulse">
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold">{validation.errors[0]}</span>
                </div>
              ) : !validation.isComplete ? (
                <div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">Tiến độ</div>
                  <div className="text-sm font-bold text-white">
                    <span className="text-primary-400 text-lg">{awardedCount}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span>{VIDEOS.length}</span> <span className="text-slate-500 font-normal">Video</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="bg-emerald-400/20 p-1.5 rounded-full">
                    <CheckCircle size={16} />
                  </div>
                  <span className="text-sm font-bold">Đã hoàn tất</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setConfirmStep(true)}
              disabled={!validation.isValid || !validation.isComplete}
              className={`
                px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg
                ${(!validation.isValid || !validation.isComplete)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-1 active:translate-y-0'
                }
                `}
            >
              Gửi kết quả
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingScreen;

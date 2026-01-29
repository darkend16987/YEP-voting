import React, { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, activeAppId } from '../config/firebase';
import { VIDEOS, AWARDS } from '../config/constants';
import {
  LogOut,
  CheckCircle,
  AlertCircle,
  Users,
  ChevronRight,
  ArrowLeft,
  Send,
  Award,
  Loader2
} from 'lucide-react';

// Card hiển thị thông tin đã vote xong
const VotedSuccessCard = ({ user }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 flex flex-col items-center justify-center">
    <div className="w-full max-w-md">
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 p-8 rounded-3xl text-center backdrop-blur-sm">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
          <CheckCircle size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-green-400 mb-2">
          Cảm ơn bạn đã bình chọn!
        </h2>
        <p className="text-slate-400 mb-6">
          Phiếu của bạn đã được ghi nhận thành công.
        </p>

        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-500 mb-1">Đăng nhập với</p>
          <p className="text-slate-300 font-medium">{user.email}</p>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Kết quả cuối cùng sẽ được công bố tại sự kiện Year End Party
        </p>

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

// Card xác nhận vote
const ConfirmationScreen = ({ selections, onBack, onSubmit, submitting }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 flex flex-col items-center justify-center">
    <div className="w-full max-w-lg">
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-b border-amber-500/20 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <AlertCircle className="text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-400">Xác nhận phiếu bầu</h2>
              <p className="text-sm text-slate-400">Vui lòng kiểm tra lại trước khi gửi</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {VIDEOS.map(video => {
            const awardId = selections[video.id];
            const award = AWARDS.find(a => a.id === awardId);
            const isAwarded = awardId && awardId !== 'none';

            return (
              <div
                key={video.id}
                className={`flex justify-between items-center p-4 rounded-xl border transition-all ${
                  isAwarded
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-10 rounded-full ${video.color}`} />
                  <div>
                    <p className="font-medium">{video.name}</p>
                    <p className="text-xs text-slate-500">{video.team}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${
                  awardId === 'first' ? 'text-yellow-400' :
                  awardId === 'second' ? 'text-slate-300' :
                  awardId === 'third' ? 'text-amber-600' :
                  'text-slate-500'
                }`}>
                  <span className="text-lg">{award?.emoji}</span>
                  <span className="font-bold text-sm">{award?.label || 'Không chọn'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning */}
        <div className="px-6 pb-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-red-300 text-sm font-medium">
              Lưu ý: Bạn chỉ được bình chọn một lần duy nhất
            </p>
            <p className="text-red-400/60 text-xs mt-1">
              Không thể thay đổi sau khi gửi
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={onBack}
            disabled={submitting}
            className="flex-1 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-white shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={18} />
                Gửi kết quả
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
          relative p-3 rounded-xl text-sm font-bold border-2 transition-all duration-200
          ${isSelected
            ? `${award.selectedBg} border-transparent text-white shadow-lg scale-[1.02]`
            : isDisabled
              ? 'bg-slate-800/50 border-slate-800 text-slate-600 cursor-not-allowed'
              : `bg-slate-800 ${award.borderColor || 'border-slate-700'} ${award.textColor} hover:bg-slate-750 hover:scale-[1.01]`
          }
        `}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-base">{award.emoji}</span>
          <span>{award.shortLabel}</span>
        </div>
        {!isDisabled && !isSelected && remaining <= award.limit && (
          <span className="absolute -top-2 -right-2 bg-slate-700 text-xs px-1.5 py-0.5 rounded-full text-slate-400">
            {remaining}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className={`bg-slate-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border ${video.borderColor} shadow-lg transition-all hover:shadow-xl`}>
      {/* Color bar */}
      <div className={`h-1.5 bg-gradient-to-r ${video.gradientFrom} ${video.gradientTo}`} />

      <div className="p-5">
        {/* Video info */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{video.name}</h3>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <Users size={14} className={video.textColor} />
              {video.team}
            </p>
          </div>
          {selectedAward && selectedAward !== 'none' && (
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              selectedAward === 'first' ? 'bg-yellow-500/20 text-yellow-400' :
              selectedAward === 'second' ? 'bg-slate-400/20 text-slate-300' :
              'bg-amber-600/20 text-amber-500'
            }`}>
              {AWARDS.find(a => a.id === selectedAward)?.label}
            </div>
          )}
        </div>

        {/* Award buttons */}
        <div className="grid grid-cols-3 gap-2">
          {AWARDS.filter(a => a.id !== 'none').map(award => getAwardButton(award))}
        </div>
      </div>
    </div>
  );
};

// Main VotingScreen Component
const VotingScreen = ({ user, existingVote }) => {
  const [selections, setSelections] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

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

      const voteRef = doc(db, 'artifacts', activeAppId, 'users', user.uid, 'vote_entry');
      await setDoc(voteRef, {
        email: user.email,
        name: user.displayName,
        selections: selections,
        points: pointsMap,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error submitting vote:", error);
      alert("Lỗi khi gửi đánh giá. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  if (existingVote) {
    return <VotedSuccessCard user={user} />;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Award size={20} className="text-yellow-500" />
              Phiếu Bình Chọn
            </h1>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors"
            title="Đăng xuất"
          >
            <LogOut size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Rules banner */}
      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-b border-blue-500/20">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <p className="text-sm text-blue-200">
            <span className="font-bold">Quy định:</span> Chấm điểm cho tất cả video.
            <span className="text-blue-300/80 ml-1">
              Tối đa 1 Nhất • 2 Nhì • 3 Ba
            </span>
          </p>
        </div>
      </div>

      {/* Video cards */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {VIDEOS.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            selectedAward={selections[video.id]}
            onSelectAward={handleSelect}
            validation={validation}
          />
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 safe-area-bottom z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="flex-1">
            {validation.errors.length > 0 ? (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">{validation.errors[0]}</span>
              </div>
            ) : !validation.isComplete ? (
              <div className="text-sm text-slate-400">
                <span className="text-yellow-500 font-bold">{awardedCount}/{VIDEOS.length}</span> tác phẩm đã chấm
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Sẵn sàng gửi</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setConfirmStep(true)}
            disabled={!validation.isValid || !validation.isComplete}
            className={`
              px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all
              ${(!validation.isValid || !validation.isComplete)
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            Hoàn tất
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingScreen;

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Trophy, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  BarChart3, 
  Award,
  Users
} from 'lucide-react';

// --- CẤU HÌNH ---

// 1. Cấu hình Firebase
// QUAN TRỌNG: Thay thế object bên dưới bằng config từ Firebase Console của bạn
const firebaseConfig = {
  apiKey: "AIzaSyBsoHZ8p1oaremHgE_LuEif290yUWL-gdE",
  authDomain: "inno-yep-clip-voting.firebaseapp.com",
  projectId: "inno-yep-clip-voting",
  storageBucket: "inno-yep-clip-voting.firebasestorage.app",
  messagingSenderId: "651686405796",
  appId: "1:651686405796:web:2a22ca28f6e80440862831",
  measurementId: "G-VZ9CS75FMS"
};

// Global variables provided by the environment for the demo context (ignore in local)
const activeFirebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfig;
const activeAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app';

// 2. Danh sách User được phép (Allowlist)
// Set false để áp dụng danh sách email bên dưới
const ALLOW_ALL_DOMAINS = false; 
const ALLOWED_EMAILS = [
  "admin@company.com",
  "ceo@company.com",
  // Copy paste danh sách 250 email vào đây
];

// 3. Danh sách tác phẩm dự thi
const VIDEOS = [
  { id: 'v1', name: 'Hành Trình Vươn Xa', team: 'Team Marketing', color: 'bg-blue-500' },
  { id: 'v2', name: 'Chuyện Công Sở', team: 'Team Sale & Admin', color: 'bg-green-500' },
  { id: 'v3', name: 'The Future Is Now', team: 'Team Tech & Product', color: 'bg-purple-500' },
  { id: 'v4', name: 'Người Dẫn Đường', team: 'Team BOD', color: 'bg-orange-500' },
];

// 4. Cơ cấu giải thưởng và Giới hạn
const AWARDS = [
  { id: 'none', label: '--- Chọn giải ---', point: 0, limit: 999 },
  { id: 'first', label: '🏆 Giải Nhất (5đ)', point: 5, limit: 1 }, // Tối đa 1 giải nhất
  { id: 'second', label: '🥈 Giải Nhì (3đ)', point: 3, limit: 2 }, // Tối đa 2 giải nhì
  { id: 'third', label: '🥉 Giải Ba (2đ)', point: 2, limit: 3 },   // Tối đa 3 giải ba
];

// --- KHỞI TẠO FIREBASE ---
const app = initializeApp(activeFirebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- COMPONENTS ---

const LoginScreen = ({ error }) => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center">
        <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20">
          <Trophy size={40} className="text-slate-900" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Year End Voting</h1>
        <p className="text-slate-400 mb-8">Hệ thống bình chọn Video Cuối Năm</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button 
          onClick={handleLogin}
          className="w-full bg-white text-slate-900 font-bold py-3 px-6 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="G" />
          Đăng nhập bằng Google
        </button>
        <p className="mt-4 text-xs text-slate-500">Chỉ dành cho email nội bộ công ty</p>
      </div>
    </div>
  );
};

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
    if (counts.first > AWARDS.find(a => a.id === 'first').limit) 
        errors.push(`Chỉ được chọn tối đa ${AWARDS.find(a => a.id === 'first').limit} Giải Nhất.`);
    if (counts.second > AWARDS.find(a => a.id === 'second').limit) 
        errors.push(`Chỉ được chọn tối đa ${AWARDS.find(a => a.id === 'second').limit} Giải Nhì.`);
    if (counts.third > AWARDS.find(a => a.id === 'third').limit) 
        errors.push(`Chỉ được chọn tối đa ${AWARDS.find(a => a.id === 'third').limit} Giải Ba.`);

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

      // Lưu vote
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
    } finally {
      setSubmitting(false);
    }
  };

  if (existingVote) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-green-500/10 border border-green-500/50 p-8 rounded-2xl text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-400 mb-2">Đã chấm điểm thành công!</h2>
          <p className="text-slate-300 mb-6">Cảm ơn bạn đã tham gia bình chọn.</p>
          <div className="text-sm text-slate-500">{user.email}</div>
          <button onClick={() => signOut(auth)} className="mt-6 text-slate-400 hover:text-white underline">
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  if (confirmStep) {
    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-lg bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertCircle className="text-yellow-500" /> Xác nhận phiếu bầu
                </h2>
                <div className="space-y-3 mb-8">
                    {VIDEOS.map(video => {
                        const awardId = selections[video.id];
                        const award = AWARDS.find(a => a.id === awardId);
                        return (
                            <div key={video.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <span className="font-medium">{video.name}</span>
                                <span className={`text-sm font-bold ${
                                    awardId === 'first' ? 'text-yellow-400' : 
                                    awardId === 'second' ? 'text-gray-300' : 'text-amber-600'
                                }`}>{award?.label || '---'}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setConfirmStep(false)} className="flex-1 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium">Quay lại</button>
                    <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg">
                        {submitting ? 'Đang gửi...' : 'GỬI KẾT QUẢ'}
                    </button>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center shadow-md">
        <div>
           <h1 className="font-bold text-lg">Phiếu Bình Chọn</h1>
           <p className="text-xs text-slate-400">{user.email}</p>
        </div>
        <button onClick={() => signOut(auth)} className="p-2 hover:bg-slate-800 rounded-full">
            <LogOut size={20} className="text-slate-400" />
        </button>
      </div>

      <div className="p-4 bg-blue-900/20 border-b border-blue-900/50">
        <p className="text-sm text-blue-200">
            <span className="font-bold">Quy định:</span> Chấm điểm cho tất cả video. Tối đa 1 giải Nhất, 2 giải Nhì, 3 giải Ba.
        </p>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {VIDEOS.map((video) => (
            <div key={video.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-lg">
                <div className={`h-2 ${video.color}`}></div>
                <div className="p-5">
                    <h3 className="text-xl font-bold mb-1">{video.name}</h3>
                    <p className="text-slate-400 text-sm mb-4 flex items-center gap-2">
                        <Users size={14} /> {video.team}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {AWARDS.filter(a => a.id !== 'none').map((award) => {
                            const isSelected = selections[video.id] === award.id;
                            const isLimitReached = validation.counts[award.id] >= award.limit;
                            const isDisabled = !isSelected && isLimitReached;
                            
                            return (
                                <button
                                    key={award.id}
                                    onClick={() => handleSelect(video.id, isSelected ? 'none' : award.id)}
                                    disabled={isDisabled}
                                    className={`
                                        relative p-3 rounded-lg text-sm font-bold border transition-all
                                        ${isSelected 
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30' 
                                            : isDisabled 
                                                ? 'bg-slate-800 border-slate-800 text-slate-600 cursor-not-allowed opacity-50' 
                                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                                        }
                                    `}
                                >
                                    {award.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 pb-6 safe-area-bottom z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
            <div className="flex-1 text-xs">
                {validation.errors.length > 0 ? (
                    <span className="text-red-400 font-medium block animate-pulse">{validation.errors[0]}</span>
                ) : !validation.isComplete ? (
                    <span className="text-yellow-500 font-medium block">Vui lòng chấm điểm hết {VIDEOS.length} tác phẩm</span>
                ) : (
                     <span className="text-green-500 font-medium flex items-center gap-1">
                        <CheckCircle size={12}/> Hợp lệ
                    </span>
                )}
            </div>
            <button 
                onClick={() => setConfirmStep(true)}
                disabled={!validation.isValid || !validation.isComplete}
                className={`
                    px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                    ${(!validation.isValid || !validation.isComplete) 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 shadow-blue-600/30'}
                `}
            >
                Hoàn tất
            </button>
        </div>
      </div>
    </div>
  );
};

const DashboardScreen = () => {
    const [scores, setScores] = useState([]);
    const [totalVotes, setTotalVotes] = useState(0);

    useEffect(() => {
        // Query từ public/data/all_votes (bản copy public)
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
            const sorted = VIDEOS.map(v => ({...v, score: tempScores[v.id]})).sort((a, b) => b.score - a.score);
            setScores(sorted);
            setTotalVotes(count);
        });
        return () => unsubscribe();
    }, []);

    const maxScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 1;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col">
             <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart3 className="text-blue-500" /> LIVE RESULTS</h1>
                <div className="text-right">
                    <div className="text-sm text-slate-400">Total Votes</div>
                    <div className="text-2xl font-mono font-bold text-green-400">{totalVotes}/250</div>
                </div>
            </div>
            <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full space-y-8">
                {scores.map((item, index) => (
                    <div key={item.id} className="relative">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-3">
                                {index === 0 && <Trophy className="text-yellow-400 w-6 h-6" />}
                                <h2 className={`text-xl font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>{item.name}</h2>
                            </div>
                            <span className="text-2xl font-bold font-mono">{item.score} <span className="text-sm font-normal text-slate-500">pts</span></span>
                        </div>
                        <div className="h-12 bg-slate-800 rounded-full overflow-hidden relative">
                            <div 
                                className={`h-full ${item.color} transition-all duration-1000 ease-out flex items-center justify-end px-4 relative`}
                                style={{ width: `${(item.score / (maxScore * 1.2)) * 100}%`, minWidth: '60px' }}
                            >
                                {index === 0 && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (!ALLOW_ALL_DOMAINS && !ALLOWED_EMAILS.includes(currentUser.email)) {
            setAuthError("Email này không có quyền truy cập hệ thống.");
            await signOut(auth);
            setAuthChecking(false);
            return;
        }

        const voteDocRef = doc(db, 'artifacts', activeAppId, 'users', currentUser.uid, 'vote_entry');
        const unsubVote = onSnapshot(voteDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setHasVoted(true);
                // Copy data sang collection public để Dashboard đọc
                const publicVoteRef = doc(db, 'artifacts', activeAppId, 'public', 'data', 'all_votes', currentUser.uid);
                setDoc(publicVoteRef, docSnap.data());
            } else {
                setHasVoted(false);
            }
        });
        setUser(currentUser);
        setAuthError('');
      } else {
        setUser(null);
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleAdmin = () => setIsAdminMode(!isAdminMode);

  if (authChecking) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  if (isAdminMode) return (
    <>
      <DashboardScreen />
      <button onClick={toggleAdmin} className="fixed top-4 right-4 bg-slate-800 text-slate-500 p-2 text-xs rounded opacity-50 hover:opacity-100">Exit Admin</button>
    </>
  );

  if (!user) return (
    <>
        <LoginScreen error={authError} />
        <div className="fixed bottom-2 right-2">
            <button onClick={toggleAdmin} className="text-slate-700 text-xs p-2">Admin View</button>
        </div>
    </>
  );

  return <VotingScreen user={user} existingVote={hasVoted} />;
}
import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db, activeAppId } from './config/firebase';
import { validateEmail } from './services/emailService';
import LoginScreen from './components/LoginScreen';
import VotingScreen from './components/VotingScreen';
import DashboardScreen from './components/DashboardScreen';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// Loading Screen Component với message tùy chỉnh
const LoadingScreen = ({ message = 'Đang tải...' }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
    <div className="text-center">
      <Loader2 size={40} className="text-blue-500 animate-spin mx-auto mb-4" />
      <p className="text-slate-400">{message}</p>
    </div>
  </div>
);

// Error Screen Component
const ErrorScreen = ({ message, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 max-w-md text-center">
      <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-red-400 mb-2">Có lỗi xảy ra</h2>
      <p className="text-slate-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={16} />
          Thử lại
        </button>
      )}
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [voteChecking, setVoteChecking] = useState(false);
  const [authError, setAuthError] = useState('');
  const [hasVoted, setHasVoted] = useState(null); // null = chưa check, true/false = đã check
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Retry handler
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    let unsubVote = null;
    let voteCheckTimeout = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('[Auth] State changed:', currentUser?.email || 'No user');

      if (currentUser) {
        try {
          // Validate email
          console.log('[Auth] Validating email:', currentUser.email);
          setVoteChecking(true);

          const validation = await validateEmail(currentUser.email);
          console.log('[Auth] Validation result:', validation);

          if (!validation.allowed) {
            console.log('[Auth] Email not allowed, signing out');
            setAuthError("Email này không có quyền truy cập hệ thống. Vui lòng liên hệ Admin.");
            await signOut(auth);
            setAuthChecking(false);
            setVoteChecking(false);
            return;
          }

          // Đầu tiên, check vote status bằng getDoc để có giá trị ngay lập tức
          const voteDocRef = doc(db, 'artifacts', activeAppId, 'user_votes', currentUser.uid);
          try {
            const voteDocSnap = await getDoc(voteDocRef);
            const initialHasVoted = voteDocSnap.exists();
            console.log('[Auth] Initial vote check:', initialHasVoted);
            setHasVoted(initialHasVoted);
          } catch (voteCheckError) {
            console.error('[Auth] Error checking initial vote:', voteCheckError);
            // Không fail hoàn toàn, vẫn cho phép tiếp tục với hasVoted = false
            setHasVoted(false);
          }

          // Subscribe để theo dõi realtime updates
          console.log('[Auth] Email allowed, subscribing to vote status');
          unsubVote = onSnapshot(voteDocRef, (docSnap) => {
            console.log('[Auth] Vote status update:', docSnap.exists());
            setHasVoted(docSnap.exists());
          }, (error) => {
            console.error('[Auth] Vote snapshot error:', error);
            // Không crash app, giữ giá trị hasVoted hiện tại
          });

          setUser(currentUser);
          setAuthError('');
          setAuthChecking(false);
          setVoteChecking(false);
          console.log('[Auth] User set successfully');
        } catch (error) {
          console.error('[Auth] Error during validation:', error);
          setAuthError(`Lỗi xác thực: ${error.message}`);
          await signOut(auth);
          setAuthChecking(false);
          setVoteChecking(false);
        }
      } else {
        setUser(null);
        setHasVoted(null);
        setAuthChecking(false);
        setVoteChecking(false);
        if (unsubVote) {
          unsubVote();
          unsubVote = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubVote) {
        unsubVote();
      }
      if (voteCheckTimeout) {
        clearTimeout(voteCheckTimeout);
      }
    };
  }, []);

  const toggleAdmin = () => setIsAdminMode(!isAdminMode);

  // Loading state - đang kiểm tra authentication
  if (authChecking) {
    return <LoadingScreen message="Đang kiểm tra đăng nhập..." />;
  }

  // Dashboard mode (if switched or admin)
  if (isAdminMode) {
    return <DashboardScreen onExit={toggleAdmin} />;
  }

  // Login screen - user chưa đăng nhập
  if (!user) {
    return <LoginScreen error={authError} onAdminClick={toggleAdmin} />;
  }

  // Loading state - đang kiểm tra vote status
  if (voteChecking || hasVoted === null) {
    return <LoadingScreen message="Đang kiểm tra trạng thái bình chọn..." />;
  }

  // Voting screen - user đã đăng nhập
  // hasVoted sẽ là true hoặc false tại thời điểm này
  return <VotingScreen user={user} existingVote={hasVoted} onAdminClick={toggleAdmin} />;
}

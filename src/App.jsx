import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, activeAppId } from './config/firebase';
import { validateEmail } from './services/emailService';
import LoginScreen from './components/LoginScreen';
import VotingScreen from './components/VotingScreen';
import DashboardScreen from './components/DashboardScreen';
import { Loader2 } from 'lucide-react';

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
    <div className="text-center">
      <Loader2 size={40} className="text-blue-500 animate-spin mx-auto mb-4" />
      <p className="text-slate-400">Đang tải...</p>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    let unsubVote = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('[Auth] State changed:', currentUser?.email || 'No user');

      if (currentUser) {
        try {
          // Validate email
          console.log('[Auth] Validating email:', currentUser.email);
          const validation = await validateEmail(currentUser.email);
          console.log('[Auth] Validation result:', validation);

          if (!validation.allowed) {
            console.log('[Auth] Email not allowed, signing out');
            setAuthError("Email này không có quyền truy cập hệ thống.");
            await signOut(auth);
            setAuthChecking(false);
            return;
          }

          // Subscribe to user's vote status
          console.log('[Auth] Email allowed, subscribing to vote status');
          const voteDocRef = doc(db, 'artifacts', activeAppId, 'users', currentUser.uid, 'vote_entry');
          unsubVote = onSnapshot(voteDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setHasVoted(true);
              // Copy data to public collection for Dashboard
              const publicVoteRef = doc(db, 'artifacts', activeAppId, 'public', 'data', 'all_votes', currentUser.uid);
              setDoc(publicVoteRef, docSnap.data());
            } else {
              setHasVoted(false);
            }
          }, (error) => {
            console.error('[Auth] Vote snapshot error:', error);
          });

          setUser(currentUser);
          setAuthError('');
          setAuthChecking(false);
          console.log('[Auth] User set successfully');
        } catch (error) {
          console.error('[Auth] Error during validation:', error);
          setAuthError(`Lỗi xác thực: ${error.message}`);
          await signOut(auth);
          setAuthChecking(false);
        }
      } else {
        setUser(null);
        setHasVoted(false);
        setAuthChecking(false);
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
    };
  }, []);

  const toggleAdmin = () => setIsAdminMode(!isAdminMode);

  // Loading state
  if (authChecking) {
    return <LoadingScreen />;
  }

  // Admin/Dashboard mode
  if (isAdminMode) {
    return <DashboardScreen onExit={toggleAdmin} />;
  }

  // Login screen
  if (!user) {
    return <LoginScreen error={authError} onAdminClick={toggleAdmin} />;
  }

  // Voting screen
  return <VotingScreen user={user} existingVote={hasVoted} />;
}

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Validate email
        const validation = await validateEmail(currentUser.email);

        if (!validation.allowed) {
          setAuthError("Email này không có quyền truy cập hệ thống.");
          await signOut(auth);
          setAuthChecking(false);
          return;
        }

        // Subscribe to user's vote status
        const voteDocRef = doc(db, 'artifacts', activeAppId, 'users', currentUser.uid, 'vote_entry');
        const unsubVote = onSnapshot(voteDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setHasVoted(true);
            // Copy data to public collection for Dashboard
            const publicVoteRef = doc(db, 'artifacts', activeAppId, 'public', 'data', 'all_votes', currentUser.uid);
            setDoc(publicVoteRef, docSnap.data());
          } else {
            setHasVoted(false);
          }
        });

        setUser(currentUser);
        setAuthError('');

        // Cleanup vote subscription when user changes
        return () => unsubVote();
      } else {
        setUser(null);
        setHasVoted(false);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
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

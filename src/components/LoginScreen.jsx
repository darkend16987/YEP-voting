import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import logoPlaceholder from '../assets/logo-placeholder.png';
import {
  AlertCircle,
  Sparkles,
  Video,
  Users,
  Star,
  Clapperboard,
  LogIn
} from 'lucide-react';

const LoginScreen = ({ error, onAdminClick }) => {
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setLoginError('');
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
      // Hiển thị lỗi cho người dùng
      if (err.code === 'auth/popup-closed-by-user') {
        setLoginError('Bạn đã đóng cửa sổ đăng nhập. Vui lòng thử lại.');
      } else if (err.code === 'auth/popup-blocked') {
        setLoginError('Popup bị chặn. Vui lòng cho phép popup trong trình duyệt.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Người dùng click nhiều lần, không cần hiển thị lỗi
      } else if (err.code === 'auth/network-request-failed') {
        setLoginError('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setLoginError('Domain chưa được cấu hình trong Firebase. Vui lòng liên hệ Admin để thêm domain vào Authentication → Settings → Authorized domains.');
      } else {
        setLoginError(`Đăng nhập thất bại: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Kết hợp cả lỗi từ props và lỗi nội bộ
  const displayError = error || loginError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 flex flex-col items-center justify-center p-4 text-slate-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-200/50 rounded-full blur-[100px] animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/50 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-100/40 rounded-full blur-[120px]" />
      </div>

      {/* Main card */}
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo Placeholder */}
        <div className="flex justify-center mb-8">
          <img
            src={logoPlaceholder}
            alt="Company Logo"
            className="h-16 object-contain drop-shadow-md"
          />
        </div>

        <div className="glass-card p-8 text-center relative overflow-hidden group">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Contest Icon */}
          <div className="relative mx-auto mb-8 mt-2">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-primary-500/20 transform transition-all duration-300 hover:scale-105 hover:rotate-3">
              <Clapperboard size={48} className="text-white drop-shadow-md" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-display font-bold mb-2 bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600 bg-clip-text text-transparent drop-shadow-sm">
            YEP CLIP CONTEST
          </h1>
          <div className="inline-block px-4 py-1 rounded-full bg-primary-50 border border-primary-100 mb-6">
            <p className="text-lg font-bold tracking-[0.2em] text-primary-600">2025</p>
          </div>

          <p className="text-slate-500 mb-8 font-medium">Bình chọn Video Clip xuất sắc nhất</p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/50 rounded-xl p-3 border border-sky-100 shadow-sm">
              <Video size={20} className="text-primary-500 mx-auto mb-2" />
              <span className="text-xs text-slate-600 block font-semibold">3 Videos</span>
            </div>
            <div className="bg-white/50 rounded-xl p-3 border border-sky-100 shadow-sm">
              <Users size={20} className="text-indigo-500 mx-auto mb-2" />
              <span className="text-xs text-slate-600 block font-semibold">280+ Voters</span>
            </div>
            <div className="bg-white/50 rounded-xl p-3 border border-sky-100 shadow-sm">
              <Star size={20} className="text-amber-500 mx-auto mb-2" />
              <span className="text-xs text-slate-600 block font-semibold">Live Race</span>
            </div>
          </div>

          {/* Error message */}
          {displayError && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-start gap-3 text-left animate-fade-in">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-bold text-red-700">Đăng nhập không thành công</p>
                <p className="text-red-600/90 text-xs mt-1 leading-relaxed">{displayError}</p>
              </div>
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-slate-900 text-white font-bold py-4 px-6 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:shadow-slate-500/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none mb-4 group/btn"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                <span>Đang kết nối...</span>
              </>
            ) : (
              <>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  className="w-5 h-5 transition-transform group-hover/btn:scale-110"
                  alt="Google"
                />
                <span>Đăng nhập qua Google</span>
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 font-medium">
            Chỉ dành cho email nội bộ công ty
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={onAdminClick}
            className="text-slate-400 hover:text-primary-600 text-xs transition-colors flex items-center justify-center gap-2 mx-auto font-medium"
          >
            <LogIn size={12} />
            <span>Admin Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

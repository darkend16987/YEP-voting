import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import {
  Film,
  AlertCircle,
  Sparkles,
  Video,
  Users,
  Star,
  Clapperboard
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-700/50 text-center">
          {/* Company Logo */}
          <div className="mb-4">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Powered by</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              INNOTECH
            </div>
          </div>

          {/* Contest Icon */}
          <div className="relative mx-auto mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-purple-500/30 transform rotate-3 hover:rotate-0 transition-transform">
              <Clapperboard size={40} className="text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            INNO YEP CLIP CONTEST
          </h1>
          <p className="text-3xl font-black text-white mb-2">2025</p>
          <p className="text-slate-400 mb-2">Bình chọn Video Clip xuất sắc nhất</p>

          {/* Features */}
          <div className="flex justify-center gap-6 my-6 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Video size={14} className="text-blue-400" />
              <span>4 Videos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-green-400" />
              <span>250 Voters</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-yellow-400" />
              <span>Live Race</span>
            </div>
          </div>

          {/* Error message */}
          {displayError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-medium">Không thể đăng nhập</p>
                <p className="text-red-400/80 text-xs mt-1">{displayError}</p>
              </div>
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-white text-slate-900 font-bold py-4 px-6 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  className="w-6 h-6"
                  alt="Google"
                />
                <span>Đăng nhập bằng Google</span>
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-slate-500">
            Chỉ dành cho email nội bộ công ty
          </p>
        </div>

        {/* Admin link */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onAdminClick}
            className="text-slate-600 hover:text-slate-400 text-xs py-2 px-4 rounded-lg transition-colors"
          >
            Xem bảng xếp hạng Live
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

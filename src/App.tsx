import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RPGLayout } from './components/layout/RPGLayout';
import { Dashboard } from './pages/Dashboard';
import { Quests } from './pages/Quests';
import { Workouts } from './pages/Workouts';
import { Nutrition } from './pages/Nutrition';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { Onboarding } from './pages/Onboarding';
import { Settings } from './pages/Settings';
import { QuickMenu } from './pages/QuickMenu';
import { Bosses } from './pages/Bosses';
import { TrophyRoom } from './pages/TrophyRoom';
import { Fortuna } from './pages/Fortuna';
import { Rest } from './pages/Rest';
import { useHunterStore } from './stores/useHunterStore';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { LocalizationBridge } from './components/preferences/LocalizationBridge';
import { HudPreview } from './pages/HudPreview';

import { useAuth } from './contexts/AuthContext';
import { motion } from 'framer-motion';

function HunterGuard({ children }: { children: React.ReactNode }) {
  const hunterClass = useHunterStore((s) => s.hunterClass);
  const profileUserId = useHunterStore((s) => s.profileUserId);
  const profileLoaded = useHunterStore((s) => s.profileLoaded);
  const profileLoading = useHunterStore((s) => s.profileLoading);
  const profileError = useHunterStore((s) => s.profileError);
  const loadProfile = useHunterStore((s) => s.loadProfile);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const isDifferentUser = Boolean(profileUserId && profileUserId !== user.id);
    if ((!profileLoaded || isDifferentUser) && !profileLoading && !profileError) {
      void loadProfile(user.id);
    }
  }, [user?.id, profileUserId, profileLoaded, profileLoading, profileError, loadProfile]);

  // Se houve falha de rede/Supabase ao buscar perfil existente, exibe tela de reconexão
  // e NUNCA redireciona prematuramente para o onboarding
  if (!profileLoaded && profileError) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#13131A] border border-red-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <h2 className="text-xl font-orbitron font-bold text-red-400 mb-2">FALHA DE SINCRONIZAÇÃO</h2>
          <p className="text-sm text-gray-400 mb-6 font-mono">
            {profileError}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                if (user) void loadProfile(user.id);
              }}
              className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 rounded-xl text-red-300 font-orbitron text-xs tracking-widest uppercase transition-all"
            >
              Tentar Reconectar ao Sistema
            </button>
            <button
              onClick={() => {
                void signOut();
              }}
              className="w-full py-2.5 bg-transparent hover:bg-white/5 border border-white/10 rounded-xl text-gray-400 font-orbitron text-[10px] tracking-widest uppercase transition-all"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se ainda estiver sincronizando o perfil do caçador com o Supabase (ou aguardando início da carga), exibe tela de transição segura
  if (!profileLoaded || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center gap-10">
        <div className="awakening-container">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-violet-400 font-orbitron text-xs tracking-[0.3em] text-center text-glow-purple uppercase select-none"
        >
          Sincronizando Caçador...
        </motion.div>
      </div>
    );
  }

  // Se o perfil foi confirmado como carregado e o usuário genuinamente não possui classe
  if (!hunterClass) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <PreferencesProvider>
      <LocalizationBridge />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          {import.meta.env.DEV && <Route path="/dev/hud" element={<HudPreview />} />}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HunterGuard>
                  <RPGLayout />
                </HunterGuard>
              </ProtectedRoute>
            }
          >
            <Route index element={<QuickMenu />} />
            <Route path="status" element={<Dashboard />} />
            <Route path="quests" element={<Quests />} />
            <Route path="workouts" element={<Workouts />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route path="settings" element={<Settings />} />
            <Route path="fortuna" element={<Fortuna />} />
            <Route path="bosses" element={<Bosses />} />
            <Route path="trophies" element={<TrophyRoom />} />
            <Route path="rest" element={<Rest />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </PreferencesProvider>
  );
}

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl">⚙️</p>
      <h2
        className="mt-4 text-2xl font-black uppercase italic tracking-widest text-white font-orbitron"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm text-gray-500 uppercase tracking-widest">Acesso restrito — Nível insuficiente.</p>
    </div>
  );
}

export default App;

import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RPGLayout } from './components/layout/RPGLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { useHunterStore } from './stores/useHunterStore';
import { LocalizationBridge } from './components/preferences/LocalizationBridge';

// Code-Splitting por Rota (React.lazy) para reduzir o bundle inicial em dispositivos móveis
const RegisterPage = lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const DeleteAccountPage = lazy(() =>
  import('./pages/auth/DeleteAccountPage').then((m) => ({ default: m.DeleteAccountPage }))
);
const Onboarding = lazy(() =>
  import('./pages/Onboarding').then((m) => ({ default: m.Onboarding }))
);
const QuickMenu = lazy(() =>
  import('./pages/QuickMenu').then((m) => ({ default: m.QuickMenu }))
);
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const Quests = lazy(() =>
  import('./pages/Quests').then((m) => ({ default: m.Quests }))
);
const Workouts = lazy(() =>
  import('./pages/Workouts').then((m) => ({ default: m.Workouts }))
);
const Nutrition = lazy(() =>
  import('./pages/Nutrition').then((m) => ({ default: m.Nutrition }))
);
const Settings = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.Settings }))
);
const Fortuna = lazy(() =>
  import('./pages/Fortuna').then((m) => ({ default: m.Fortuna }))
);
const Bosses = lazy(() =>
  import('./pages/Bosses').then((m) => ({ default: m.Bosses }))
);
// Lazy-loaded route chunk for TrophyRoom (origin: import { TrophyRoom } from './pages/TrophyRoom')
const TrophyRoom = lazy(() =>
  import('./pages/TrophyRoom').then((m) => ({ default: m.TrophyRoom }))
);
const Social = lazy(() =>
  import('./pages/Social').then((m) => ({ default: m.Social }))
);
const Rest = lazy(() =>
  import('./pages/Rest').then((m) => ({ default: m.Rest }))
);
const HudPreview = lazy(() =>
  import('./pages/HudPreview').then((m) => ({ default: m.HudPreview }))
);

function RouteLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-9 h-9 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin mb-3 shadow-[0_0_15px_rgba(0,240,255,0.4)]" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 font-orbitron">
        Sincronizando módulo...
      </p>
    </div>
  );
}

// Guardião de Rotas Protegidas (exige login E classe definida no onboarding)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const hunterClass = useHunterStore((s) => s.hunterClass);
  const profileUserId = useHunterStore((s) => s.profileUserId);
  const profileLoaded = useHunterStore((s) => s.profileLoaded);
  const profileLoading = useHunterStore((s) => s.profileLoading);
  const profileError = useHunterStore((s) => s.profileError);
  const loadProfile = useHunterStore((s) => s.loadProfile);

  const isDifferentUser = Boolean(user && profileUserId && profileUserId !== user.id);
  const hasCurrentUserProfile = Boolean(user && profileLoaded && profileUserId === user.id);
  const hasCachedUserClass = Boolean(user && profileUserId === user.id && hunterClass);

  useEffect(() => {
    if (!authLoading && user && (!profileLoaded || isDifferentUser) && !profileLoading && !profileError) {
      void loadProfile(user.id);
    }
  }, [authLoading, user, profileLoaded, isDifferentUser, profileLoading, profileError, loadProfile]);

  // Fase 1: Verificando sessão de autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 animate-pulse">
          Verificando sessão...
        </p>
      </div>
    );
  }

  // Sem usuário autenticado → tela de login
  if (!user) return <Navigate to="/login" replace />;

  // Fase 2: Carregando perfil do caçador no Supabase (apenas se não houver classe em cache para este mesmo usuário)
  if ((!hasCurrentUserProfile || profileLoading) && !hasCachedUserClass && !profileError) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 animate-pulse">
          Sincronizando Caçador...
        </p>
      </div>
    );
  }

  // Fase 3: Erro de rede ao carregar perfil → exibir botão de tentar novamente ou encerrar sessão
  if (profileError && !hasCachedUserClass) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-[#0F0F13] p-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-red-400">
            FALHA DE SINCRONIZAÇÃO
          </p>
          <p className="text-sm text-gray-400">{profileError}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => void loadProfile(user.id)}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Tentar Reconectar ao Sistema
            </button>
            <button
              onClick={() => void signOut()}
              className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              Encerrar Sessão
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fase 4: Perfil carregado com sucesso do banco e realmente sem classe → novo usuário vai para Onboarding
  if (hasCurrentUserProfile && !hunterClass) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// Guardião da Rota de Onboarding (exige login, mas redireciona para "/" se já tiver classe)
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const hunterClass = useHunterStore((s) => s.hunterClass);
  const profileUserId = useHunterStore((s) => s.profileUserId);
  const profileLoaded = useHunterStore((s) => s.profileLoaded);
  const profileLoading = useHunterStore((s) => s.profileLoading);
  const profileError = useHunterStore((s) => s.profileError);
  const loadProfile = useHunterStore((s) => s.loadProfile);

  const isDifferentUser = Boolean(user && profileUserId && profileUserId !== user.id);
  const hasCurrentUserProfile = Boolean(user && profileLoaded && profileUserId === user.id);
  const hasCachedUserClass = Boolean(user && profileUserId === user.id && hunterClass);

  useEffect(() => {
    if (!authLoading && user && (!profileLoaded || isDifferentUser) && !profileLoading && !profileError) {
      void loadProfile(user.id);
    }
  }, [authLoading, user, profileLoaded, isDifferentUser, profileLoading, profileError, loadProfile]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Aguarda verificar se o usuário já possui classe antes de exibir o quiz
  if ((!hasCurrentUserProfile || profileLoading) && !hasCachedUserClass && !profileError) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  // Se o caçador já despertou sua classe, não deve refazer o onboarding
  if ((hasCurrentUserProfile || hasCachedUserClass) && hunterClass) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <PreferencesProvider>
      <LocalizationBridge />
      <AuthProvider>
        <Router>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/delete-account" element={<DeleteAccountPage />} />
              {import.meta.env.DEV && <Route path="/dev/hud" element={<HudPreview />} />}
              {import.meta.env.DEV && <Route path="/hud-preview" element={<HudPreview />} />}

            {/* Rota de Onboarding (Protegida contra repetição se já tiver classe) */}
            <Route
              path="/onboarding"
              element={
                <OnboardingRoute>
                  <Onboarding />
                </OnboardingRoute>
              }
            />

            {/* Rotas Internas Protegidas sob o Layout Principal RPG */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RPGLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<QuickMenu />} />
              <Route path="status" element={<Dashboard />} />
              <Route path="quests" element={<Quests />} />
              <Route path="bosses" element={<Bosses />} />
              <Route path="trophies" element={<TrophyRoom />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="nutrition" element={<Nutrition />} />
              <Route path="fortuna" element={<Fortuna />} />
              <Route path="rest" element={<Rest />} />
              <Route path="social" element={<Social />} />
              <Route path="settings" element={<Settings />} />
            </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </PreferencesProvider>
  );
}

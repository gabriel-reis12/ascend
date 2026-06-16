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
import { Onboarding } from './pages/Onboarding';
import { Settings } from './pages/Settings';
import { QuickMenu } from './pages/QuickMenu';
import { Bosses } from './pages/Bosses';
import { Fortuna } from './pages/Fortuna';
import { Rest } from './pages/Rest';
import { useHunterStore } from './stores/useHunterStore';

function HunterGuard({ children }: { children: React.ReactNode }) {
  const hunterClass = useHunterStore((s) => s.hunterClass);
  
  // Se o usuário está logado mas não escolheu classe, vai pro onboarding
  if (!hunterClass) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
            <Route path="rest" element={<Rest />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function ComingSoon({ title }: { title: string }) {
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

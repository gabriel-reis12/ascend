import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/preferences';
import { supabase } from '@/lib/supabase';
import {
  executeAccountDeletion,
  isValidDeletionConfirmation,
  USER_DATA_CATEGORIES_DELETED,
} from '@/lib/accountDeletion';

export function DeleteAccountPage() {
  const { user } = useAuth();
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const navigate = useNavigate();

  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [acknowledgedIrreversible, setAcknowledgedIrreversible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedSuccess, setDeletedSuccess] = useState(false);

  const expectedPhrase = l('EXCLUIR MINHA CONTA', 'DELETE MY ACCOUNT');
  const isConfirmationValid = isValidDeletionConfirmation(confirmationText);

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acknowledgedIrreversible) {
      setError(
        l(
          'Confirme que compreende que a exclusão da conta é permanente e irreversível.',
          'Please confirm that you understand account deletion is permanent and irreversible.'
        )
      );
      return;
    }

    if (!isConfirmationValid) {
      setError(
        l(
          `Digite "${expectedPhrase}" para confirmar a exclusão permanente.`,
          `Type "${expectedPhrase}" to confirm permanent deletion.`
        )
      );
      return;
    }

    const cleanEmail = (user?.email || email).trim();
    if (!cleanEmail || !password) {
      setError(
        l(
          'Informe seu e-mail e sua senha atual para revalidar sua identidade.',
          'Enter your email and current password to revalidate your identity.'
        )
      );
      return;
    }

    setLoading(true);
    try {
      let targetUserId = user?.id ?? '';

      // Se o usuário abriu a página web após desinstalar o app (sem sessão ativa),
      // autenticamos primeiro para validar identidade e obter o token de sessão para a RPC/RLS.
      if (!targetUserId) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (signInErr || !signInData.user) {
          setError(
            l(
              'Credenciais inválidas. Verifique seu e-mail e senha para autenticar a solicitação de exclusão.',
              'Invalid credentials. Please verify your email and password to authenticate the deletion request.'
            )
          );
          setLoading(false);
          return;
        }
        targetUserId = signInData.user.id;
      }

      const result = await executeAccountDeletion({
        userId: targetUserId,
        email: cleanEmail,
        password,
        confirmationText,
      });

      if (!result.success) {
        setError(
          result.error ||
            l('Não foi possível concluir a exclusão da conta.', 'Could not complete account deletion.')
        );
        setLoading(false);
        return;
      }

      setDeletedSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#030408] text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to={user ? '/settings' : '/login'}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:border-[#00F0FF]/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-[#00F0FF]" />
            <span>{user ? l('Voltar aos Ajustes', 'Back to Settings') : l('Voltar ao Login', 'Back to Login')}</span>
          </Link>

          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-widest text-rose-300">
            {l('Portal de Privacidade & Exclusão', 'Privacy & Deletion Portal')}
          </span>
        </div>

        {deletedSuccess ? (
          <HudCard
            variant="success"
            corners
            radialGlow
            className="p-6 sm:p-8 border-emerald-500/35 bg-[#090F16]/95 space-y-5 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-orbitron text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                {l('Conta Excluída Permanentemente', 'Account Permanently Deleted')}
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
                {l(
                  'Todos os seus registros pessoais, atributos de caçador, histórico de missões, treinos, nutrição, conexões sociais e credenciais de sessão foram removidos e sua sessão foi encerrada com segurança.',
                  'All of your personal records, hunter attributes, quest history, workouts, nutrition logs, social connections, and session credentials have been removed and your session has been safely terminated.'
                )}
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <TacticalButton
                variant="primary"
                accent="cyan"
                displayFont
                onClick={() => navigate('/login', { replace: true })}
                className="min-h-[48px] px-6 text-xs font-bold"
              >
                {l('Retornar ao Portal de Entrada', 'Return to Entry Gate')}
              </TacticalButton>
            </div>
          </HudCard>
        ) : (
          <HudCard
            variant="crimson"
            corners
            radialGlow
            className="p-5 sm:p-7 border-rose-500/35 bg-[#0B0E17]/95 space-y-6"
          >
            {/* Header */}
            <div className="flex items-start gap-3.5 border-b border-white/10 pb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/15 text-rose-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400">
                  {l('Direito de Exclusão de Dados (Web & In-App)', 'Data Deletion Right (Web & In-App)')}
                </span>
                <h1 className="mt-1 font-orbitron text-lg sm:text-2xl font-black uppercase tracking-wide text-white">
                  {l('Excluir Minha Conta ASCEND', 'Delete My ASCEND Account')}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {l(
                    'Este portal permite solicitar e executar a exclusão definitiva da sua conta ASCEND e de todos os dados vinculados, mesmo que você já tenha desinstalado o aplicativo do celular.',
                    'This portal allows you to request and execute the permanent deletion of your ASCEND account and all linked data, even if you have already uninstalled the mobile app.'
                  )}
                </p>
              </div>
            </div>

            {/* Consequences & Data Scope */}
            <div className="space-y-3 rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4">
              <div className="flex items-center gap-2 text-rose-300 font-orbitron text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>
                  {l(
                    'O que será excluído permanentemente (Sem retenção oculta):',
                    'What will be permanently deleted (No hidden retention):'
                  )}
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-5">
                {USER_DATA_CATEGORIES_DELETED.map((cat) => (
                  <li key={cat.id}>{isEnglish ? cat.en : cat.pt}</li>
                ))}
              </ul>
              <p className="pt-1 text-[11px] text-rose-200/90 font-medium">
                {l(
                  'Atenção: Esta operação é imediata e irreversível. Nenhum perfil público ou posição em ranking continuará identificando seu usuário após a confirmação.',
                  'Warning: This operation is immediate and irreversible. No public profile or leaderboard entry will continue to identify your user after confirmation.'
                )}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-3.5 text-xs text-rose-200 flex items-start gap-2.5"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="delete-account-email"
                  className="mb-1.5 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-slate-300"
                >
                  {l('E-mail da Conta', 'Account Email')}
                </label>
                <div className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    id="delete-account-email"
                    type="email"
                    required
                    value={user?.email ?? email}
                    disabled={Boolean(user?.email)}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cacador@ascend.system"
                    className="h-12 w-full rounded-xl border border-white/15 bg-black/50 pl-10 pr-4 text-sm text-white focus:border-rose-400 focus:outline-none disabled:opacity-70"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="delete-account-password"
                  className="mb-1.5 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-slate-300"
                >
                  {l('Revalidação de Identidade (Sua Senha Atual)', 'Identity Revalidation (Your Current Password)')}
                </label>
                <div className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    id="delete-account-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12 w-full rounded-xl border border-white/15 bg-black/50 pl-10 pr-4 text-sm text-white focus:border-rose-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="delete-account-phrase"
                  className="mb-1.5 block font-orbitron text-[11px] font-bold uppercase tracking-wider text-slate-300"
                >
                  {l(
                    `Digite "${expectedPhrase}" para confirmar`,
                    `Type "${expectedPhrase}" to confirm`
                  )}
                </label>
                <input
                  id="delete-account-phrase"
                  type="text"
                  required
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={expectedPhrase}
                  className="h-12 w-full rounded-xl border border-rose-500/35 bg-black/60 px-4 font-orbitron text-xs uppercase tracking-wider text-white focus:border-rose-400 focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedIrreversible}
                  onChange={(e) => setAcknowledgedIrreversible(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/25 bg-black text-rose-500 focus:ring-rose-500"
                />
                <span>
                  {l(
                    'Compreendo que a exclusão da minha conta ASCEND é definitiva e que meus dados pessoais, progresso de RPG, conquistas e histórico não poderão ser recuperados.',
                    'I understand that deleting my ASCEND account is permanent and that my personal data, RPG progress, achievements, and history cannot be recovered.'
                  )}
                </span>
              </label>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <TacticalButton
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(user ? '/settings' : '/login')}
                  className="min-h-[48px] px-5 text-xs font-bold"
                >
                  {l('Cancelar e Manter Conta', 'Cancel and Keep Account')}
                </TacticalButton>

                <TacticalButton
                  type="submit"
                  variant="danger"
                  displayFont
                  disabled={loading || !isConfirmationValid || !acknowledgedIrreversible || !password}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  className="min-h-[48px] px-6 text-xs font-black"
                >
                  {loading
                    ? l('EXCLUINDO CONTA...', 'DELETING ACCOUNT...')
                    : l('EXCLUIR MINHA CONTA DEFINITIVAMENTE', 'PERMANENTLY DELETE MY ACCOUNT')}
                </TacticalButton>
              </div>
            </form>
          </HudCard>
        )}
      </div>
    </main>
  );
}

const MANUAL_PREMIUM_EMAILS = new Set([
  'diegoseleguini@gmail.com',
  'admin@ascen.com',
  'admin@ascend.com',
  'admin@system.com',
  'admin@admin.com',
]);

export function hasManualPremiumAccess(email?: string | null) {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return MANUAL_PREMIUM_EMAILS.has(cleanEmail) || cleanEmail.startsWith('admin@');
}

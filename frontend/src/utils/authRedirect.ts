export type DashboardRole = 'super_admin' | 'sub_admin' | 'customer';

export const getDashboardPath = (role: DashboardRole): string => {
  if (role === 'super_admin') return '/admin/dashboard';
  if (role === 'sub_admin') return '/sub-admin/dashboard';
  return '/customer/dashboard';
};

export const getSafeRedirectPath = (requestedRedirect: string | null, origin: string): string | null => {
  if (!requestedRedirect) return null;

  try {
    const target = new URL(requestedRedirect, origin);
    if (
      target.origin !== new URL(origin).origin ||
      target.pathname === '/login' ||
      target.pathname === '/register'
    ) {
      return null;
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
};

// Utilidades de permisos basadas en los permisos efectivos devueltos por login
// Estructura esperada: permissions = { [module:string]: 'read' | 'write' | 'admin' }

const levelValue = (lvl) => (lvl === 'read' ? 1 : lvl === 'write' ? 2 : lvl === 'admin' ? 3 : 0);

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('clinic_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCurrentPermissions() {
  return getCurrentUser()?.permissions || null;
}

export function hasPermission(module, required = 'read', permissions = null) {
  const perms = permissions || getCurrentPermissions();
  if (!perms) return false;
  const lvl = perms[module];
  if (!lvl) return false;
  return levelValue(lvl) >= levelValue(required);
}

export function hasAnyPermission(modules = [], required = 'read', permissions = null) {
  return modules.some((m) => hasPermission(m, required, permissions));
}

export function requirePermission(modules = [], required = 'read') {
  // Azucar sintáctica para componentes
  return hasAnyPermission(modules, required);
}

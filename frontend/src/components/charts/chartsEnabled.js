/**
 * Procurio dashboard charts — toggle without removing code.
 * Revert visuals: set VITE_ENABLE_CHARTS=false in Vercel/.env or run:
 *   localStorage.setItem('procurio_charts', 'off'); location.reload();
 * Full code revert: see CHARTS_REVERT.md at repo root.
 */
export function isChartsEnabled() {
  if (typeof window !== 'undefined' && window.localStorage?.getItem('procurio_charts') === 'off') {
    return false;
  }
  const env = import.meta.env?.VITE_ENABLE_CHARTS;
  if (env === 'false' || env === '0') return false;
  return true;
}

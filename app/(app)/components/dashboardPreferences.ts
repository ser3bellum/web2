export const DASHBOARD_MVP_KEY = "sb.dashboard.mvp.v1";
export const DASHBOARD_ENABLED_KEY = "sb.dashboard.enabled.v1";
export const DASHBOARD_ORDER_KEY = "sb.dashboard.cardOrder.v2";

export function loadJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveJson<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
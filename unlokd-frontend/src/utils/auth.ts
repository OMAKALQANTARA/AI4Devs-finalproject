const STORAGE_KEY = 'authToken';

type JwtPayload = {
  exp?: number;
  userId?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padding = payload.length % 4 === 0 ? '' : '='.repeat(4 - (payload.length % 4));

  try {
    const decoded = atob(`${payload}${padding}`);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return true;
  }
  if (typeof payload.exp !== 'number') {
    return false;
  }
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export function setAuthToken(token: string) {
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getValidAuthToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    return null;
  }
  if (isTokenExpired(token)) {
    clearAuthToken();
    return null;
  }
  return token;
}

export function getAuthUserId(): number | null {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    return null;
  }
  const payload = decodeJwtPayload(token);
  if (!payload?.userId) {
    return null;
  }
  return payload.userId;
}

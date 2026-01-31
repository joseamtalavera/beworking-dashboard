const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:8080/api' : '/api')
).replace(/\/$/, '');

const TOKEN_STORAGE_KEY = 'beworking_token';

export const getStoredToken = () => {
  try {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem(TOKEN_STORAGE_KEY)
      : null;
  } catch (error) {
    console.error('Failed to read auth token from storage', error);
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to persist auth token', error);
  }
};

const toAbsoluteUrl = (path = '') => {
  const cleaned = path.replace(/^\/+/, '');
  return cleaned ? `${API_BASE_URL}/${cleaned}` : API_BASE_URL;
};

export const resolveApiUrl = toAbsoluteUrl;

export const apiFetch = async (path, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body,
    credentials = 'include',
    signal,
    _retry = false
  } = options;

  const init = {
    method,
    credentials,
    signal,
    headers: new Headers(headers)
  };

  const token = getStoredToken();
  if (token && !init.headers.has('Authorization')) {
    init.headers.set('Authorization', `Bearer ${token}`);
  }

  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams) {
      init.body = body;
    } else if (typeof body === 'string' || body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
      init.body = body;
    } else {
      init.headers.set('Content-Type', 'application/json');
      init.body = JSON.stringify(body);
    }
  }

  const response = await fetch(toAbsoluteUrl(path), init);

  if ((response.status === 401 || response.status === 403) && !_retry) {
    try {
      const refreshResponse = await fetch(toAbsoluteUrl('auth/refresh'), {
        method: 'POST',
        credentials: 'include'
      });
      if (refreshResponse.ok) {
        const payload = await refreshResponse.json().catch(() => null);
        if (payload?.token) {
          setStoredToken(payload.token);
          return apiFetch(path, { ...options, _retry: true });
        }
      }
    } catch (error) {
      console.error('Token refresh failed', error);
    }
    setStoredToken(null);
  }

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || response.statusText || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? response.json() : response.text();
};

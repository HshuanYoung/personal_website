const ABSOLUTE_URL_PATTERN = /^(?:[a-z]+:)?\/\//i;

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function withBase(base: string | undefined, path: string) {
  if (ABSOLUTE_URL_PATTERN.test(path)) {
    return path;
  }

  const normalizedPath = normalizePath(path);
  if (!base) {
    return normalizedPath;
  }

  return `${base.replace(/\/+$/, '')}${normalizedPath}`;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const assetsBaseUrl = import.meta.env.VITE_ASSETS_BASE_URL?.trim() || apiBaseUrl;

export function apiUrl(path: string) {
  return withBase(apiBaseUrl, path);
}

export function assetUrl(path: string) {
  return withBase(assetsBaseUrl, path);
}

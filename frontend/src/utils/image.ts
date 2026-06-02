export function getImageUrl(path?: string | null, fallback: string = "/images/home/avatar-placeholder.jpg"): string {
  if (!path) return fallback;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  if (path.startsWith("/images/")) {
    return path;
  }
  const relativePath = path.startsWith("/") ? path : `/${path}`;
  return `http://localhost:5000${relativePath}`;
}

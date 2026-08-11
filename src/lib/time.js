export function getElapsedMinutes(dateString) {
  const ms = Date.now() - new Date(dateString).getTime();
  return Math.max(0, Math.floor(ms / 60000));
}

export function formatElapsed(dateString) {
  const minutes = getElapsedMinutes(dateString);
  if (minutes < 1) return 'recién';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}min`;
}

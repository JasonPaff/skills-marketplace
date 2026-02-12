export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

export function formatDownloads(count: number): string {
  return count.toLocaleString();
}

export function formatRating(rating: number | string): string {
  return Number(rating).toFixed(1);
}

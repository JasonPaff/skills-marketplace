export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

export function formatDownloads(count: number): string {
  return count.toLocaleString();
}

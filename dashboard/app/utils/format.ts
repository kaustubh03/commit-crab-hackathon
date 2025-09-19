// Formatting utilities for CommitCrab Dashboard

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function pct(part: number, total: number): string {
  if (total === 0) return '0%';
  return ((part / total) * 100).toFixed(1) + '%';
}

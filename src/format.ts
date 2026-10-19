export const formatMeso = (meso: number): string => {
  if (meso >= 1e12) return `${(meso / 1e12).toFixed(2)}조`;
  if (meso >= 1e8) return `${(meso / 1e8).toFixed(2)}억`;
  if (meso >= 1e4) return `${Math.round(meso / 1e4).toLocaleString("ko-KR")}만`;
  return `${Math.round(meso)}`;
};
export const formatPct = (pct: number): string => `${Number(pct.toFixed(2))}%`;

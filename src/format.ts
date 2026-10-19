const trim = (value: number) =>
  value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });

/** 메소를 억 단위로 줄여 쓴다(30억, 1.31억). 1조 이상은 조, 1억 미만은 만 단위. */
export const formatMeso = (meso: number): string => {
  if (meso >= 1e12) return `${trim(meso / 1e12)}조`;
  if (meso >= 1e8) return `${trim(meso / 1e8)}억`;
  if (meso >= 1e4) return `${Math.round(meso / 1e4).toLocaleString("ko-KR")}만`;
  return `${Math.round(meso)}`;
};
export const formatPct = (pct: number): string => `${Number(pct.toFixed(2))}%`;

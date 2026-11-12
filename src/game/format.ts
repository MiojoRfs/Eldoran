export function num(n: number) {
  return Math.floor(n).toLocaleString("pt-BR");
}

export function dec(n: number, d = 1) {
  return n.toFixed(d).replace(".", ",");
}

export function signed(n: number) {
  return n > 0 ? `+${num(n)}` : num(n);
}

export function awayLabel(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return `${s} s`;
}

// 数学工具函数
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const lerp = (a, b, t) => a + (b - a) * t;

export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

export const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);

export const normalize = (x, y) => {
  const L = Math.hypot(x, y) || 1;
  return { x: x / L, y: y / L };
};

export const rectIntersect = (a, b) =>
  a.x < b.x + (b.w || 0) && a.x + (a.w || 0) > b.x &&
  a.y < b.y + (b.h || 0) && a.y + (a.h || 0) > b.y;

export const circleRectIntersect = (cx, cy, cr, rx, ry, rw, rh) => {
  const dx = clamp(cx, rx, rx + rw) - cx;
  const dy = clamp(cy, ry, ry + rh) - cy;
  return (dx * dx + dy * dy) < cr * cr;
};

export const approach = (val, target, step) => {
  if (val < target) return Math.min(val + step, target);
  if (val > target) return Math.max(val - step, target);
  return val;
};

export const map = (v, inMin, inMax, outMin, outMax) =>
  ((v - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

export const formatTime = (ms) => {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m + ':' + String(s % 60).padStart(2, '0');
};

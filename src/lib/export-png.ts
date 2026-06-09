import type { JsonItinerary, JsonDayItem } from '../../agent-format/src/types.js';
import { catColors } from './constants.js';
import { durStr, stopName } from './constants.js';

declare function html2canvas(element: HTMLElement, opts: Record<string, unknown>): Promise<HTMLCanvasElement>;

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Height estimation for satori layout ──

function calcCardHeight(day: { note?: string; items?: JsonDayItem[] }): number {
  const HEADER = 41;
  const NOTE = 24;
  const ITEMS_PAD = 16;
  const ITEM_H = 42;
  const FLEX_ITEM_H = 38;
  const GAP = 6;
  const items = day.items || [];
  let h = HEADER;
  if (day.note) h += NOTE;
  h += ITEMS_PAD;
  for (const item of items) {
    h += ITEM_H;
    if (item.type === 'flex') {
      for (const _opt of item.opts || []) {
        h += FLEX_ITEM_H;
      }
    }
  }
  h += (items.length - 1) * GAP;
  return h;
}

// ── Inline HTML generator for satori ──

function buildInlineHTML(data: JsonItinerary): { html: string; width: number; height: number } {
  const stops: Record<string, typeof data.stops[0]> = {};
  (data.stops || []).forEach(s => { stops[s.id] = s; });
  const routes: Record<string, typeof data.routes[0]> = {};
  (data.routes || []).forEach(r => { routes[r.id] = r; });

  function renderItem(item: JsonDayItem): string {
    if (item.type === 'stop') {
      const s = stops[item.ref];
      if (!s) return '';
      const cat = s.cat || 'other';
      const color = catColors[cat] || '#999';
      return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:6px;font-size:13px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;margin-top:4px;"></span>
        <div style="flex:1;">
          <div style="font-weight:600;line-height:1.4;">${esc(s.name)}</div>
          <div style="color:#888;font-size:12px;line-height:1.4;">${esc(s.goal)}</div>
          ${s.dur ? `<div style="color:#aaa;font-size:11px;line-height:1.4;">${durStr(s.dur)}</div>` : ''}
        </div>
      </div>`;
    }
    if (item.type === 'route') {
      const r = routes[item.ref];
      if (!r) return '';
      return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:6px;font-size:13px;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;letter-spacing:0.05em;padding:2px 5px;border:1px solid #d1d5db;border-radius:4px;flex-shrink:0;margin-top:2px;">${esc(r.mode)}</div>
        <div style="flex:1;">
          <div style="font-weight:600;line-height:1.4;">${esc(stops[r.from]?.name || r.from)} → ${esc(stops[r.to]?.name || r.to)}</div>
          <div style="color:#aaa;font-size:11px;line-height:1.4;">${durStr(r.dur)}${r.dist ? ` · ${r.dist}km` : ''}</div>
        </div>
      </div>`;
    }
    if (item.type === 'note') {
      return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:6px;font-size:13px;">
        <div style="flex:1;font-style:italic;line-height:1.4;">${esc(item.txt)}</div>
      </div>`;
    }
    if (item.type === 'flex') {
      const opts = (item.opts || []).map(o => renderItem(o)).join('');
      const pick = item.pick || 1;
      return `<div style="display:flex;flex-direction:column;padding:8px 10px;border-radius:6px;font-size:13px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <div style="flex:1;"><span style="font-weight:600;">Choose ${pick}</span></div>
          <span style="font-size:11px;background:#fde68a;color:#92400e;padding:1px 8px;border-radius:4px;font-weight:600;">pick ${pick}</span>
        </div>
        <div">${opts}</div>
      </div>`;
    }
    return '';
  }

  const CARD_W = 280;
  const GAP = 20;
  const PAD = 20;

  const days = data.days || [];
  let totalH = PAD;
  for (const day of days) {
    totalH += calcCardHeight(day) + GAP;
  }
  totalH += PAD - GAP;
  const totalW = 2 * PAD + CARD_W;

  const cards = days.map((day, i) => `
    <div style="display:flex;flex-direction:column;border-radius:10px;overflow:hidden;background:#fff;width:${CARD_W}px;border:1px solid #e5e5e5;">
      <div style="padding:12px 16px;font-size:14px;font-weight:700;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
        <span>Day ${i + 1} — ${day.date}</span>
      </div>
      ${day.note ? `<div style="padding:8px 16px;font-size:12px;color:#888;">${esc(day.note)}</div>` : ''}
      <div style="padding:8px;display:flex;flex-direction:column;gap:6px;">
        ${(day.items || []).map(item => renderItem(item)).join('')}
      </div>
    </div>
  `).join('');

  return {
    html: `<div style="display:flex;flex-direction:column;align-items:flex-start;gap:${GAP}px;padding:${PAD}px;background:#fafafa;width:${totalW}px;">${cards}</div>`,
    width: totalW,
    height: totalH
  };
}

// ── Export orchestration ──

async function exportViaSatori(data: JsonItinerary, filename: string): Promise<void> {
  const [satoriMod, htmlMod] = await Promise.all([
    import('https://esm.sh/satori@0.10.0'),
    import('https://esm.sh/satori-html@0.1.0')
  ]);
  const satori = satoriMod.default as (vnode: unknown, opts: { width: number; height: number; fonts: Array<{ name: string; data: ArrayBuffer; weight: number; style: string }> }) => Promise<string>;
  const htmlFn = (htmlMod.html || htmlMod.default || htmlMod) as (html: string) => unknown;

  const fontCSS = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap').then(r => r.text());
  const fontUrls = [...fontCSS.matchAll(/url\(([^)]+)\)/g)].map(m => m[1]);
  const fontWeights = [...fontCSS.matchAll(/font-weight:\s*(\d+)/g)].map(m => parseInt(m[1]));
  const fontData = await Promise.all(fontUrls.map(url => fetch(url).then(r => r.arrayBuffer())));
  const fonts = fontData.map((data, i) => ({
    name: 'Inter',
    data,
    weight: fontWeights[i] || 400,
    style: 'normal' as const
  }));

  const { html, width, height } = buildInlineHTML(data);
  const vnode = htmlFn(html);
  const svg = await satori(vnode, { width, height, fonts });

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
  const canvas = document.createElement('canvas');
  const DPR = window.devicePixelRatio || 2;
  canvas.width = width * DPR;
  canvas.height = height * DPR;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(DPR, DPR);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  triggerDownload(canvas.toDataURL('image/png'), filename);
}

async function exportViaForeignObject(el: HTMLElement, filename: string): Promise<void> {
  const styleSheets = Array.from(document.styleSheets);
  let cssText = '';
  for (const ss of styleSheets) {
    try { for (const rule of ss.cssRules) cssText += rule.cssText; } catch { /* skip */ }
  }
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.background = getComputedStyle(el).background || '#fff';
  const wrapper = document.createElement('div');
  wrapper.appendChild(clone);
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('xmlns', svgNS);
  svg.setAttribute('width', String(el.offsetWidth));
  svg.setAttribute('height', String(el.offsetHeight));
  svg.setAttribute('viewBox', `0 0 ${el.offsetWidth} ${el.offsetHeight}`);
  const foreign = document.createElementNS(svgNS, 'foreignObject');
  foreign.setAttribute('width', '100%');
  foreign.setAttribute('height', '100%');
  const body = document.createElement('body');
  body.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  body.style.margin = '0';
  body.style.padding = '0';
  body.style.background = getComputedStyle(document.body).backgroundColor;
  const style = document.createElement('style');
  style.textContent = cssText;
  body.appendChild(style);
  body.appendChild(wrapper);
  foreign.appendChild(body);
  svg.appendChild(foreign);
  const serializer = new XMLSerializer();
  const svgBlob = new Blob([serializer.serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = el.offsetWidth * 2;
  canvas.height = el.offsetHeight * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  triggerDownload(canvas.toDataURL('image/png'), filename);
}

function triggerDownload(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function exportPNG(
  data: JsonItinerary | null,
  visualElement: HTMLElement | null,
  filename: string
): Promise<void> {
  if (!data && (!visualElement || !visualElement.children.length)) return;

  try {
    if (data) {
      await exportViaSatori(data, filename);
    } else {
      throw new Error('No data for satori export');
    }
  } catch (e) {
    console.warn('Satori export failed, trying foreignObject fallback:', (e as Error).message);
    if (visualElement) {
      try {
        await exportViaForeignObject(visualElement, filename);
      } catch (e2) {
        console.warn('foreignObject failed, trying html2canvas:', (e2 as Error).message);
        if (typeof html2canvas !== 'undefined') {
          try {
            const canvas = await html2canvas(visualElement, {
              scale: 2,
              letterRendering: true,
              backgroundColor: getComputedStyle(document.body).backgroundColor,
              logging: false
            });
            triggerDownload(canvas.toDataURL('image/png'), filename);
          } catch (e3) {
            console.warn('PNG export failed:', (e3 as Error).message);
          }
        }
      }
    }
  }
}

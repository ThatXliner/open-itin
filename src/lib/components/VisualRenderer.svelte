<script lang="ts">
  import type { JsonItinerary, JsonDayItem, JsonStop, JsonDay } from '../../../agent-format/src/types.js';
  import { catColors, catLabels, modeLabels } from '$lib/constants.js';

  let { data }: { data: JsonItinerary } = $props();

  const stops = $derived.by(() => {
    const m = new Map<string, JsonStop>();
    (data.stops || []).forEach(s => m.set(s.id, s));
    return m;
  });

  function durStr(d: { min?: number; max?: number } | undefined): string {
    if (!d) return '';
    const parts: string[] = [];
    if (d.min !== undefined) parts.push(`${d.min}h`);
    if (d.max !== undefined && d.max !== d.min) parts.push(`–${d.max}h`);
    return parts.join('');
  }

  function stopRef(id: string): { stop?: JsonStop; exists: boolean } {
    const s = stops.get(id);
    return { stop: s, exists: !!s };
  }
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
  {#each data.days || [] as day, dayIdx}
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div class="flex justify-between items-center px-4 py-3 text-sm font-bold border-b border-gray-100 dark:border-gray-800">
        <span>Day {dayIdx + 1} — {day.date}</span>
      </div>
      {#if day.note}
        <div class="px-4 pb-2 pt-2 text-xs text-gray-500 dark:text-gray-400">{day.note}</div>
      {/if}
      <div class="p-2 flex flex-col gap-1.5">
        {#each day.items || [] as item}
          {#if item.type === 'stop'}
            {@const s = stopRef(item.ref)}
            {#if s.exists}
              <div class="flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-sm">
                <span
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                  style="background: {catColors[s.stop!.cat || 'other'] || '#999'}"
                  title={catLabels[s.stop!.cat || 'other'] || s.stop!.cat}
                ></span>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold">{s.stop!.name}</div>
                  <div class="text-xs text-gray-400">{s.stop!.goal}</div>
                  {#if s.stop!.dur}
                    <div class="text-[11px] text-gray-500">{durStr(s.stop!.dur)}</div>
                  {/if}
                </div>
              </div>
            {/if}
          {:else if item.type === 'route'}
            {@const r = (data.routes || []).find(rr => rr.id === item.ref)}
            {#if r}
              <div class="flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800/50">
                <span class="text-xs font-bold uppercase text-gray-500 tracking-wider px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded flex-shrink-0 mt-0.5">{modeLabels[r.mode] || r.mode}</span>
                <div class="flex-1 min-w-0">
                  <span class="font-semibold">{stops.get(r.from)?.name || r.from} <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> {stops.get(r.to)?.name || r.to}</span>
                  <div class="text-[11px] text-gray-500">{durStr(r.dur)}{#if r.dist} · {r.dist}km{/if}</div>
                </div>
              </div>
            {/if}
          {:else if item.type === 'note'}
            <div class="flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-sm">
              <div class="flex-1 italic text-gray-600 dark:text-gray-400 text-xs">{item.txt}</div>
            </div>
          {:else if item.type === 'flex'}
            <div class="flex flex-col px-2.5 py-2 rounded-lg text-sm">
              <div class="flex items-center gap-2.5 mb-1.5">
                <span class="font-semibold text-xs">Choose {item.pick || 1}</span>
                <span class="text-[11px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-semibold">pick {item.pick || 1}</span>
              </div>
              <div class="ml-6">
                {#each item.opts || [] as opt}
                  {#if opt.type === 'stop'}
                    {@const s = stopRef(opt.ref)}
                    {#if s.exists}
                      <div class="flex items-start gap-2 py-1.5 text-xs">
                        <span class="w-2 h-2 rounded-full flex-shrink-0 mt-1" style="background: {catColors[s.stop!.cat || 'other'] || '#999'}"></span>
                        <div>
                          <span class="font-semibold">{s.stop!.name}</span>
                          <span class="text-gray-400"> — {s.stop!.goal}</span>
                        </div>
                      </div>
                    {/if}
                  {:else if opt.type === 'route'}
                    {@const r = (data.routes || []).find(rr => rr.id === opt.ref)}
                    {#if r}
                      <div class="flex items-start gap-2 py-1.5 text-xs">
                        <span class="font-bold uppercase text-gray-400">{modeLabels[r.mode] || r.mode}</span>
                        <span class="font-semibold">{stops.get(r.from)?.name || r.from} → {stops.get(r.to)?.name || r.to}</span>
                      </div>
                    {/if}
                  {:else if opt.type === 'note'}
                    <div class="italic text-gray-500 dark:text-gray-400 py-1.5 text-xs">{opt.txt}</div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/each}
</div>

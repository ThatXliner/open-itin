<script lang="ts">
  import { examples } from '$lib/examples.js';
  import type { JsonItinerary } from '../../../agent-format/src/types.js';
  import { format } from '../../../agent-format/src/kdl.js';
  import { fromJSON } from '../../../agent-format/src/convert.js';
  import VisualRenderer from './VisualRenderer.svelte';
  import { exportPNG } from '$lib/export-png.js';

  let activeExample = $state<keyof typeof examples>('pch');
  let showFormat = $state<'json' | 'kdl'>('json');

  const currentData = $derived(examples[activeExample]);
  const currentCode = $derived.by(() => {
    if (showFormat === 'kdl') {
      return format(fromJSON(examples[activeExample]));
    }
    return JSON.stringify(examples[activeExample], null, 2);
  });

  let visualEl: HTMLDivElement | undefined = $state();

  function handleExport() {
    exportPNG(currentData, visualEl ?? null, 'open-itin-example.png');
  }
</script>

<section class="px-6 py-16">
  <div class="mx-auto max-w-2xl">
    <h2 class="text-2xl font-bold tracking-tight mb-4">Example</h2>

    <div class="flex gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1 w-fit mb-3">
      {#each Object.entries(examples) as [key, ex]}
        <button
          onclick={() => activeExample = key as keyof typeof examples}
          class="px-4 py-1.5 rounded-md text-sm font-medium transition-all {activeExample === key ? 'bg-white dark:bg-gray-800 shadow-sm font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}"
        >{ex.name}</button>
      {/each}
    </div>

    <div class="flex gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1 w-fit mb-3">
      <button
        onclick={() => showFormat = 'json'}
        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all {showFormat === 'json' ? 'bg-white dark:bg-gray-800 shadow-sm font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}"
      >JSON (.oitinerary.json)</button>
      <button
        onclick={() => showFormat = 'kdl'}
        class="px-4 py-1.5 rounded-md text-sm font-medium transition-all {showFormat === 'kdl' ? 'bg-white dark:bg-gray-800 shadow-sm font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}"
      >KDL (.oitinerary.kdl)</button>
    </div>

    <pre class="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm leading-relaxed max-h-80 overflow-y-auto"><code>{currentCode}</code></pre>

    <div class="mt-8">
      <div class="flex items-center gap-3 mb-3">
        <h3 class="text-lg font-semibold m-0">Visual view</h3>
        <button onclick={handleExport} class="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer">Export as PNG</button>
      </div>
      <div bind:this={visualEl}>
        <VisualRenderer data={currentData} />
      </div>
    </div>
  </div>
</section>

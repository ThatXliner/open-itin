<script lang="ts">
  import type { JsonItinerary } from '../../../agent-format/src/types.js';
  import { parseInput } from '$lib/format-utils.js';
  import { validate } from '$lib/validator.js';
  import { geocodeStops } from '$lib/geocoder.js';
  import { exportPNG } from '$lib/export-png.js';
  import { examples } from '$lib/examples.js';
  import VisualRenderer from './VisualRenderer.svelte';

  let inputText = $state('');
  let parsedData: JsonItinerary | null = $state(null);
  let errors: string[] | null = $state(null);
  let showRender = $state(false);
  let isGeocodeChecked = $state(false);
  let geocodeResults: string[] = $state([]);

  let visualEl: HTMLDivElement | undefined = $state();

  function handleValidate() {
    geocodeResults = [];
    if (!inputText.trim()) {
      errors = ['Paste JSON or KDL first.'];
      parsedData = null;
      showRender = false;
      return;
    }
    try {
      parsedData = parseInput(inputText);
      errors = validate(parsedData);
      showRender = false;
    } catch (e) {
      parsedData = null;
      errors = [(e as Error).message];
      showRender = false;
    }
  }

  async function handleRender() {
    geocodeResults = [];
    if (!inputText.trim()) {
      errors = ['Paste JSON or KDL first.'];
      parsedData = null;
      showRender = false;
      return;
    }
    try {
      parsedData = parseInput(inputText);
      errors = validate(parsedData);
      if (errors.length === 0) {
        if (isGeocodeChecked) {
          await geocodeStops(parsedData, (result) => {
            if (result.coords) {
              geocodeResults = [...geocodeResults, `✓ ${result.name}: ${result.coords.lat}, ${result.coords.lng}`];
            } else {
              geocodeResults = [...geocodeResults, `✗ ${result.name}: ${result.error}`];
            }
          });
        }
        showRender = true;
      } else {
        showRender = false;
      }
    } catch (e) {
      parsedData = null;
      errors = [(e as Error).message];
      showRender = false;
    }
  }

  function handleLoadExample() {
    inputText = JSON.stringify(examples.pch, null, 2);
    errors = null;
    showRender = false;
    geocodeResults = [];
  }

  function handleClear() {
    inputText = '';
    parsedData = null;
    errors = null;
    showRender = false;
    geocodeResults = [];
  }

  function handleExport() {
    exportPNG(parsedData, visualEl ?? null, 'open-itin-itinerary.png');
  }
</script>

<section id="validator" class="px-6 py-16">
  <div class="mx-auto max-w-2xl">
    <h2 class="text-2xl font-bold tracking-tight mb-4">Validator</h2>
    <p class="text-gray-500 dark:text-gray-400 mb-3">Paste a JSON or KDL itinerary below and validate it:</p>

    <textarea
      bind:value={inputText}
      placeholder="Paste JSON or KDL..."
      class="w-full min-h-40 px-4 py-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 resize-y focus:outline-none focus:border-blue-500"
      rows={8}
    ></textarea>

    <div class="flex flex-wrap gap-2 mt-3">
      <button onclick={handleValidate} class="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer">Validate</button>
      <button onclick={handleRender} class="px-5 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer">Render</button>
      <label class="inline-flex items-center gap-1.5 text-sm cursor-pointer text-gray-600 dark:text-gray-400">
        <input type="checkbox" bind:checked={isGeocodeChecked} class="rounded" />
        Geocode stops
      </label>
      <button onclick={handleLoadExample} class="px-5 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer">Load example</button>
      <button onclick={handleClear} class="px-5 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer">Clear</button>
    </div>

    {#if errors !== null}
      <div class="mt-3 px-4 py-3 rounded-lg text-sm {errors.length === 0 ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}">
        {#if errors.length === 0}
          ✓ Valid Open Itinerary v0.2 document.
        {:else}
          <strong>{errors.length} issue(s):</strong>
          <ul class="mt-2 ml-5 space-y-1">
            {#each errors as err}
              <li>{err}</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}

    {#if geocodeResults.length > 0}
      <div class="mt-2 px-4 py-2 rounded-lg text-sm bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
        {#each geocodeResults as result}
          <div class="text-green-700 dark:text-green-300">{result}</div>
        {/each}
      </div>
    {/if}

    {#if showRender && parsedData}
      <div class="mt-6 flex items-center gap-3">
        <button onclick={handleExport} class="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer">Export as PNG</button>
      </div>
      <div bind:this={visualEl}>
        <VisualRenderer data={parsedData} />
      </div>
    {/if}
  </div>
</section>

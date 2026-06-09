<script lang="ts">
  function copy(el: HTMLElement) {
    const text = el.parentElement?.textContent?.replace(/copy$/, '').trim() || '';
    navigator.clipboard.writeText(text).then(() => {
      const btn = el as HTMLButtonElement;
      btn.textContent = 'copied!';
      setTimeout(() => { btn.textContent = 'copy'; }, 1500);
    });
  }
</script>

<section class="px-6 py-16">
  <div class="mx-auto max-w-2xl">
    <h2 class="text-2xl font-bold tracking-tight mb-4">Quick start</h2>
    <p class="text-gray-500 dark:text-gray-400 mb-3">Validate any itinerary against the schema:</p>

    <div class="relative bg-gray-900 text-gray-100 px-5 py-4 rounded-lg text-sm font-mono mb-3">
      pip install jsonschema
      <button onclick={(e) => copy(e.currentTarget as HTMLElement)} class="absolute top-2 right-3 bg-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs hover:bg-gray-600 hover:text-white cursor-pointer">copy</button>
    </div>

    <div class="relative bg-gray-900 text-gray-100 px-5 py-4 rounded-lg text-sm font-mono mb-3">
      python -c "import json, jsonschema; schema = json.load(open('open-itin.schema.json')); data = json.load(open('your-trip.json')); jsonschema.validate(data, schema); print('Valid')"
      <button onclick={(e) => copy(e.currentTarget as HTMLElement)} class="absolute top-2 right-3 bg-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs hover:bg-gray-600 hover:text-white cursor-pointer">copy</button>
    </div>

    <p class="text-gray-500 dark:text-gray-400 mt-5">Then geocode it (adds real coordinates from OpenStreetMap):</p>
    <div class="relative bg-gray-900 text-gray-100 px-5 py-4 rounded-lg text-sm font-mono mt-3">
      python geocode.py your-trip.json
      <button onclick={(e) => copy(e.currentTarget as HTMLElement)} class="absolute top-2 right-3 bg-gray-700 text-gray-400 px-2 py-0.5 rounded text-xs hover:bg-gray-600 hover:text-white cursor-pointer">copy</button>
    </div>
  </div>
</section>

<script lang="ts">
  const highlights = [
    { icon: '\u{1F3D8}', title: 'Every stop has a goal', desc: 'A goal captures not just where you\'re going, but why — and it forces AI agents to be explicit about intent.' },
    { icon: '\u{1F4CD}', title: 'Coords are a cache, not truth', desc: 'The name (and addr) is authoritative; coordinates are added by a geocoder post-generation.' },
    { icon: '⚡', title: 'Token-efficient by design', desc: 'Abbreviated keys like tz, dur, and cat save 25-35% output tokens versus verbose JSON.' },
    { icon: '\u{1F4C4}', title: 'Flat catalogs, not deep nesting', desc: 'Stops and routes are top-level, referenced by id — no duplication when a stop appears in multiple days.' },
    { icon: '\u{1F5E1}', title: 'Alternatives are first-class', desc: 'Stop-level alts suggest replacements; day-level flex blocks let you choose among options.' },
    { icon: '⏱}', title: 'Duration ranges, not fixed times', desc: 'dur: {min: 1.5, max: 2.5} acknowledges travel is uncertain; fixed times for when they truly matter.' }
  ];
</script>

<section class="px-6 py-16">
  <div class="mx-auto max-w-2xl">
    <h2 class="text-2xl font-bold tracking-tight mb-6">Design highlights</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each highlights as h}
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div class="text-2xl mb-2">{h.icon}</div>
          <h3 class="font-semibold mb-1">{h.title}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 m-0">{h.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

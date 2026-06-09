<script lang="ts">
  import '../app.css';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { theme } from '$lib/theme.svelte';
  let { children }: { children: import('svelte').Snippet } = $props();

  $effect(() => {
    const t = theme.current;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', t);
      document.body.classList.toggle('dark', t === 'dark');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('open-itin-theme', t);
    }
  });
</script>

<ThemeToggle />
{@render children()}
<footer class="text-center py-10 text-sm text-gray-400">
  <div class="mx-auto max-w-2xl">
    <p>MIT &middot; <a href="https://github.com/ThatXliner/open-itin" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">GitHub</a> &middot; Built for AI agents, designed for humans</p>
  </div>
</footer>

const themes = ['auto', 'dark', 'light'] as const;
type Theme = (typeof themes)[number];

function createThemeStore() {
  let current = $state<Theme>('auto');

  function apply(t: Theme) {
    current = t;
  }

  function cycle() {
    const idx = themes.indexOf(current);
    apply(themes[(idx + 1) % themes.length]);
  }

  // Initialize from localStorage if available (client-side only)
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('open-itin-theme') as Theme | null;
    if (saved && themes.includes(saved)) {
      current = saved;
    }
  }

  return {
    get current() { return current; },
    cycle,
    apply
  };
}

export const theme = createThemeStore();

export interface Theme {
  id: string;
  name: string;
  bg: string;
  barBg: string;
  card: string;
  border: string;
  borderSubtle: string;
  fg: string;
  muted: string;
  warm: string;
  cool: string;
  accent: string;
  ok: string;
  warn: string;
  ornInk: string;
  dustBg?: string;
  inkOnWarm?: string;
}

export const DARK: Theme = {
  id: 'dark',
  name: 'Dark · Vault',
  bg:           'oklch(0.165 0.008 250)',
  barBg:        'oklch(0.135 0.008 250)',
  card:         'oklch(0.195 0.008 250)',
  border:       'oklch(0.28 0.012 250)',
  borderSubtle: 'oklch(0.24 0.01 250)',
  fg:           'oklch(0.94 0.012 80)',
  muted:        'oklch(0.58 0.012 250)',
  warm:         'oklch(0.68 0.155 30)',
  cool:         'oklch(0.72 0.115 200)',
  accent:       'oklch(0.78 0.135 80)',
  ok:           'oklch(0.72 0.135 160)',
  warn:         'oklch(0.78 0.135 80)',
  ornInk:       'oklch(0.4 0.012 250)',
};

export const WARM: Theme = {
  id: 'warm',
  name: 'Warm · Bazaar',
  bg:           'oklch(0.205 0.015 35)',
  barBg:        'oklch(0.17 0.015 35)',
  card:         'oklch(0.235 0.015 35)',
  border:       'oklch(0.32 0.022 35)',
  borderSubtle: 'oklch(0.28 0.018 35)',
  fg:           'oklch(0.95 0.02 80)',
  muted:        'oklch(0.62 0.022 35)',
  warm:         'oklch(0.7 0.16 30)',
  cool:         'oklch(0.7 0.115 200)',
  accent:       'oklch(0.78 0.135 80)',
  ok:           'oklch(0.74 0.13 160)',
  warn:         'oklch(0.8 0.135 80)',
  ornInk:       'oklch(0.36 0.025 35)',
};

export const LIGHT: Theme = {
  id: 'light',
  name: 'Light · Parchment',
  bg:           'oklch(0.965 0.012 80)',
  barBg:        'oklch(0.94 0.014 80)',
  card:         'oklch(0.99 0.008 80)',
  border:       'oklch(0.85 0.015 80)',
  borderSubtle: 'oklch(0.91 0.012 80)',
  fg:           'oklch(0.22 0.015 35)',
  muted:        'oklch(0.5 0.018 35)',
  warm:         'oklch(0.55 0.16 30)',
  cool:         'oklch(0.5 0.105 200)',
  accent:       'oklch(0.65 0.14 70)',
  ok:           'oklch(0.55 0.13 160)',
  warn:         'oklch(0.65 0.14 70)',
  ornInk:       'oklch(0.3 0.02 35)',
};

export const DUSK: Theme = {
  id: 'dusk',
  name: 'Dusk · Charagh',
  bg:           'oklch(0.22 0.028 200)',
  barBg:        'oklch(0.18 0.026 200)',
  card:         'oklch(0.24 0.028 200)',
  border:       'oklch(0.36 0.03 200)',
  borderSubtle: 'oklch(0.3 0.025 200)',
  fg:           'oklch(0.94 0.014 80)',
  muted:        'oklch(0.62 0.022 200)',
  warm:         'oklch(0.7 0.16 30)',
  cool:         'oklch(0.62 0.105 200)',
  accent:       'oklch(0.78 0.135 80)',
  ok:           'oklch(0.72 0.135 160)',
  warn:         'oklch(0.78 0.135 80)',
  ornInk:       'oklch(0.42 0.025 200)',
  inkOnWarm:    'oklch(0.22 0.028 200)',
};

export const THEMES: Theme[] = [DARK, WARM, LIGHT, DUSK];

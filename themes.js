import { PLUM, MAGENTA } from './config.js';

/**
 * A theme is the whole colour treatment of a banner in one object: page
 * background, the two text colours, the button gradient and its label colour.
 *
 * Creative fatigue is mostly a *visual* problem — the same layout in the same
 * colours stops registering after a couple of weeks even when the copy changes.
 * Switching theme gives the same copy a different treatment in one click, which
 * is the cheapest refresh available.
 *
 *   id       stable key, stored in saved layouts
 *   label    what the operator sees
 *   bg       canvas background
 *   text     colour applied to normal lines
 *   accent   colour applied to blinking / emphasis lines
 *   btn      [from, to] button gradient, left to right
 *   btnText  button label colour
 */
export const THEMES = [
  {
    id: 'classic',
    label: 'Classic light',
    bg: '#FFFFFF',
    text: PLUM,
    accent: MAGENTA,
    btn: ['#4C055E', '#BB0149'],
    btnText: '#FFFFFF'
  },
  {
    id: 'inverted',
    label: 'Inverted plum',
    bg: '#5D0253',
    text: '#FFFFFF',
    accent: '#FFC8E6',
    btn: ['#FFFFFF', '#FFFFFF'],
    btnText: '#5D0253'
  },
  {
    id: 'magenta',
    label: 'Magenta block',
    bg: '#D3064F',
    text: '#FFFFFF',
    accent: '#FFE07A',
    btn: ['#FFFFFF', '#FFFFFF'],
    btnText: '#D3064F'
  },
  {
    id: 'ink',
    label: 'Ink on cream',
    bg: '#FBF3E9',
    text: '#2B0F33',
    accent: '#D3064F',
    btn: ['#2B0F33', '#5D0253'],
    btnText: '#FFFFFF'
  },
  {
    id: 'gold',
    label: 'Plum and gold',
    bg: '#3B0140',
    text: '#FFFFFF',
    accent: '#F5C451',
    btn: ['#F5C451', '#E0A32C'],
    btnText: '#3B0140'
  }
];

export const DEFAULT_THEME = 'classic';

export function themeById(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

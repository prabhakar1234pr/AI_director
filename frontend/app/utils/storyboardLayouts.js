// Storyboard layout variants. Each variant is a list of `{ c, r }` cells
// describing colSpan and rowSpan on a 6-column grid. Variants per panel
// count let the user reshape the page without us needing to ship a full
// drag-resize grid editor.

export const LAYOUT_VARIANTS = {
  1: [
    { name: 'Full page', cells: [{ c: 6, r: 1 }] },
  ],

  2: [
    { name: 'Side by side', cells: [{ c: 3, r: 1 }, { c: 3, r: 1 }] },
    { name: 'Stacked', cells: [{ c: 6, r: 1 }, { c: 6, r: 1 }] },
  ],

  3: [
    {
      name: 'Hero + 2',
      cells: [{ c: 6, r: 1 }, { c: 3, r: 1 }, { c: 3, r: 1 }],
    },
    {
      name: 'Filmstrip',
      cells: [{ c: 2, r: 1 }, { c: 2, r: 1 }, { c: 2, r: 1 }],
    },
    {
      name: 'Tall + 2',
      cells: [{ c: 4, r: 2 }, { c: 2, r: 1 }, { c: 2, r: 1 }],
    },
  ],

  4: [
    {
      name: '2 × 2',
      cells: [
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
      ],
    },
    {
      name: 'Hero left + 3',
      cells: [
        { c: 4, r: 2 },
        { c: 2, r: 2 },
        { c: 2, r: 2 },
        { c: 4, r: 2 },
      ],
    },
    {
      name: 'Filmstrip',
      cells: [
        { c: 6, r: 1 },
        { c: 2, r: 1 },
        { c: 2, r: 1 },
        { c: 2, r: 1 },
      ],
    },
  ],

  5: [
    {
      name: 'Hero + 4',
      cells: [
        { c: 6, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
      ],
    },
    {
      name: '2 × 2 + wide',
      cells: [
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 6, r: 1 },
      ],
    },
  ],

  6: [
    {
      name: '3 × 2',
      cells: [
        { c: 2, r: 1 },
        { c: 2, r: 1 },
        { c: 2, r: 1 },
        { c: 2, r: 1 },
        { c: 2, r: 1 },
        { c: 2, r: 1 },
      ],
    },
    {
      name: 'Hero + 5',
      cells: [
        { c: 4, r: 2 },
        { c: 2, r: 1 },
        { c: 2, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 6, r: 1 },
      ],
    },
    {
      name: '2 × 3',
      cells: [
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
        { c: 3, r: 1 },
      ],
    },
  ],
}

// Fallback for shot counts beyond the table — full-width hero, then 2-col
// rows, matching the previous behaviour.
function fallbackVariant(n) {
  const cells = [{ c: 6, r: 1 }]
  for (let i = 1; i < n; i += 2) {
    cells.push({ c: 3, r: 1 })
    if (i + 1 < n) cells.push({ c: 3, r: 1 })
  }
  return [{ name: 'Auto', cells }]
}

export function getVariantsFor(count) {
  return LAYOUT_VARIANTS[count] ?? fallbackVariant(count)
}

export function pickLayoutCells(count, variantIndex = 0) {
  const variants = getVariantsFor(count)
  const variant = variants[variantIndex] ?? variants[0]
  return variant.cells
}

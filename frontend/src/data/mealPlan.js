/** Dynamic menu for the "Captain America" cut month - 3 interchangeable options
 * for breakfast, 3 for lunch, 3 for dinner, built from the user's preferred
 * staples (huevo, pollo, arroz, vegetales, yogur griego Danone, proteína en
 * polvo, overnight oats) plus a few Consum-friendly additions for variety
 * (pavo, salmón, atún, aguacate, pan integral, quinoa) and fiber (garbanzos,
 * boniato). No shrimp anywhere. Portions are cooked weights.
 *
 * The three options in each slot aren't independent fixed recipes - picking one
 * resizes it (and every option in the *next* slot) to fit whatever's left of
 * your daily target. See `buildAdaptiveDay` below for the actual logic.
 */

export const PEOPLE = {
  roberto: { label: 'Tú', targets: { maintain: { kcal: 1900, protein: 185, fat: 60, carbs: 155 }, reduced: { kcal: 1750, protein: 185, fat: 55, carbs: 130 } } },
  esposa: { label: 'Esposa', targets: { fixed: { kcal: 1500, protein: 110, fat: 45, carbs: 165 } } },
}

// Fixed, not resized - a small consistent snack, same idea every day. Its totals
// are subtracted from the day target before the 3 adaptive meals split the rest.
const SNACKS = {
  roberto: {
    maintain: [{ food: 'greek_yogurt_danone_0', grams: 150 }, { food: 'almonds', grams: 25 }],
    reduced: [{ food: 'greek_yogurt_danone_0', grams: 150 }, { food: 'almonds', grams: 15 }],
  },
  esposa: {
    fixed: [{ food: 'greek_yogurt_danone_0', grams: 150 }, { food: 'almonds', grams: 10 }],
  },
}

// How the day's budget (after snack) is split across meals. Breakfast gets a
// fixed share of the "main meals" budget; of what's left, lunch gets its share
// and dinner absorbs the exact remainder (so the day always lands on target,
// no matter which 3 options you end up combining).
const BREAKFAST_SHARE_OF_MAIN = 0.3
const LUNCH_SHARE_OF_REMAINING = 0.6

// A shared "topping" choice for oats-based options - pick whichever side you
// actually have that day (plátano, mantequilla de maní, or almendras). Whichever
// one is picked is added as a flex item, so it scales together with the oats.
export const OATS_TOPPINGS = [
  { key: 'banana', label: 'Plátano', food: 'banana', grams: 70 },
  { key: 'peanut_butter', label: 'Mantequilla de maní', food: 'peanut_butter', grams: 20 },
  { key: 'almonds', label: 'Almendras', food: 'almonds', grams: 15 },
]

// role: 'protein' items are the anchor (scaled to hit the protein budget first,
// since protein is a floor); role: 'flex' items are carb/fat sources (scaled to
// fill whatever kcal room is left). See scaleTemplateToBudget in lib/nutrition.js.
// `toppingOptions` (when present) lets you swap one flex item for an alternative
// - see OATS_TOPPINGS above and how buildAdaptiveDay resolves the chosen one.
export const BREAKFAST_OPTIONS = [
  {
    label: 'Overnight oats proteico',
    note: 'Prepara la noche anterior: avena + yogur + whey en la nevera. Elige el acompañamiento de abajo.',
    items: [
      { food: 'whey_protein_powder', grams: 30, role: 'protein' },
      { food: 'greek_yogurt_danone_0', grams: 150, role: 'protein' },
      { food: 'oats_dry', grams: 45, role: 'flex' },
    ],
    toppingOptions: OATS_TOPPINGS,
  },
  {
    label: 'Tortilla de huevo y claras con aguacate y tostada',
    note: 'Huevo + claras a la plancha, medio aguacate y tomate, tostada integral.',
    items: [
      { food: 'egg_whole', grams: 100, role: 'protein' },
      { food: 'egg_white', grams: 80, role: 'protein' },
      { food: 'wholegrain_bread', grams: 40, role: 'flex' },
      { food: 'avocado', grams: 60, role: 'flex' },
      { food: 'tomato', grams: 80, role: 'flex' },
    ],
  },
  {
    label: 'Bowl de queso fresco batido con frutos rojos',
    note: 'Queso fresco batido + un toque de whey, frutos rojos y almendras por encima.',
    items: [
      { food: 'queso_fresco_batido_0', grams: 200, role: 'protein' },
      { food: 'whey_protein_powder', grams: 15, role: 'protein' },
      { food: 'blueberries', grams: 100, role: 'flex' },
      { food: 'oats_dry', grams: 20, role: 'flex' },
      { food: 'almonds', grams: 15, role: 'flex' },
    ],
  },
  {
    label: 'Arepa (o pan) con huevo y mozzarella',
    note: 'Arepa asada (o pan integral si no tienes harina de maíz) con huevo, clara y mozzarella derretida.',
    items: [
      { food: 'egg_whole', grams: 60, role: 'protein' },
      { food: 'egg_white', grams: 150, role: 'protein' },
      { food: 'mozzarella_cheese', grams: 25, role: 'protein' },
      { food: 'arepa_cooked', grams: 70, role: 'flex' },
    ],
  },
  {
    label: 'Claras revueltas con avena',
    note: 'Claras puras revueltas en sartén + avena aparte (con agua o leche desnatada). Elige el acompañamiento de abajo.',
    items: [
      { food: 'egg_white', grams: 220, role: 'protein' },
      { food: 'oats_dry', grams: 40, role: 'flex' },
    ],
    toppingOptions: OATS_TOPPINGS,
  },
]

export const LUNCH_OPTIONS = [
  {
    label: 'Pollo con arroz y vegetales',
    note: 'El clásico: pechuga a la plancha, arroz blanco, vegetales al vapor con un chorrito de aceite.',
    items: [
      { food: 'chicken_breast_cooked', grams: 180, role: 'protein' },
      { food: 'white_rice_cooked', grams: 150, role: 'flex' },
      { food: 'olive_oil', grams: 10, role: 'flex' },
      { food: 'mixed_vegetables_cooked', grams: 200, role: 'flex' },
    ],
  },
  {
    label: 'Pavo con boniato asado y ensalada',
    note: 'Pechuga de pavo, boniato al horno, ensalada o vegetales variados.',
    items: [
      { food: 'turkey_breast_cooked', grams: 180, role: 'protein' },
      { food: 'sweet_potato_cooked', grams: 170, role: 'flex' },
      { food: 'olive_oil', grams: 10, role: 'flex' },
      { food: 'mixed_vegetables_cooked', grams: 200, role: 'flex' },
    ],
  },
  {
    label: 'Salmón con quinoa y vegetales',
    note: 'Salmón a la plancha u horno (viene con su propia grasa buena, omega-3 extra), quinoa y vegetales.',
    items: [
      { food: 'salmon_cooked', grams: 150, role: 'protein' },
      { food: 'quinoa_cooked', grams: 150, role: 'flex' },
      { food: 'mixed_vegetables_cooked', grams: 200, role: 'flex' },
    ],
  },
  {
    label: 'Pollo con garbanzos y vegetales',
    note: 'Pechuga a la plancha con garbanzos (fibra extra) y vegetales, un chorrito de aceite.',
    items: [
      { food: 'chicken_breast_cooked', grams: 170, role: 'protein' },
      { food: 'chickpeas_cooked', grams: 150, role: 'flex' },
      { food: 'olive_oil', grams: 8, role: 'flex' },
      { food: 'mixed_vegetables_cooked', grams: 200, role: 'flex' },
    ],
  },
]

export const DINNER_OPTIONS = [
  {
    label: 'Huevos revueltos con pollo y boniato',
    note: 'Cena ligera: huevo revuelto con un poco de pollo, boniato y vegetales.',
    items: [
      { food: 'egg_whole', grams: 100, role: 'protein' },
      { food: 'chicken_breast_cooked', grams: 80, role: 'protein' },
      { food: 'sweet_potato_cooked', grams: 90, role: 'flex' },
      { food: 'mixed_vegetables_cooked', grams: 200, role: 'flex' },
    ],
  },
  {
    label: 'Atún con garbanzos y ensalada',
    note: 'Atún al natural, garbanzos, ensalada o vegetales con un toque de aceite.',
    items: [
      { food: 'tuna_canned_water', grams: 150, role: 'protein' },
      { food: 'egg_white', grams: 40, role: 'protein' },
      { food: 'chickpeas_cooked', grams: 120, role: 'flex' },
      { food: 'olive_oil', grams: 6, role: 'flex' },
      { food: 'mixed_vegetables_cooked', grams: 200, role: 'flex' },
    ],
  },
  {
    label: 'Claras con queso fresco y tostada',
    note: 'Claras a la plancha, queso fresco batido, tostada integral y tomate.',
    items: [
      { food: 'egg_white', grams: 150, role: 'protein' },
      { food: 'queso_fresco_batido_0', grams: 100, role: 'protein' },
      { food: 'wholegrain_bread', grams: 30, role: 'flex' },
      { food: 'tomato', grams: 100, role: 'flex' },
      { food: 'mixed_vegetables_cooked', grams: 150, role: 'flex' },
    ],
  },
  {
    label: 'Arepa (o pan) con huevo y mozzarella',
    note: 'Igual que en el desayuno pero en versión cena: arepa asada (o pan integral) con huevo, clara, mozzarella derretida y vegetales al lado.',
    items: [
      { food: 'egg_whole', grams: 50, role: 'protein' },
      { food: 'egg_white', grams: 130, role: 'protein' },
      { food: 'mozzarella_cheese', grams: 20, role: 'protein' },
      { food: 'arepa_cooked', grams: 50, role: 'flex' },
      { food: 'mixed_vegetables_cooked', grams: 150, role: 'flex' },
    ],
  },
]

function scaleBudget(target, factor) {
  return { kcal: target.kcal * factor, protein: target.protein * factor, fat: target.fat * factor, carbs: target.carbs * factor }
}

function subtractTotals(a, b) {
  return { kcal: a.kcal - b.kcal, protein: a.protein - b.protein, fat: a.fat - b.fat, carbs: a.carbs - b.carbs }
}

/** Resolves a template's item list, swapping in the chosen topping (if the
 * template has `toppingOptions`) as an extra flex item - defaults to the first
 * topping so a template with modularity still works with no selection made. */
function resolveTemplateItems(template, toppingKey) {
  if (!template.toppingOptions?.length) return template.items
  const chosen = template.toppingOptions.find((t) => t.key === toppingKey) ?? template.toppingOptions[0]
  return [...template.items, { food: chosen.food, grams: chosen.grams, role: 'flex' }]
}

/**
 * Builds the full adaptive day: breakfast is sized to a fixed share of the
 * day's budget, then lunch is sized from whatever's left, then dinner absorbs
 * the exact remainder - so switching any one option (or its topping) automatically
 * resizes the others and the day still lands on target. Needs computeTotals/
 * scaleTemplateToBudget from lib/nutrition.js (passed in to avoid a circular import).
 */
export function buildAdaptiveDay(personKey, variantKey, selection, { computeTotals, scaleTemplateToBudget }) {
  const target = PEOPLE[personKey]?.targets?.[variantKey]
  const snackItems = SNACKS[personKey]?.[variantKey]
  if (!target || !snackItems) return null

  const snackTotals = computeTotals(snackItems)
  const mainBudget = subtractTotals(target, snackTotals)

  const breakfastTemplate = BREAKFAST_OPTIONS[selection.breakfastIdx] ?? BREAKFAST_OPTIONS[0]
  const breakfastBudget = scaleBudget(mainBudget, BREAKFAST_SHARE_OF_MAIN)
  const breakfastItems = scaleTemplateToBudget(resolveTemplateItems(breakfastTemplate, selection.breakfastTopping), breakfastBudget)
  const breakfastTotals = computeTotals(breakfastItems)

  const afterBreakfast = subtractTotals(mainBudget, breakfastTotals)
  const lunchTemplate = LUNCH_OPTIONS[selection.lunchIdx] ?? LUNCH_OPTIONS[0]
  const lunchBudget = scaleBudget(afterBreakfast, LUNCH_SHARE_OF_REMAINING)
  const lunchItems = scaleTemplateToBudget(resolveTemplateItems(lunchTemplate, selection.lunchTopping), lunchBudget)
  const lunchTotals = computeTotals(lunchItems)

  const dinnerTemplate = DINNER_OPTIONS[selection.dinnerIdx] ?? DINNER_OPTIONS[0]
  const dinnerBudget = subtractTotals(afterBreakfast, lunchTotals)
  const dinnerItems = scaleTemplateToBudget(resolveTemplateItems(dinnerTemplate, selection.dinnerTopping), dinnerBudget)

  return [
    { type: 'Desayuno', note: breakfastTemplate.note, items: breakfastItems },
    { type: 'Almuerzo', note: lunchTemplate.note, items: lunchItems },
    { type: 'Merienda', note: 'Yogur griego + almendras', items: snackItems },
    { type: 'Cena', note: dinnerTemplate.note, items: dinnerItems },
  ]
}

export const SUPPLEMENTS = [
  { name: 'Creatina', dose: '5 g/día', timing: 'Cualquier hora, todos los días (sin fase de carga)' },
  { name: 'Proteína en polvo (whey)', dose: 'Según falte para llegar al objetivo de proteína', timing: 'Desayuno / post-entreno' },
  { name: 'Vitamina D3', dose: '~2000 UI/día', timing: 'Con una comida que tenga grasa' },
  { name: 'Omega-3 (EPA+DHA)', dose: '~2-3 g/día', timing: 'Con una comida' },
]

export const SHOPPING_LIST_WEEKLY = [
  { item: 'Pechuga de pollo', amount: '~1.5-2 kg (según cuántos días eliges pollo)' },
  { item: 'Pechuga de pavo', amount: '~0.8 kg (si eliges pavo en almuerzo)' },
  { item: 'Salmón fresco', amount: '~0.6 kg (si eliges salmón en almuerzo)' },
  { item: 'Atún al natural (lata)', amount: '~4-5 latas (si eliges atún en cena)' },
  { item: 'Huevos', amount: '~14-18 (según opciones elegidas)' },
  { item: 'Claras de huevo (cartón o separadas)', amount: '~1 L (para las opciones con clara)' },
  { item: 'Yogur griego Danone 0%', amount: '~14 unidades de 250 g' },
  { item: 'Queso fresco batido 0%', amount: '~4-5 tarrinas (si eliges esas opciones)' },
  { item: 'Proteína en polvo (whey)', amount: '~350 g (bote)' },
  { item: 'Arroz blanco', amount: '~500 g en crudo' },
  { item: 'Quinoa', amount: '~300 g en crudo (si eliges salmón+quinoa)' },
  { item: 'Boniato', amount: '~1 kg' },
  { item: 'Garbanzos cocidos', amount: '~400 g' },
  { item: 'Avena', amount: '~400 g' },
  { item: 'Pan integral', amount: '1 barra/paquete' },
  { item: 'Harina de maíz precocida (para arepas)', amount: '1 paquete (si eliges esa opción)' },
  { item: 'Queso mozzarella', amount: '1 pieza/bolsa (~200 g, si eliges esa opción)' },
  { item: 'Aguacate', amount: '2-3 unidades' },
  { item: 'Plátano', amount: '7-10 unidades' },
  { item: 'Frutos rojos (congelados vale)', amount: '~700 g' },
  { item: 'Tomate', amount: '~1 kg' },
  { item: 'Almendras', amount: '~250 g' },
  { item: 'Mantequilla de maní (natural, sin azúcar)', amount: '1 tarro (si la eliges como acompañamiento de las oats)' },
  { item: 'Aceite de oliva', amount: '~200 ml' },
  { item: 'Vegetales variados (brócoli, calabacín, pimiento, judía verde, espinaca, coliflor, espárragos)', amount: 'Según elijas, ~3-4 kg combinados' },
]

export const TRIP_GUIDE = {
  title: 'Guía breve para el viaje',
  points: [
    'Prioriza proteína + vegetales en cada comida que puedas elegir; el resto flexible, sin culpa.',
    'Porciones razonables, no restricción extrema - es mantenimiento, no déficit, durante el viaje.',
    'Sin gym: rutina de 20 min con el propio peso (sentadillas, flexiones, zancadas, plancha) + caminar como cardio.',
    'Duerme lo que puedas y mantente hidratado - eso influye más que una comida "fuera del plan".',
    'Vuelve a pesarte/medir cintura el primer día de regreso para retomar el promedio móvil, sin obsesionarte con el número exacto tras viajar.',
  ],
}

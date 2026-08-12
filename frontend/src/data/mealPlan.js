/** 30-day rotating menu for the "Captain America" cut month - built from the
 * user's preferred staples (huevo, pollo, arroz, vegetales, yogur griego Danone,
 * proteína en polvo, overnight oats) plus a few simple Consum-friendly additions
 * (boniato, garbanzos, almendras, aceite de oliva) for variety and fiber.
 * No shrimp anywhere. Portions are cooked weights.
 *
 * Real day-to-day totals will vary slightly (normal in real nutrition, not a bug) -
 * what matters is the weekly average landing near the target, tracked via the
 * 10-day calibration checkpoints (see Settings + Progress dashboard).
 */

export const PEOPLE = {
  roberto: { label: 'Tú', targets: { maintain: { kcal: 1900, protein: 185, fat: 60, carbs: 155 }, reduced: { kcal: 1750, protein: 185, fat: 55, carbs: 130 } } },
  esposa: { label: 'Esposa', targets: { fixed: { kcal: 1500, protein: 110, fat: 45, carbs: 165 } } },
}

/** 7-day rotation: which carb source lunch uses (variety + fiber), and a vegetable
 * suggestion (swap freely - vegetable choice barely moves the macros). */
export const WEEK_TEMPLATE = [
  { day: 1, label: 'Lunes', lunchCarb: 'arroz', vegetable: 'Brócoli y zanahoria' },
  { day: 2, label: 'Martes', lunchCarb: 'boniato', vegetable: 'Judía verde y pimiento' },
  { day: 3, label: 'Miércoles', lunchCarb: 'garbanzos', vegetable: 'Calabacín y espinaca' },
  { day: 4, label: 'Jueves', lunchCarb: 'arroz', vegetable: 'Coliflor y zanahoria' },
  { day: 5, label: 'Viernes', lunchCarb: 'arroz', vegetable: 'Ensalada mixta' },
  { day: 6, label: 'Sábado', lunchCarb: 'boniato', vegetable: 'Espárragos y pimiento' },
  { day: 7, label: 'Domingo', lunchCarb: 'garbanzos', vegetable: 'Lo que haya en la nevera' },
]

const LUNCH_CARB_FOOD = { arroz: 'white_rice_cooked', boniato: 'sweet_potato_cooked', garbanzos: 'chickpeas_cooked' }

/** Fixed portions per person/variant. `lunchCarbGrams` keyed by carb type so
 * the weekly rotation above just plugs into these numbers. */
const PORTIONS = {
  roberto: {
    maintain: {
      breakfast: [{ food: 'oats_dry', grams: 50 }, { food: 'whey_protein_powder', grams: 30 }, { food: 'greek_yogurt_danone_0', grams: 200 }, { food: 'banana', grams: 80 }],
      lunchProtein: [{ food: 'chicken_breast_cooked', grams: 200 }, { food: 'olive_oil', grams: 12 }],
      lunchCarbGrams: { arroz: 150, boniato: 180, garbanzos: 150 },
      lunchVeg: 200,
      snack: [{ food: 'greek_yogurt_danone_0', grams: 150 }, { food: 'almonds', grams: 25 }],
      dinner: [{ food: 'egg_whole', grams: 100 }, { food: 'chicken_breast_cooked', grams: 80 }, { food: 'sweet_potato_cooked', grams: 100 }],
      dinnerVeg: 250,
    },
    reduced: {
      breakfast: [{ food: 'oats_dry', grams: 40 }, { food: 'whey_protein_powder', grams: 30 }, { food: 'greek_yogurt_danone_0', grams: 200 }, { food: 'banana', grams: 60 }],
      lunchProtein: [{ food: 'chicken_breast_cooked', grams: 200 }, { food: 'olive_oil', grams: 10 }],
      lunchCarbGrams: { arroz: 100, boniato: 130, garbanzos: 110 },
      lunchVeg: 200,
      snack: [{ food: 'greek_yogurt_danone_0', grams: 150 }, { food: 'almonds', grams: 15 }],
      dinner: [{ food: 'egg_whole', grams: 100 }, { food: 'chicken_breast_cooked', grams: 80 }, { food: 'sweet_potato_cooked', grams: 70 }],
      dinnerVeg: 250,
    },
  },
  esposa: {
    fixed: {
      breakfast: [{ food: 'oats_dry', grams: 35 }, { food: 'whey_protein_powder', grams: 20 }, { food: 'greek_yogurt_danone_0', grams: 150 }, { food: 'banana', grams: 60 }],
      lunchProtein: [{ food: 'chicken_breast_cooked', grams: 140 }, { food: 'olive_oil', grams: 13 }],
      lunchCarbGrams: { arroz: 150, boniato: 165, garbanzos: 130 },
      lunchVeg: 200,
      snack: [{ food: 'greek_yogurt_danone_0', grams: 150 }, { food: 'almonds', grams: 10 }],
      dinner: [{ food: 'egg_whole', grams: 100 }, { food: 'chicken_breast_cooked', grams: 60 }, { food: 'sweet_potato_cooked', grams: 100 }],
      dinnerVeg: 200,
    },
  },
}

/** Builds the 4 meals for a given person + variant + day-of-week template. */
export function buildMealsForDay(personKey, variantKey, dayTemplate) {
  const p = PORTIONS[personKey]?.[variantKey]
  if (!p) return []
  const lunchCarbFood = LUNCH_CARB_FOOD[dayTemplate.lunchCarb]
  const lunchCarbGrams = p.lunchCarbGrams[dayTemplate.lunchCarb]

  return [
    { type: 'Desayuno', note: 'Overnight oats (prepara la noche anterior)', items: p.breakfast },
    {
      type: 'Comida',
      note: `Pollo con ${dayTemplate.lunchCarb} y ${dayTemplate.vegetable.toLowerCase()}`,
      items: [...p.lunchProtein, { food: lunchCarbFood, grams: lunchCarbGrams }, { food: 'mixed_vegetables_cooked', grams: p.lunchVeg }],
    },
    { type: 'Merienda', note: 'Yogur griego + almendras', items: p.snack },
    {
      type: 'Cena',
      note: `Huevo y pollo con ${dayTemplate.vegetable.toLowerCase()} y boniato`,
      items: [...p.dinner, { food: 'mixed_vegetables_cooked', grams: p.dinnerVeg }],
    },
  ]
}

export const SUPPLEMENTS = [
  { name: 'Creatina', dose: '5 g/día', timing: 'Cualquier hora, todos los días (sin fase de carga)' },
  { name: 'Proteína en polvo (whey)', dose: 'Según falte para llegar al objetivo de proteína', timing: 'Desayuno / post-entreno' },
  { name: 'Vitamina D3', dose: '~2000 UI/día', timing: 'Con una comida que tenga grasa' },
  { name: 'Omega-3 (EPA+DHA)', dose: '~2-3 g/día', timing: 'Con una comida' },
]

export const SHOPPING_LIST_WEEKLY = [
  { item: 'Pechuga de pollo', amount: '~2.5 kg (ambos, 7 días)' },
  { item: 'Huevos', amount: '14 (2/día, ambos)' },
  { item: 'Arroz blanco', amount: '~700 g en crudo (días de arroz)' },
  { item: 'Boniato', amount: '~1.2 kg (días de boniato + cena)' },
  { item: 'Garbanzos cocidos', amount: '~600 g (días de garbanzos)' },
  { item: 'Avena', amount: '~600 g' },
  { item: 'Yogur griego Danone 0%', amount: '~14 unidades de 250 g' },
  { item: 'Proteína en polvo (whey)', amount: '~350 g (bote)' },
  { item: 'Plátano', amount: '14 unidades' },
  { item: 'Almendras', amount: '~250 g' },
  { item: 'Aceite de oliva', amount: '~200 ml' },
  { item: 'Vegetales variados (brócoli, calabacín, pimiento, judía verde, espinaca, coliflor, espárragos)', amount: 'Según lista del día, ~4-5 kg combinados' },
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

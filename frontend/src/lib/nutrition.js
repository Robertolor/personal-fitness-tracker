/** Small food macro database (per 100g, cooked/as-eaten unless noted) and helpers
 * to compute meal/day totals. Keeping macros per-100g (instead of hardcoding kcal
 * per meal) means every total shown in the app is always internally consistent. */

export const FOODS = {
  chicken_breast_cooked: { label: 'Pechuga de pollo (cocida)', kcal: 165, protein: 31, fat: 3.6, carbs: 0 },
  turkey_breast_cooked: { label: 'Pechuga de pavo (cocida)', kcal: 135, protein: 30, fat: 1, carbs: 0 },
  salmon_cooked: { label: 'Salmón (plancha/horno)', kcal: 208, protein: 22, fat: 13, carbs: 0 },
  tuna_canned_water: { label: 'Atún al natural (lata)', kcal: 116, protein: 26, fat: 1, carbs: 0 },
  egg_whole: { label: 'Huevo entero', kcal: 155, protein: 13, fat: 11, carbs: 1.1 },
  egg_white: { label: 'Clara de huevo', kcal: 52, protein: 11, fat: 0.2, carbs: 0.7 },
  white_rice_cooked: { label: 'Arroz blanco (cocido)', kcal: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  quinoa_cooked: { label: 'Quinoa (cocida)', kcal: 120, protein: 4.4, fat: 1.9, carbs: 21 },
  oats_dry: { label: 'Avena (cruda)', kcal: 389, protein: 16.9, fat: 6.9, carbs: 66 },
  // What's actually on the Consum shelf is the regular Danone Griego Natural
  // (not the 0%/high-protein one) - 7g fat and only 3.6g protein per 100g, per
  // the real pack label, not the old (much leaner) placeholder values.
  greek_yogurt_danone_7: { label: 'Yogur griego Danone natural (7% grasa)', kcal: 96, protein: 3.6, fat: 7, carbs: 4.6 },
  queso_fresco_batido_0: { label: 'Queso fresco batido 0%', kcal: 65, protein: 11, fat: 0.2, carbs: 4 },
  whey_protein_powder: { label: 'Proteína en polvo (whey)', kcal: 400, protein: 80, fat: 7, carbs: 8 },
  olive_oil: { label: 'Aceite de oliva', kcal: 884, protein: 0, fat: 100, carbs: 0 },
  mixed_vegetables_cooked: { label: 'Vegetales mixtos (cocidos: brócoli, calabacín, pimiento, judía verde...)', kcal: 35, protein: 2, fat: 0.3, carbs: 7 },
  tomato: { label: 'Tomate', kcal: 18, protein: 0.9, fat: 0.2, carbs: 3.9 },
  avocado: { label: 'Aguacate', kcal: 160, protein: 2, fat: 15, carbs: 9 },
  wholegrain_bread: { label: 'Pan integral', kcal: 247, protein: 10, fat: 3.5, carbs: 41 },
  arepa_cooked: { label: 'Arepa de maíz (cocida/asada)', kcal: 215, protein: 5, fat: 2, carbs: 44 },
  mozzarella_cheese: { label: 'Queso mozzarella', kcal: 280, protein: 24, fat: 21, carbs: 2 },
  banana: { label: 'Plátano', kcal: 89, protein: 1.1, fat: 0.3, carbs: 23 },
  blueberries: { label: 'Frutos rojos', kcal: 57, protein: 0.7, fat: 0.3, carbs: 14 },
  almonds: { label: 'Almendras', kcal: 579, protein: 21, fat: 50, carbs: 22 },
  peanut_butter: { label: 'Mantequilla de maní (natural, sin azúcar)', kcal: 588, protein: 25, fat: 50, carbs: 20 },
  sweet_potato_cooked: { label: 'Boniato (cocido)', kcal: 90, protein: 2, fat: 0.1, carbs: 21 },
  chickpeas_cooked: { label: 'Garbanzos (cocidos)', kcal: 164, protein: 8.9, fat: 2.6, carbs: 27 },
}

/** items: [{ food: 'chicken_breast_cooked', grams: 180 }, ...] */
export function computeTotals(items) {
  return items.reduce(
    (acc, { food, grams }) => {
      const f = FOODS[food]
      if (!f) return acc
      const factor = grams / 100
      return {
        kcal: acc.kcal + f.kcal * factor,
        protein: acc.protein + f.protein * factor,
        fat: acc.fat + f.fat * factor,
        carbs: acc.carbs + f.carbs * factor,
      }
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  )
}

export function round(totals) {
  return {
    kcal: Math.round(totals.kcal),
    protein: Math.round(totals.protein),
    fat: Math.round(totals.fat),
    carbs: Math.round(totals.carbs),
  }
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function roundToNearest5(grams) {
  return Math.max(5, Math.round(grams / 5) * 5)
}

/**
 * Resizes a meal *template* (a list of { food, grams, role }) to fit a macro
 * budget, without changing which foods are in it - just how much of each.
 *
 * Two-factor scaling, protein first:
 *  1. Items tagged role:'protein' (the anchor - chicken/eggs/fish/whey/etc.) are
 *     scaled together so their combined protein hits `budget.protein` as closely
 *     as possible. Protein is the floor that shouldn't get cut (see coaching rule).
 *  2. Items tagged role:'flex' (carb/fat sources - rice, boniato, oil, veg...) are
 *     scaled together to fill whatever kcal room is left after the protein items,
 *     so `budget.kcal` is hit almost exactly - carbs/fat are the flexible levers.
 *
 * This is what makes the menu "adaptive": pick a different option (or a different
 * person/variant/target) and every gram number recalculates automatically.
 */
export function scaleTemplateToBudget(items, budget) {
  const proteinItems = items.filter((i) => i.role === 'protein')
  const flexItems = items.filter((i) => i.role !== 'protein')

  const proteinRef = computeTotals(proteinItems)
  const scaleProtein = proteinRef.protein > 0 ? clamp(budget.protein / proteinRef.protein, 0.5, 2.0) : 1
  const scaledProtein = proteinItems.map((i) => ({ ...i, grams: roundToNearest5(i.grams * scaleProtein) }))
  const proteinActual = computeTotals(scaledProtein)

  const flexRef = computeTotals(flexItems)
  const flexKcalBudget = Math.max(budget.kcal - proteinActual.kcal, flexRef.kcal * 0.15)
  const scaleFlex = flexRef.kcal > 0 ? clamp(flexKcalBudget / flexRef.kcal, 0.15, 1.8) : 1
  const scaledFlex = flexItems.map((i) => ({ ...i, grams: roundToNearest5(i.grams * scaleFlex) }))

  return [...scaledProtein, ...scaledFlex]
}

export function sumMeals(meals) {
  return round(
    meals.reduce(
      (acc, meal) => {
        const t = computeTotals(meal.items)
        return {
          kcal: acc.kcal + t.kcal,
          protein: acc.protein + t.protein,
          fat: acc.fat + t.fat,
          carbs: acc.carbs + t.carbs,
        }
      },
      { kcal: 0, protein: 0, fat: 0, carbs: 0 }
    )
  )
}

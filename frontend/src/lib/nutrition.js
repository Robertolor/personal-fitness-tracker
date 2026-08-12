/** Small food macro database (per 100g, cooked/as-eaten unless noted) and helpers
 * to compute meal/day totals. Keeping macros per-100g (instead of hardcoding kcal
 * per meal) means every total shown in the app is always internally consistent. */

export const FOODS = {
  chicken_breast_cooked: { label: 'Pechuga de pollo (cocida)', kcal: 165, protein: 31, fat: 3.6, carbs: 0 },
  white_rice_cooked: { label: 'Arroz blanco (cocido)', kcal: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  egg_whole: { label: 'Huevo entero', kcal: 155, protein: 13, fat: 11, carbs: 1.1 },
  oats_dry: { label: 'Avena (cruda)', kcal: 389, protein: 16.9, fat: 6.9, carbs: 66 },
  greek_yogurt_danone_0: { label: 'Yogur griego Danone 0%', kcal: 57, protein: 10, fat: 0.2, carbs: 3.6 },
  whey_protein_powder: { label: 'Proteína en polvo (whey)', kcal: 400, protein: 80, fat: 7, carbs: 8 },
  olive_oil: { label: 'Aceite de oliva', kcal: 884, protein: 0, fat: 100, carbs: 0 },
  mixed_vegetables_cooked: { label: 'Vegetales mixtos (cocidos: brócoli, calabacín, pimiento, judía verde...)', kcal: 35, protein: 2, fat: 0.3, carbs: 7 },
  banana: { label: 'Plátano', kcal: 89, protein: 1.1, fat: 0.3, carbs: 23 },
  almonds: { label: 'Almendras', kcal: 579, protein: 21, fat: 50, carbs: 22 },
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

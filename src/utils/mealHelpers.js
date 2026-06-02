'use strict';

/**
 * Compute totalCalories/Protein/Carbs/Fat/Fiber from foods array.
 * Mirrors the Mongoose pre-save hook on the Meal model.
 */
function computeMealTotals(foods = []) {
  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;

  for (const f of foods) {
    const q = f.quantity || 1;
    totalCalories += (f.calories || 0) * q;
    totalProtein  += (f.protein  || 0) * q;
    totalCarbs    += (f.carbs    || 0) * q;
    totalFat      += (f.fat      || 0) * q;
    totalFiber    += (f.fiber    || 0) * q;
  }

  const round = (n) => Math.round(n * 10) / 10;
  return {
    totalCalories: round(totalCalories),
    totalProtein:  round(totalProtein),
    totalCarbs:    round(totalCarbs),
    totalFat:      round(totalFat),
    totalFiber:    round(totalFiber),
  };
}

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snack',
  night:     'Night Snack',
};

function defaultMealName(mealType) {
  return MEAL_LABELS[mealType] || mealType;
}

module.exports = { computeMealTotals, defaultMealName };

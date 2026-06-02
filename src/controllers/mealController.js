'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const { computeMealTotals, defaultMealName }     = require('../utils/mealHelpers');
const prisma = require('../config/prisma');

function buildMealData(body, userId) {
  const foods  = body.foods || [];
  const totals = computeMealTotals(foods);
  return {
    userId,
    mealType:       body.mealType,
    name:           body.name || defaultMealName(body.mealType),
    foods,
    mealTime:       body.mealTime       || '08:00',
    date:           body.date           || new Date().toISOString().split('T')[0],
    notes:          body.notes          || '',
    reminderEnabled: body.reminderEnabled || false,
    ...totals,
  };
}

/** POST /api/meals */
const createMeal = async (req, res, next) => {
  try {
    const meal = await prisma.meal.create({ data: buildMealData(req.body, req.user.id) });
    return sendSuccess(res, 201, 'Meal logged', meal);
  } catch (error) { next(error); }
};

/** GET /api/meals */
const getMeals = async (req, res, next) => {
  try {
    const { date, mealType, page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const where = { userId: req.user.id };
    if (date)     where.date     = date;
    if (mealType) where.mealType = mealType;

    const [meals, total] = await Promise.all([
      prisma.meal.findMany({ where, orderBy: [{ date: 'desc' }, { mealTime: 'asc' }], skip, take: Number(limit) }),
      prisma.meal.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Meals fetched', meals,
      paginationMeta({ total, page: Number(page), limit: Number(limit) }));
  } catch (error) { next(error); }
};

/** GET /api/meals/:id */
const getMeal = async (req, res, next) => {
  try {
    const meal = await prisma.meal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!meal) return sendError(res, 404, 'Meal not found');
    return sendSuccess(res, 200, 'Meal fetched', meal);
  } catch (error) { next(error); }
};

/** PUT /api/meals/:id */
const updateMeal = async (req, res, next) => {
  try {
    const existing = await prisma.meal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return sendError(res, 404, 'Meal not found');

    const merged = { ...existing, ...req.body };
    const foods  = merged.foods || [];
    const totals = computeMealTotals(foods);
    const name   = merged.name || defaultMealName(merged.mealType);

    const meal = await prisma.meal.update({
      where: { id: req.params.id },
      data:  { ...req.body, foods, name, ...totals },
    });
    return sendSuccess(res, 200, 'Meal updated', meal);
  } catch (error) { next(error); }
};

/** DELETE /api/meals/:id */
const deleteMeal = async (req, res, next) => {
  try {
    const existing = await prisma.meal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return sendError(res, 404, 'Meal not found');
    await prisma.meal.delete({ where: { id: req.params.id } });
    return sendSuccess(res, 200, 'Meal deleted');
  } catch (error) { next(error); }
};

/** GET /api/meals/summary */
const getDailySummary = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const meals = await prisma.meal.findMany({ where: { userId: req.user.id, date } });

    const byType = {};
    for (const m of meals) {
      if (!byType[m.mealType]) {
        byType[m.mealType] = { _id: m.mealType, calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
      }
      byType[m.mealType].calories += m.totalCalories;
      byType[m.mealType].protein  += m.totalProtein;
      byType[m.mealType].carbs    += m.totalCarbs;
      byType[m.mealType].fat      += m.totalFat;
      byType[m.mealType].count    += 1;
    }

    return sendSuccess(res, 200, 'Daily meal summary', { date, meals: Object.values(byType) });
  } catch (error) { next(error); }
};

module.exports = { createMeal, getMeals, getMeal, updateMeal, deleteMeal, getDailySummary };

'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const Meal = require('../models/Meal');

/**
 * POST /api/meals
 */
const createMeal = async (req, res, next) => {
  try {
    const meal = await Meal.create({ ...req.body, userId: req.user._id });
    return sendSuccess(res, 201, 'Meal logged', meal);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/meals?date=YYYY-MM-DD&mealType=breakfast&page=1&limit=20
 */
const getMeals = async (req, res, next) => {
  try {
    const { date, mealType, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { userId: req.user._id };
    if (date)     filter.date     = date;
    if (mealType) filter.mealType = mealType;

    const [meals, total] = await Promise.all([
      Meal.find(filter).sort({ date: -1, mealTime: 1 }).skip(skip).limit(Number(limit)),
      Meal.countDocuments(filter),
    ]);

    return sendSuccess(
      res, 200, 'Meals fetched', meals,
      paginationMeta({ total, page: Number(page), limit: Number(limit) })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/meals/:id
 */
const getMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!meal) return sendError(res, 404, 'Meal not found');
    return sendSuccess(res, 200, 'Meal fetched', meal);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/meals/:id
 */
const updateMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!meal) return sendError(res, 404, 'Meal not found');

    Object.assign(meal, req.body);
    await meal.save();   // triggers pre-save totals recalculation

    return sendSuccess(res, 200, 'Meal updated', meal);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/meals/:id
 */
const deleteMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!meal) return sendError(res, 404, 'Meal not found');
    return sendSuccess(res, 200, 'Meal deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/meals/summary?date=YYYY-MM-DD
 * Returns per-meal-type totals for a given day.
 */
const getDailySummary = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const summary = await Meal.aggregate([
      { $match: { userId: req.user._id, date } },
      {
        $group: {
          _id:      '$mealType',
          calories: { $sum: '$totalCalories' },
          protein:  { $sum: '$totalProtein' },
          carbs:    { $sum: '$totalCarbs' },
          fat:      { $sum: '$totalFat' },
          count:    { $sum: 1 },
        },
      },
    ]);

    return sendSuccess(res, 200, 'Daily meal summary', { date, meals: summary });
  } catch (error) {
    next(error);
  }
};

module.exports = { createMeal, getMeals, getMeal, updateMeal, deleteMeal, getDailySummary };

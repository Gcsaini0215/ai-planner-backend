'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const { toSafeUser, calcCalorieGoal } = require('../utils/userHelpers');
const prisma = require('../config/prisma');

/**
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Profile fetched', toSafeUser(req.user));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const VALID_ROLES    = ['user', 'coach', 'dietitian', 'trainer'];
    const allowedFields = [
      'name', 'email', 'age', 'gender', 'height', 'weight',
      'targetWeight', 'goal', 'activityLevel', 'caloriesGoal',
      'waterGoal', 'profileImage', 'role',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    // Validate role slug if provided
    if (updates.role && !VALID_ROLES.includes(updates.role)) {
      return sendError(res, 400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const merged = { ...req.user, ...updates };

    if (!updates.caloriesGoal) {
      updates.caloriesGoal = calcCalorieGoal({
        weight:        merged.weight,
        height:        merged.height,
        age:           merged.age,
        gender:        merged.gender,
        activityLevel: merged.activityLevel,
        goal:          merged.goal,
      });
    }

    const core = ['name', 'age', 'gender', 'height', 'weight', 'goal', 'activityLevel'];
    updates.isProfileComplete = core.every(
      (f) => merged[f] !== undefined && merged[f] !== null && merged[f] !== ''
    );

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data:  updates,
    });

    return sendSuccess(res, 200, 'Profile updated', toSafeUser(updated));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const user  = req.user;
    const today = new Date().toISOString().split('T')[0];

    const [mealsToday, waterLogs, workoutsToday] = await Promise.all([
      prisma.meal.findMany({ where: { userId: user.id, date: today } }),
      prisma.waterLog.findMany({ where: { userId: user.id, date: today } }),
      prisma.workoutLog.findMany({ where: { userId: user.id, date: today } }),
    ]);

    const caloriesConsumed = mealsToday.reduce((s, m) => s + m.totalCalories, 0);
    const macros = mealsToday.reduce(
      (acc, m) => ({
        protein: acc.protein + m.totalProtein,
        carbs:   acc.carbs   + m.totalCarbs,
        fat:     acc.fat     + m.totalFat,
      }),
      { protein: 0, carbs: 0, fat: 0 }
    );

    const waterConsumed  = waterLogs.reduce((s, l) => s + l.amount, 0);
    const caloriesBurned = workoutsToday.reduce((s, w) => s + w.caloriesBurned, 0);
    const netCalories    = Math.round(caloriesConsumed - caloriesBurned);

    const bmiHeight = user.height;
    const bmiWeight = user.weight;
    const bmi = (bmiHeight && bmiWeight)
      ? parseFloat((bmiWeight / Math.pow(bmiHeight / 100, 2)).toFixed(1))
      : null;

    return sendSuccess(res, 200, 'Dashboard data fetched', {
      date: today,
      calories: {
        goal:      user.caloriesGoal,
        consumed:  Math.round(caloriesConsumed),
        burned:    Math.round(caloriesBurned),
        net:       netCalories,
        remaining: Math.max(0, user.caloriesGoal - netCalories),
        progress:  Math.min(100, Math.round((caloriesConsumed / user.caloriesGoal) * 100)),
      },
      water: {
        goal:      user.waterGoal,
        consumed:  waterConsumed,
        remaining: Math.max(0, user.waterGoal - waterConsumed),
        progress:  Math.min(100, Math.round((waterConsumed / user.waterGoal) * 100)),
      },
      macros: {
        protein: Math.round(macros.protein),
        carbs:   Math.round(macros.carbs),
        fat:     Math.round(macros.fat),
      },
      meals:    mealsToday.length,
      workouts: workoutsToday.length,
      profile:  { name: user.name, weight: user.weight, goal: user.goal, bmi },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getDashboard };

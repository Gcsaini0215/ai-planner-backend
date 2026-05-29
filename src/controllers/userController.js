'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const User        = require('../models/User');
const Meal        = require('../models/Meal');
const WaterLog    = require('../models/WaterLog');
const WorkoutLog  = require('../models/WorkoutLog');

/**
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Profile fetched', req.user.toSafeJSON());
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'email', 'age', 'gender', 'height', 'weight',
      'targetWeight', 'goal', 'activityLevel', 'caloriesGoal',
      'waterGoal', 'profileImage',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    // Auto-calculate calorie goal when biometrics change
    const user = req.user;
    const merged = { ...user.toObject(), ...updates };

    if (!updates.caloriesGoal) {
      updates.caloriesGoal = User.calcCalorieGoal({
        weight:        merged.weight,
        height:        merged.height,
        age:           merged.age,
        gender:        merged.gender,
        activityLevel: merged.activityLevel,
        goal:          merged.goal,
      });
    }

    // Mark profile complete when all 7 core fields are present and non-empty
    const core = ['name', 'age', 'gender', 'height', 'weight', 'goal', 'activityLevel'];
    updates.isProfileComplete = core.every(
      (f) => merged[f] !== undefined && merged[f] !== null && merged[f] !== ''
    );

    const updated = await User.findByIdAndUpdate(user._id, updates, {
      new:       true,
      runValidators: true,
    }).select('-firebaseUid');

    return sendSuccess(res, 200, 'Profile updated', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/dashboard
 * Aggregated daily stats for the authenticated user.
 */
const getDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    const today = new Date().toISOString().split('T')[0];

    // Run all aggregations in parallel
    const [mealsToday, waterToday, workoutsToday] = await Promise.all([
      Meal.find({ userId: user._id, date: today }),
      WaterLog.aggregate([
        { $match: { userId: user._id, date: today } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      WorkoutLog.find({ userId: user._id, date: today }),
    ]);

    // Calorie totals
    const caloriesConsumed = mealsToday.reduce((s, m) => s + m.totalCalories, 0);
    const macros = mealsToday.reduce(
      (acc, m) => ({
        protein: acc.protein + m.totalProtein,
        carbs:   acc.carbs   + m.totalCarbs,
        fat:     acc.fat     + m.totalFat,
      }),
      { protein: 0, carbs: 0, fat: 0 }
    );

    const waterConsumed    = waterToday[0]?.total ?? 0;
    const caloriesBurned   = workoutsToday.reduce((s, w) => s + w.caloriesBurned, 0);
    const netCalories      = Math.round(caloriesConsumed - caloriesBurned);

    const dashboard = {
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
      profile:  {
        name:   user.name,
        weight: user.weight,
        goal:   user.goal,
        bmi:    user.bmi,
      },
    };

    return sendSuccess(res, 200, 'Dashboard data fetched', dashboard);
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getDashboard };

'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const { toSafeUser, calcCalorieGoal } = require('../utils/userHelpers');
const prisma = require('../config/prisma');

const USER_INCLUDE = { userProfile: true, roleRef: true };

// ── GET /api/users/profile ────────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.user.id },
      include: USER_INCLUDE,
    });
    return sendSuccess(res, 200, 'Profile fetched', toSafeUser(user));
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const body   = req.body;

    // ── 1. Resolve role from roleId (UUID) or role slug ───────────────────────
    let roleUpdate = {};
    if (body.roleId || body.role) {
      let roleRow = null;
      if (body.roleId) roleRow = await prisma.role.findUnique({ where: { id: body.roleId } });
      if (!roleRow && body.role) roleRow = await prisma.role.findUnique({ where: { slug: body.role } });
      if (roleRow) roleUpdate = { roleId: roleRow.id, role: roleRow.slug };
    }

    // ── 2. Fields that live on the User table ─────────────────────────────────
    const userFields = {};
    if (body.name  !== undefined) userFields.name  = body.name;
    if (body.email !== undefined) userFields.email = body.email;
    if (body.phone !== undefined) userFields.phone = body.phone;
    Object.assign(userFields, roleUpdate);

    // ── 3. Fields that live on the UserProfile table ──────────────────────────
    const profileFields = {};
    for (const key of ['age','gender','height','weight','targetWeight',
                        'goal','activityLevel','caloriesGoal','waterGoal','profileImage']) {
      if (body[key] !== undefined) profileFields[key] = body[key];
    }

    // Auto-compute caloriesGoal when not explicitly set
    if (!profileFields.caloriesGoal) {
      const base   = req.user.userProfile ?? {};
      const merged = { ...base, ...profileFields };
      const cal    = calcCalorieGoal({
        weight: merged.weight, height: merged.height, age: merged.age,
        gender: merged.gender, activityLevel: merged.activityLevel, goal: merged.goal,
      });
      if (cal !== 2000) profileFields.caloriesGoal = cal;
    }

    // ── 4. Compute isProfileComplete per role ─────────────────────────────────
    const role    = roleUpdate.role ?? req.user.roleRef?.slug ?? req.user.role ?? 'user';
    const isCoach = ['coach', 'trainer', 'dietitian'].includes(role);
    const base    = req.user.userProfile ?? {};
    const merged  = { ...base, ...profileFields };

    profileFields.isProfileComplete = isCoach
      // Coaches: complete as soon as name + email exist
      ? (userFields.name ?? req.user.name ?? '').trim() !== '' &&
        (userFields.email ?? req.user.email ?? '').trim() !== ''
      // Users: need full health profile
      : ['age','gender','height','weight','goal','activityLevel'].every(
          (f) => merged[f] !== undefined && merged[f] !== null && merged[f] !== ''
        );

    // ── 5. Upsert UserProfile + update User in one transaction ────────────────
    const [, user] = await prisma.$transaction([
      prisma.userProfile.upsert({
        where:  { userId },
        update: profileFields,
        create: { userId, ...profileFields },
      }),
      prisma.user.update({
        where:   { id: userId },
        data:    userFields,
        include: USER_INCLUDE,
      }),
    ]);

    return sendSuccess(res, 200, 'Profile updated', toSafeUser(user));
  } catch (error) {
    next(error);
  }
};

// ── GET /api/users/dashboard ──────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  try {
    const user  = req.user;
    const prof  = user.userProfile ?? {};
    const today = new Date().toISOString().split('T')[0];

    const [mealsToday, waterLogs, workoutsToday] = await Promise.all([
      prisma.meal.findMany({ where: { userId: user.id, date: today } }),
      prisma.waterLog.findMany({ where: { userId: user.id, date: today } }),
      prisma.workoutLog.findMany({ where: { userId: user.id, date: today } }),
    ]);

    const caloriesConsumed = mealsToday.reduce((s, m) => s + m.totalCalories, 0);
    const macros = mealsToday.reduce(
      (acc, m) => ({ protein: acc.protein + m.totalProtein, carbs: acc.carbs + m.totalCarbs, fat: acc.fat + m.totalFat }),
      { protein: 0, carbs: 0, fat: 0 }
    );
    const waterConsumed  = waterLogs.reduce((s, l) => s + l.amount, 0);
    const caloriesBurned = workoutsToday.reduce((s, w) => s + w.caloriesBurned, 0);
    const netCalories    = Math.round(caloriesConsumed - caloriesBurned);
    const caloriesGoal   = prof.caloriesGoal ?? 2000;
    const waterGoal      = prof.waterGoal    ?? 2500;
    const bmi = (prof.height && prof.weight)
      ? parseFloat((prof.weight / Math.pow(prof.height / 100, 2)).toFixed(1)) : null;

    return sendSuccess(res, 200, 'Dashboard data fetched', {
      date: today,
      calories: {
        goal: caloriesGoal, consumed: Math.round(caloriesConsumed),
        burned: Math.round(caloriesBurned), net: netCalories,
        remaining: Math.max(0, caloriesGoal - netCalories),
        progress:  Math.min(100, Math.round((caloriesConsumed / caloriesGoal) * 100)),
      },
      water: {
        goal: waterGoal, consumed: waterConsumed,
        remaining: Math.max(0, waterGoal - waterConsumed),
        progress:  Math.min(100, Math.round((waterConsumed / waterGoal) * 100)),
      },
      macros: { protein: Math.round(macros.protein), carbs: Math.round(macros.carbs), fat: Math.round(macros.fat) },
      meals: mealsToday.length, workouts: workoutsToday.length,
      profile: { name: user.name, weight: prof.weight, goal: prof.goal, bmi },
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/users/account ─────────────────────────────────────────────────
// 1. Archive user data to DeletedUser table (audit trail).
// 2. Hard-delete the User row — all cascading rows go with it.
// 3. Phone number is released and immediately available for new registrations.
const deleteAccount = async (req, res, next) => {
  const user = req.user;

  try {
    await prisma.$transaction(async (tx) => {
      // ── Step 1: Archive basic identity before any deletion ──────────────────
      const role = user.roleRef?.slug ?? user.role ?? 'user';

      await tx.deletedUser.create({
        data: {
          originalUserId: user.id,
          name:           user.name           ?? '',
          email:          user.email          ?? '',
          phone:          user.phone,
          role,
          registeredAt:   user.createdAt      ?? null,
          lastLoginAt:    user.lastLoginAt     ?? null,
          deletionReason: req.body.reason      ?? '',
          deletedBy:      'self',
          metadata: {
            isVerifiedCoach:   user.isVerifiedCoach   ?? false,
            isProfileComplete: user.userProfile?.isProfileComplete ?? false,
          },
        },
      });

      // ── Step 2: Hard-delete User (cascades to UserProfile, meals, etc.) ─────
      await tx.user.delete({ where: { id: user.id } });
    });

    return sendSuccess(res, 200, 'Account deleted successfully. Your data has been archived for compliance.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getDashboard, deleteAccount };

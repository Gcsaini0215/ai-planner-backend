'use strict';

/**
 * Merge User + UserProfile + roleRef into the flat shape Flutter expects.
 * Strips firebaseUid and internal Prisma relation objects.
 */
function toSafeUser(user) {
  if (!user) return null;

  const { firebaseUid, roleRef, userProfile, ...base } = user;
  const prof = userProfile ?? {};

  const safe = {
    // ── Identity (User table) ─────────────────────────────────────────────────
    id:              base.id,
    phone:           base.phone,
    name:            base.name            ?? '',
    email:           base.email           ?? '',
    isActive:        base.isActive        ?? true,
    isVerifiedCoach: base.isVerifiedCoach ?? false,
    lastLoginAt:     base.lastLoginAt     ?? null,
    createdAt:       base.createdAt,
    updatedAt:       base.updatedAt,

    // ── Role — prefer FK relation slug, fall back to enum ─────────────────────
    role:   roleRef?.slug ?? base.role ?? 'user',
    roleId: base.roleId   ?? null,

    // ── Health / fitness (UserProfile table) ──────────────────────────────────
    age:               prof.age              ?? null,
    gender:            prof.gender           ?? null,
    height:            prof.height           ?? null,
    weight:            prof.weight           ?? null,
    targetWeight:      prof.targetWeight     ?? null,
    goal:              prof.goal             ?? null,
    activityLevel:     prof.activityLevel    ?? null,
    caloriesGoal:      prof.caloriesGoal     ?? 2000,
    waterGoal:         prof.waterGoal        ?? 2500,
    profileImage:      prof.profileImage     ?? '',
    // avatarId: Flutter stores the local avatar asset ID in profileImage field
    avatarId:          prof.profileImage     ?? '',
    isProfileComplete: prof.isProfileComplete ?? false,
  };

  // Computed BMI
  safe.bmi = (safe.height && safe.weight)
    ? parseFloat((safe.weight / Math.pow(safe.height / 100, 2)).toFixed(1))
    : null;

  return safe;
}

/**
 * Mifflin-St Jeor TDEE → daily calorie goal.
 */
function calcCalorieGoal({ weight, height, age, gender, activityLevel, goal }) {
  if (!weight || !height || !age || !gender) return 2000;

  const bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const multipliers = {
    sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55,
    very_active: 1.725, extra_active: 1.9,
  };

  let tdee = bmr * (multipliers[activityLevel] || 1.55);
  if (goal === 'lose_weight') tdee -= 500;
  if (goal === 'gain_muscle') tdee += 300;
  return Math.round(tdee);
}

module.exports = { toSafeUser, calcCalorieGoal };

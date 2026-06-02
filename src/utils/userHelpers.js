'use strict';

/**
 * Strip firebaseUid, add computed bmi, and ensure role fields are always
 * present so Flutter can route to the correct dashboard on login.
 */
function toSafeUser(user) {
  if (!user) return null;
  const { firebaseUid, ...safe } = user;

  // Always expose role fields (defaults for rows created before migration)
  safe.role            = safe.role            ?? 'user';
  safe.isVerifiedCoach = safe.isVerifiedCoach ?? false;

  if (safe.height && safe.weight) {
    const hm = safe.height / 100;
    safe.bmi = parseFloat((safe.weight / (hm * hm)).toFixed(1));
  } else {
    safe.bmi = null;
  }
  return safe;
}

/**
 * Mifflin-St Jeor TDEE → daily calorie goal.
 */
function calcCalorieGoal({ weight, height, age, gender, activityLevel, goal }) {
  if (!weight || !height || !age || !gender) return 2000;

  let bmr =
    gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const multipliers = {
    sedentary:         1.2,
    lightly_active:    1.375,
    moderately_active: 1.55,
    very_active:       1.725,
    extra_active:      1.9,
  };

  let tdee = bmr * (multipliers[activityLevel] || 1.55);

  if (goal === 'lose_weight') tdee -= 500;
  if (goal === 'gain_muscle') tdee += 300;

  return Math.round(tdee);
}

module.exports = { toSafeUser, calcCalorieGoal };

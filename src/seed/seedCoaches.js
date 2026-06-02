'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const prisma = require('../config/prisma');

const COACHES = [
  {
    user: {
      firebaseUid: 'dummy_coach_uid_001',
      phone:       '+910000000001',
      name:        'Priya Sharma',
      email:       'priya.sharma@nutritrack.coach',
      age:         32,
      gender:      'female',
      height:      165,
      weight:      58,
      isProfileComplete: true,
    },
    profile: {
      role:           'dietitian',
      displayName:    'Priya Sharma',
      tagline:        'Transform your body through mindful nutrition 🥗',
      bio:            'Certified Dietitian with 8+ years helping clients achieve lasting weight loss and improved energy levels. Specialising in Indian dietary patterns, PCOS management, and sustainable fat loss.',
      profilePhoto:   'https://randomuser.me/api/portraits/women/44.jpg',
      specializations:['Weight Loss', 'PCOS Nutrition', 'Indian Diet Plans', 'Diabetes Management'],
      languages:      ['English', 'Hindi', 'Punjabi'],
      experience:     8,
      clientsServed:  340,
      isVerified:     true,
      status:         'approved',
      avgRating:      4.8,
      reviewCount:    127,
      followerCount:  892,
      plansSold:      215,
      goals:          ['weight_loss', 'maintenance', 'general'],
      pricing: { consultationPerHour: 29, dietPlanMonthly: 49, workoutMonthly: 39, premiumMonthly: 79, currency: 'INR' },
      certifications: [
        { title: 'Registered Dietitian Nutritionist (RDN)', issuer: 'Academy of Nutrition and Dietetics', year: 2016 },
        { title: 'Certified Diabetes Educator (CDE)', issuer: 'NCBDE', year: 2019 },
      ],
      availability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isBooked: false },
        { dayOfWeek: 3, startTime: '10:00', endTime: '16:00', isBooked: false },
        { dayOfWeek: 5, startTime: '09:00', endTime: '14:00', isBooked: false },
      ],
      socialLinks: { instagram: 'priya_nutrition', youtube: '', twitter: '', website: '' },
    },
    plans: [
      {
        type: 'diet', title: '30-Day Indian Weight Loss Plan',
        description: 'A comprehensive 30-day meal plan tailored for Indian dietary preferences.',
        difficulty: 'beginner', goal: 'weight_loss', durationDays: 30,
        price: 49, isFree: false, isPublished: true, purchaseCount: 87, avgRating: 4.9,
        tags: ['Indian Food', 'Weight Loss', 'Vegetarian Options'],
      },
      {
        type: 'consultation_package', title: '4-Session Nutrition Consultation',
        description: 'Four 1-hour personalised nutrition consultations over a month.',
        difficulty: 'beginner', goal: 'general', durationDays: 30,
        price: 99, isFree: false, isPublished: true, purchaseCount: 42, avgRating: 5.0,
        sessionsIncluded: 4, sessionDurationMins: 60,
        tags: ['1-on-1', 'Personalised', 'Full Support'],
      },
    ],
  },
  {
    user: {
      firebaseUid: 'dummy_coach_uid_002',
      phone:       '+910000000002',
      name:        'Arjun Mehta',
      email:       'arjun.mehta@nutritrack.coach',
      age:         29, gender: 'male', height: 178, weight: 80, isProfileComplete: true,
    },
    profile: {
      role: 'trainer', displayName: 'Arjun Mehta',
      tagline: 'Build strength. Build confidence. Build the best version of you 💪',
      bio: 'Elite strength & conditioning coach with 6 years of experience.',
      profilePhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
      specializations: ['Strength Training', 'Hypertrophy', 'Fat Loss', 'Home Workouts'],
      languages: ['English', 'Hindi'], experience: 6, clientsServed: 210,
      isVerified: true, status: 'approved', avgRating: 4.7, reviewCount: 98,
      followerCount: 1240, plansSold: 178,
      goals: ['muscle_gain', 'weight_loss', 'endurance'],
      pricing: { consultationPerHour: 25, dietPlanMonthly: 35, workoutMonthly: 45, premiumMonthly: 69, currency: 'USD' },
      certifications: [
        { title: 'CSCS', issuer: 'NSCA', year: 2018 },
        { title: 'CPT', issuer: 'ACE', year: 2017 },
      ],
      availability: [
        { dayOfWeek: 2, startTime: '06:00', endTime: '12:00', isBooked: false },
        { dayOfWeek: 4, startTime: '06:00', endTime: '12:00', isBooked: false },
      ],
      socialLinks: { instagram: 'arjun_lifts', youtube: 'ArjunMehtaFitness', twitter: '', website: '' },
    },
    plans: [
      {
        type: 'workout', title: '12-Week Home Muscle Building Program',
        description: 'Progressive bodyweight + dumbbell program to build real muscle at home.',
        difficulty: 'intermediate', goal: 'muscle_gain', durationDays: 84,
        price: 59, isFree: false, isPublished: true, purchaseCount: 112, avgRating: 4.8,
        tags: ['Home Workout', 'Muscle Gain', 'Dumbbells'],
      },
      {
        type: 'workout', title: 'Beginner Fat Burn — 4 Week Starter',
        description: '4 weeks of structured cardio and strength training, 30 minutes a day.',
        difficulty: 'beginner', goal: 'weight_loss', durationDays: 28,
        price: 0, isFree: true, isPublished: true, purchaseCount: 234, avgRating: 4.6,
        tags: ['Beginner', 'Fat Burn', 'Free', 'No Equipment'],
      },
    ],
  },
  {
    user: {
      firebaseUid: 'dummy_coach_uid_003',
      phone:       '+910000000003',
      name:        'Meera Nair',
      email:       'meera.nair@nutritrack.coach',
      age:         36, gender: 'female', height: 162, weight: 55, isProfileComplete: true,
    },
    profile: {
      role: 'coach', displayName: 'Meera Nair',
      tagline: 'Holistic wellness — mind, body & soul 🧘‍♀️',
      bio: 'Certified Holistic Health Coach and 500-hr Yoga Teacher.',
      profilePhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
      specializations: ['Yoga', 'Stress & Hormonal Balance', 'Mindful Eating'],
      languages: ['English', 'Hindi', 'Malayalam'], experience: 10, clientsServed: 520,
      isVerified: true, status: 'approved', avgRating: 4.9, reviewCount: 203,
      followerCount: 2150, plansSold: 310,
      goals: ['maintenance', 'yoga', 'general'],
      pricing: { consultationPerHour: 35, dietPlanMonthly: 45, workoutMonthly: 40, premiumMonthly: 89, currency: 'USD' },
      certifications: [
        { title: 'RYT-500', issuer: 'Yoga Alliance', year: 2015 },
        { title: 'CHWC', issuer: 'Wellcoaches', year: 2017 },
      ],
      availability: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '11:00', isBooked: false },
        { dayOfWeek: 3, startTime: '07:00', endTime: '11:00', isBooked: false },
      ],
      socialLinks: { instagram: 'meera_wellness', youtube: 'MeeraNairYoga', twitter: '', website: 'meeranair.com' },
    },
    plans: [
      {
        type: 'combo', title: '21-Day Mind & Body Reset',
        description: 'Yoga flows, guided meditation, a clean-eating meal plan, and journaling prompts.',
        difficulty: 'beginner', goal: 'maintenance', durationDays: 21,
        price: 69, isFree: false, isPublished: true, purchaseCount: 156, avgRating: 5.0,
        tags: ['Yoga', 'Meditation', 'Clean Eating', 'Stress Relief'],
      },
    ],
  },
];

async function seedCoaches() {
  const results = [];

  for (const data of COACHES) {
    // 1. Upsert User
    const user = await prisma.user.upsert({
      where:  { firebaseUid: data.user.firebaseUid },
      update: data.user,
      create: data.user,
    });

    // 2. Upsert CoachProfile
    const coach = await prisma.coachProfile.upsert({
      where:  { userId: user.id },
      update: data.profile,
      create: { ...data.profile, userId: user.id },
    });

    // 3. Upsert each plan
    const planResults = [];
    for (const planData of data.plans) {
      const existing = await prisma.marketplacePlan.findFirst({
        where: { coachId: coach.id, title: planData.title },
      });
      const plan = existing
        ? await prisma.marketplacePlan.update({ where: { id: existing.id }, data: planData })
        : await prisma.marketplacePlan.create({ data: { ...planData, coachId: coach.id, userId: user.id } });
      planResults.push({ id: plan.id, title: plan.title });
    }

    results.push({ coach: data.profile.displayName, userId: user.id, coachId: coach.id, plans: planResults });
  }

  return results;
}

if (require.main === module) {
  (async () => {
    try {
      console.log('🌱 Seeding coaches…');
      const results = await seedCoaches();
      console.log('✅ Done:', JSON.stringify(results, null, 2));
    } catch (err) {
      console.error('❌ Seed failed:', err);
    } finally {
      await prisma.$disconnect();
    }
  })();
}

module.exports = seedCoaches;

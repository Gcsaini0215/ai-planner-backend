'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

// ── GET /api/coaches ──────────────────────────────────────────────────────────
const listCoaches = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      search, goal, role, minRating, sort = 'rating',
      featured,
    } = req.query;

    const where = { status: 'approved', isActive: true };
    if (role)      where.role       = role;
    if (featured)  where.isVerified = true;
    if (minRating) where.avgRating  = { gte: parseFloat(minRating) };
    if (goal)      where.goals      = { has: goal };
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { bio:         { contains: search, mode: 'insensitive' } },
        { tagline:     { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByMap = {
      rating:    { avgRating:    'desc' },
      followers: { followerCount: 'desc' },
      newest:    { createdAt:    'desc' },
      price:     { createdAt:    'asc'  }, // pricing is JSON; fallback sort
    };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [coaches, total] = await Promise.all([
      prisma.coachProfile.findMany({
        where,
        include: { user: { select: { name: true, phone: true } } },
        orderBy: orderByMap[sort] || orderByMap.rating,
        skip,
        take: parseInt(limit),
      }),
      prisma.coachProfile.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Coaches fetched', {
      coaches, total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (e) { next(e); }
};

// ── GET /api/coaches/:id ──────────────────────────────────────────────────────
const getCoach = async (req, res, next) => {
  try {
    const coach = await prisma.coachProfile.findUnique({
      where:   { id: req.params.id },
      include: { user: { select: { name: true, phone: true } } },
    });
    if (!coach) return sendError(res, 404, 'Coach not found');

    let isFollowing = false;
    if (req.user) {
      isFollowing = !!(await prisma.coachFollower.findUnique({
        where: { coachId_userId: { coachId: coach.id, userId: req.user.id } },
      }));
    }

    return sendSuccess(res, 200, 'Coach fetched', { ...coach, isFollowing });
  } catch (e) { next(e); }
};

// ── POST /api/coaches/apply ───────────────────────────────────────────────────
// Accepted roles: coach | trainer | dietitian
const ALLOWED_COACH_ROLES = ['coach', 'trainer', 'dietitian'];

const applyAsCoach = async (req, res, next) => {
  try {
    const existing = await prisma.coachProfile.findUnique({ where: { userId: req.user.id } });
    if (existing) return sendError(res, 400, 'Application already exists');

    const {
      displayName, bio, tagline, role, specializations,
      experience, languages, certifications, goals, pricing,
    } = req.body;

    const coachRole = ALLOWED_COACH_ROLES.includes(role) ? role : 'coach';
    const roleRow = await prisma.role.findUnique({ where: { slug: coachRole } });
    if (!roleRow) return sendError(res, 400, `Role not configured: ${coachRole}`);

    // Run both writes atomically so user.role and CoachProfile stay in sync
    const [, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data:  { role: coachRole, roleId: roleRow.id },
      }),
      prisma.coachProfile.create({
        data: {
          userId: req.user.id,
          displayName, bio: bio || '', tagline: tagline || '',
          role:            coachRole,
          specializations: specializations || [],
          experience:      experience      || 0,
          languages:       languages       || ['English'],
          certifications:  certifications  || [],
          goals:           goals           || [],
          pricing:         pricing         || {},
        },
      }),
    ]);

    logger.info(`[applyAsCoach] Saved in database: userId=${req.user.id}, savedRole=${coachRole}, savedRoleId=${roleRow.id}`);
    return sendSuccess(res, 201, 'Application submitted. Pending admin approval.', profile);
  } catch (e) { next(e); }
};

// ── PUT /api/coaches/profile ──────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'displayName','bio','tagline','specializations','experience',
      'languages','certifications','goals','pricing','socialLinks',
      'profilePhoto','coverBanner','availability',
    ];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const profile = await prisma.coachProfile.update({
      where: { userId: req.user.id },
      data:  update,
    });
    return sendSuccess(res, 200, 'Profile updated', profile);
  } catch (e) {
    if (e.code === 'P2025') return sendError(res, 404, 'Coach profile not found');
    next(e);
  }
};

// ── POST /api/coaches/:id/follow ──────────────────────────────────────────────
const toggleFollow = async (req, res, next) => {
  try {
    const existing = await prisma.coachFollower.findUnique({
      where: { coachId_userId: { coachId: req.params.id, userId: req.user.id } },
    });

    if (existing) {
      await prisma.coachFollower.delete({
        where: { coachId_userId: { coachId: req.params.id, userId: req.user.id } },
      });
      await prisma.coachProfile.update({
        where: { id: req.params.id },
        data:  { followerCount: { decrement: 1 } },
      });
      return sendSuccess(res, 200, 'Unfollowed', { following: false });
    }

    await prisma.coachFollower.create({ data: { coachId: req.params.id, userId: req.user.id } });
    await prisma.coachProfile.update({
      where: { id: req.params.id },
      data:  { followerCount: { increment: 1 } },
    });
    return sendSuccess(res, 200, 'Following', { following: true });
  } catch (e) { next(e); }
};

// ── GET /api/coaches/:id/plans ────────────────────────────────────────────────
const getCoachPlans = async (req, res, next) => {
  try {
    const where = { coachId: req.params.id, isPublished: true };
    if (req.query.type) where.type = req.query.type;
    const plans = await prisma.marketplacePlan.findMany({ where, orderBy: { createdAt: 'desc' } });
    return sendSuccess(res, 200, 'Plans fetched', plans);
  } catch (e) { next(e); }
};

// ── GET /api/coaches/:id/reviews ──────────────────────────────────────────────
const getCoachReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = { coachId: req.params.id, isModerated: true };

    const [reviews, total] = await Promise.all([
      prisma.coachReview.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.coachReview.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Reviews fetched', { reviews, total });
  } catch (e) { next(e); }
};

// ── POST /api/coaches/:id/reviews ─────────────────────────────────────────────
const addReview = async (req, res, next) => {
  try {
    const { rating, comment, transformationPhotoUrl } = req.body;
    const coachId = req.params.id;

    const review = await prisma.coachReview.create({
      data: {
        coachId, userId: req.user.id,
        rating,
        comment:                comment                || '',
        transformationPhotoUrl: transformationPhotoUrl || '',
      },
    });

    // Recalculate avg rating
    const agg = await prisma.coachReview.aggregate({
      where: { coachId },
      _avg:  { rating: true },
      _count: { rating: true },
    });

    if (agg._avg.rating !== null) {
      await prisma.coachProfile.update({
        where: { id: coachId },
        data:  {
          avgRating:   Math.round(agg._avg.rating * 10) / 10,
          reviewCount: agg._count.rating,
        },
      });
    }

    return sendSuccess(res, 201, 'Review added', review);
  } catch (e) { next(e); }
};

// ── GET /api/coaches/:id/transformations ──────────────────────────────────────
const getTransformations = async (req, res, next) => {
  try {
    const stories = await prisma.transformationStory.findMany({
      where:   { coachId: req.params.id, isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 200, 'Transformations fetched', stories);
  } catch (e) { next(e); }
};

// ── GET /api/coaches/my/profile ───────────────────────────────────────────────
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await prisma.coachProfile.findUnique({
      where:   { userId: req.user.id },
      include: { user: { select: { name: true, phone: true } } },
    });
    if (!profile) return sendError(res, 404, 'Profile not found');
    return sendSuccess(res, 200, 'My profile', profile);
  } catch (e) { next(e); }
};

module.exports = {
  listCoaches, getCoach, applyAsCoach, updateProfile,
  toggleFollow, getCoachPlans, getCoachReviews, addReview,
  getTransformations, getMyProfile,
};

'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const prisma = require('../config/prisma');

// ── GET /api/marketplace/plans ────────────────────────────────────────────────
const listPlans = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      type, goal, difficulty, maxPrice, search, sort = 'popular',
    } = req.query;

    const where = { isPublished: true };
    if (type)       where.type       = type;
    if (goal)       where.goal       = goal;
    if (difficulty) where.difficulty = difficulty;
    if (maxPrice)   where.price      = { lte: parseFloat(maxPrice) };
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByMap = {
      popular: { purchaseCount: 'desc' },
      newest:  { createdAt:    'desc' },
      price:   { price:        'asc'  },
      rating:  { avgRating:    'desc' },
    };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [plans, total] = await Promise.all([
      prisma.marketplacePlan.findMany({
        where,
        include: { coach: { select: { displayName: true, profilePhoto: true, avgRating: true, isVerified: true } } },
        orderBy: orderByMap[sort] || orderByMap.popular,
        skip,
        take: parseInt(limit),
      }),
      prisma.marketplacePlan.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Plans fetched', {
      plans, total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (e) { next(e); }
};

// ── GET /api/marketplace/plans/:id ───────────────────────────────────────────
const getPlan = async (req, res, next) => {
  try {
    const plan = await prisma.marketplacePlan.findUnique({
      where:   { id: req.params.id },
      include: { coach: { select: { displayName: true, profilePhoto: true, avgRating: true, isVerified: true, bio: true } } },
    });
    if (!plan) return sendError(res, 404, 'Plan not found');

    let hasPurchased = false;
    if (req.user) {
      hasPurchased = !!(await prisma.purchase.findUnique({
        where: { userId_planId: { userId: req.user.id, planId: plan.id } },
      }));
    }

    return sendSuccess(res, 200, 'Plan fetched', { ...plan, hasPurchased });
  } catch (e) { next(e); }
};

// ── POST /api/marketplace/plans ───────────────────────────────────────────────
const createPlan = async (req, res, next) => {
  try {
    const coachProfile = await prisma.coachProfile.findUnique({ where: { userId: req.user.id } });
    if (!coachProfile) return sendError(res, 403, 'Coach profile required');

    const {
      type, title, description, thumbnailUrl, difficulty, goal,
      durationDays, price, currency, isFree, tags, schedule,
      sessionsIncluded, sessionDurationMins, previewUrl,
    } = req.body;

    const plan = await prisma.marketplacePlan.create({
      data: {
        coachId: coachProfile.id,
        userId:  req.user.id,
        type, title,
        description:         description         || '',
        thumbnailUrl:        thumbnailUrl        || '',
        difficulty:          difficulty          || 'beginner',
        goal:                goal                || 'general',
        durationDays,
        price:               isFree ? 0 : (price || 0),
        currency:            currency            || 'USD',
        isFree:              isFree              || false,
        tags:                tags                || [],
        schedule:            schedule            || [],
        sessionsIncluded:    sessionsIncluded    || 0,
        sessionDurationMins: sessionDurationMins || 60,
        previewUrl:          previewUrl          || '',
      },
    });

    return sendSuccess(res, 201, 'Plan created', plan);
  } catch (e) { next(e); }
};

// ── PUT /api/marketplace/plans/:id ───────────────────────────────────────────
const updatePlan = async (req, res, next) => {
  try {
    const coachProfile = await prisma.coachProfile.findUnique({ where: { userId: req.user.id } });
    if (!coachProfile) return sendError(res, 403, 'Not a coach');

    const existing = await prisma.marketplacePlan.findFirst({
      where: { id: req.params.id, coachId: coachProfile.id },
    });
    if (!existing) return sendError(res, 404, 'Plan not found');

    const allowed = [
      'title','description','thumbnailUrl','difficulty','goal',
      'durationDays','price','tags','schedule','isPublished','previewUrl',
    ];
    const update = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const plan = await prisma.marketplacePlan.update({ where: { id: req.params.id }, data: update });
    return sendSuccess(res, 200, 'Plan updated', plan);
  } catch (e) { next(e); }
};

// ── POST /api/marketplace/plans/:id/purchase ──────────────────────────────────
const purchasePlan = async (req, res, next) => {
  try {
    const plan = await prisma.marketplacePlan.findUnique({ where: { id: req.params.id } });
    if (!plan || !plan.isPublished) return sendError(res, 404, 'Plan not found');

    const existing = await prisma.purchase.findUnique({
      where: { userId_planId: { userId: req.user.id, planId: plan.id } },
    });
    if (existing) return sendError(res, 400, 'Already purchased');

    const { paymentMethod = 'card', transactionId = '' } = req.body;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays + 30);

    const purchase = await prisma.purchase.create({
      data: {
        userId:        req.user.id,
        planId:        plan.id,
        coachId:       plan.coachId,
        amount:        plan.price,
        currency:      plan.currency,
        paymentMethod,
        transactionId,
        expiresAt,
        status:        'completed',
        accessGranted: true,
      },
    });

    await prisma.marketplacePlan.update({
      where: { id: plan.id },
      data:  { purchaseCount: { increment: 1 } },
    });
    await prisma.coachProfile.update({
      where: { id: plan.coachId },
      data:  { plansSold: { increment: 1 }, totalEarnings: { increment: plan.price } },
    });

    return sendSuccess(res, 201, 'Purchase successful', purchase);
  } catch (e) { next(e); }
};

// ── GET /api/marketplace/purchases ───────────────────────────────────────────
const myPurchases = async (req, res, next) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where:   { userId: req.user.id, status: 'completed' },
      include: {
        plan: {
          include: { coach: { select: { displayName: true, profilePhoto: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 200, 'Purchases fetched', purchases);
  } catch (e) { next(e); }
};

// ── GET /api/marketplace/coach/plans ─────────────────────────────────────────
const myCoachPlans = async (req, res, next) => {
  try {
    const coachProfile = await prisma.coachProfile.findUnique({ where: { userId: req.user.id } });
    if (!coachProfile) return sendError(res, 403, 'Not a coach');

    const plans = await prisma.marketplacePlan.findMany({
      where:   { coachId: coachProfile.id },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, 200, 'My plans', plans);
  } catch (e) { next(e); }
};

module.exports = { listPlans, getPlan, createPlan, updatePlan, purchasePlan, myPurchases, myCoachPlans };

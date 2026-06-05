'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');

// ─── Helper: resolve coachProfile.id for the authenticated user ───────────────
async function resolveCoachId(req, res) {
  const profile = await prisma.coachProfile.findUnique({
    where:  { userId: req.user.id },
    select: { id: true },
  });
  if (!profile) {
    sendError(res, 403, 'Coach profile not found. Please complete your coach registration.');
    return null;
  }
  return profile.id;
}

// ─── Helper: compute subscriber statistics from purchases ─────────────────────
function computeStats(purchases) {
  const now       = new Date();
  const total     = purchases.length;
  const active    = purchases.filter((p) => p.status === 'active' && new Date(p.expiryDate) > now).length;
  const expired   = purchases.filter((p) => p.status === 'active' && new Date(p.expiryDate) <= now).length;
  const cancelled = purchases.filter((p) => p.status === 'cancelled').length;
  const renewed   = purchases.filter((p) => p.isRenewed === true).length;
  const renewalRate = total > 0 ? Math.round((renewed / total) * 100 * 10) / 10 : 0;
  const totalRevenue = purchases.reduce((s, p) => s + (p.amountPaid ?? 0), 0);

  return { total, active, expired, cancelled, renewalRate, totalRevenue };
}

// ─── Helper: build 6-month monthly data ───────────────────────────────────────
function buildMonthlyData(purchases) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now    = new Date();
  const result = [];

  for (let i = 5; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = months[d.getMonth()];
    const subs  = purchases.filter((p) => {
      const sd = new Date(p.createdAt);
      return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth();
    });
    result.push({
      month:       label,
      subscribers: subs.length,
      revenue:     subs.reduce((s, p) => s + (p.amountPaid ?? 0), 0),
    });
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/plans
// Query params: page, limit, search, type, status, sort
// ══════════════════════════════════════════════════════════════════════════════
const listPlans = async (req, res, next) => {
  try {
    const coachId = await resolveCoachId(req, res);
    if (!coachId) return;

    const {
      page   = 1,
      limit  = 20,
      search,
      type,
      status,
      sort   = 'subscribers',
    } = req.query;

    const where = { coachId };
    if (type)   where.type   = type;
    if (status) {
      // 'active' → isPublished: true; 'draft' → isPublished: false; 'inactive' → isPublished: false
      if (status === 'active')   where.isPublished = true;
      if (status === 'draft')    where.isPublished = false;
      if (status === 'inactive') where.isPublished = false;
    }
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderByMap = {
      subscribers: { purchaseCount: 'desc' },
      revenue:     { createdAt:     'desc' }, // revenue not indexed; fallback
      latest:      { createdAt:     'desc' },
      price:       { price:         'desc' },
    };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [plans, total] = await Promise.all([
      prisma.marketplacePlan.findMany({
        where,
        orderBy: orderByMap[sort] ?? orderByMap.subscribers,
        skip,
        take: parseInt(limit),
      }),
      prisma.marketplacePlan.count({ where }),
    ]);

    // Shape plans for mobile (normalise field names + add subscriber counts)
    const shaped = await Promise.all(plans.map(async (plan) => {
      let purchases = [];
      try {
        purchases = await prisma.planPurchase.findMany({
          where: { planId: plan.id },
          select: { status: true, expiryDate: true, isRenewed: true, amountPaid: true, createdAt: true },
        });
      } catch (_) { /* table may not exist yet */ }

      const stats = computeStats(purchases);

      return {
        id:                 plan.id,
        title:              plan.title,
        description:        plan.description || '',
        type:               plan.type        || 'combined',
        goal:               plan.goal        || 'General Fitness',
        durationWeeks:      plan.durationDays ? Math.ceil(plan.durationDays / 7) : (plan.durationWeeks ?? 4),
        price:              plan.price        || 0,
        status:             plan.isPublished  ? 'active' : 'draft',
        createdAt:          plan.createdAt,
        features:           plan.features     || [],
        totalSubscribers:   plan.purchaseCount || stats.total,
        activeSubscribers:  stats.active,
        expiredSubscribers: stats.expired,
        renewalRate:        stats.renewalRate,
        totalRevenue:       stats.totalRevenue,
      };
    }));

    return sendSuccess(res, 200, 'Plans fetched', shaped, paginationMeta({
      total, page: parseInt(page), limit: parseInt(limit),
    }));
  } catch (e) {
    logger.error(`[listPlans] ${e.message}`);
    next(e);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/plans/:id
// ══════════════════════════════════════════════════════════════════════════════
const getPlan = async (req, res, next) => {
  try {
    const coachId = await resolveCoachId(req, res);
    if (!coachId) return;

    const plan = await prisma.marketplacePlan.findFirst({
      where: { id: req.params.id, coachId },
    });
    if (!plan) return sendError(res, 404, 'Plan not found');

    let purchases = [];
    try {
      purchases = await prisma.planPurchase.findMany({
        where:  { planId: plan.id },
        select: { status: true, expiryDate: true, isRenewed: true, amountPaid: true, createdAt: true },
      });
    } catch (_) {}

    const stats    = computeStats(purchases);
    const monthly  = buildMonthlyData(purchases);

    return sendSuccess(res, 200, 'Plan fetched', {
      id:                 plan.id,
      title:              plan.title,
      description:        plan.description || '',
      type:               plan.type        || 'combined',
      goal:               plan.goal        || 'General Fitness',
      durationWeeks:      plan.durationDays ? Math.ceil(plan.durationDays / 7) : (plan.durationWeeks ?? 4),
      price:              plan.price        || 0,
      status:             plan.isPublished  ? 'active' : 'draft',
      createdAt:          plan.createdAt,
      features:           plan.features     || [],
      totalSubscribers:   plan.purchaseCount || stats.total,
      activeSubscribers:  stats.active,
      expiredSubscribers: stats.expired,
      renewalRate:        stats.renewalRate,
      totalRevenue:       stats.totalRevenue,
      monthlyData:        monthly,
    });
  } catch (e) {
    logger.error(`[getPlan] ${e.message}`);
    next(e);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/plans/:id/statistics
// ══════════════════════════════════════════════════════════════════════════════
const getPlanStatistics = async (req, res, next) => {
  try {
    const coachId = await resolveCoachId(req, res);
    if (!coachId) return;

    const plan = await prisma.marketplacePlan.findFirst({
      where:  { id: req.params.id, coachId },
      select: { id: true, price: true, purchaseCount: true },
    });
    if (!plan) return sendError(res, 404, 'Plan not found');

    let purchases = [];
    try {
      purchases = await prisma.planPurchase.findMany({
        where:  { planId: plan.id },
        select: { status: true, expiryDate: true, isRenewed: true, amountPaid: true, createdAt: true },
      });
    } catch (_) {}

    const stats   = computeStats(purchases);
    const monthly = buildMonthlyData(purchases);
    const lastMonthRevenue = monthly.length > 0 ? monthly[monthly.length - 1].revenue : 0;

    return sendSuccess(res, 200, 'Statistics fetched', {
      totalSubscribers:     stats.total,
      activeSubscribers:    stats.active,
      expiredSubscribers:   stats.expired,
      cancelledSubscribers: stats.cancelled,
      renewalRate:          stats.renewalRate,
      totalRevenue:         stats.totalRevenue,
      monthlyRevenue:       lastMonthRevenue,
      monthlyData:          monthly,
    });
  } catch (e) {
    logger.error(`[getPlanStatistics] ${e.message}`);
    next(e);
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/plans/:id/subscribers
// Query params: page, limit, status
// ══════════════════════════════════════════════════════════════════════════════
const getPlanSubscribers = async (req, res, next) => {
  try {
    const coachId = await resolveCoachId(req, res);
    if (!coachId) return;

    const plan = await prisma.marketplacePlan.findFirst({
      where:  { id: req.params.id, coachId },
      select: { id: true },
    });
    if (!plan) return sendError(res, 404, 'Plan not found');

    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let subscribers = [];
    let total       = 0;

    try {
      const where = { planId: plan.id };
      if (status && status !== 'All') where.status = status;

      const [purchases, count] = await Promise.all([
        prisma.planPurchase.findMany({
          where,
          include: {
            user: {
              select: {
                id: true, name: true, phone: true,
                userProfile: { select: { email: true, avatarUrl: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.planPurchase.count({ where }),
      ]);

      total = count;
      const now = new Date();

      subscribers = purchases.map((p) => ({
        id:               p.id,
        name:             p.user?.name             || 'Unknown',
        email:            p.user?.userProfile?.email    || '',
        phone:            p.user?.phone            || '',
        avatarUrl:        p.user?.userProfile?.avatarUrl || null,
        subscriptionDate: p.createdAt,
        expiryDate:       p.expiryDate,
        status:           p.status === 'cancelled'
                            ? 'cancelled'
                            : new Date(p.expiryDate) > now
                              ? 'active'
                              : 'expired',
      }));
    } catch (dbErr) {
      // planPurchase table may not exist yet; return empty list gracefully
      logger.warn(`[getPlanSubscribers] DB query failed: ${dbErr.message}`);
    }

    return sendSuccess(res, 200, 'Subscribers fetched', subscribers,
      paginationMeta({ total, page: parseInt(page), limit: parseInt(limit) }));
  } catch (e) {
    logger.error(`[getPlanSubscribers] ${e.message}`);
    next(e);
  }
};

module.exports = { listPlans, getPlan, getPlanStatistics, getPlanSubscribers };

'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const MarketplacePlan = require('../models/MarketplacePlan');
const CoachProfile    = require('../models/CoachProfile');
const Purchase        = require('../models/Purchase');

// ── GET /api/marketplace/plans ────────────────────────────────────────────────
const listPlans = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      type, goal, difficulty, maxPrice, search, sort = 'popular',
    } = req.query;

    const query = { isPublished: true };
    if (type)       query.type       = type;
    if (goal)       query.goal       = goal;
    if (difficulty) query.difficulty = difficulty;
    if (maxPrice)   query.price      = { $lte: parseFloat(maxPrice) };
    if (search)     query.$text      = { $search: search };

    const sortMap = {
      popular: { purchaseCount: -1 },
      newest:  { createdAt: -1 },
      price:   { price: 1 },
      rating:  { avgRating: -1 },
    };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await MarketplacePlan.countDocuments(query);
    const plans = await MarketplacePlan.find(query)
      .sort(sortMap[sort] || sortMap.popular)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('coachId', 'displayName profilePhoto avgRating isVerified')
      .lean();

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
    const plan = await MarketplacePlan.findById(req.params.id)
      .populate('coachId', 'displayName profilePhoto avgRating isVerified bio')
      .lean();
    if (!plan) return sendError(res, 404, 'Plan not found');

    let hasPurchased = false;
    if (req.user) {
      hasPurchased = !!(await Purchase.findOne({
        userId: req.user._id,
        planId: plan._id,
        status: 'completed',
      }));
    }

    return sendSuccess(res, 200, 'Plan fetched', { ...plan, hasPurchased });
  } catch (e) { next(e); }
};

// ── POST /api/marketplace/plans (coach creates plan) ─────────────────────────
const createPlan = async (req, res, next) => {
  try {
    const coachProfile = await CoachProfile.findOne({ userId: req.user._id });
    if (!coachProfile) return sendError(res, 403, 'Coach profile required');

    const {
      type, title, description, thumbnailUrl, difficulty, goal,
      durationDays, price, currency, isFree, tags, schedule,
      sessionsIncluded, sessionDurationMins, previewUrl,
    } = req.body;

    const plan = await MarketplacePlan.create({
      coachId: coachProfile._id,
      userId:  req.user._id,
      type, title, description, thumbnailUrl, difficulty, goal,
      durationDays, price: isFree ? 0 : (price || 0),
      currency: currency || 'USD',
      isFree: isFree || false,
      tags:   tags  || [],
      schedule: schedule || [],
      sessionsIncluded:    sessionsIncluded    || 0,
      sessionDurationMins: sessionDurationMins || 60,
      previewUrl: previewUrl || '',
    });

    return sendSuccess(res, 201, 'Plan created', plan);
  } catch (e) { next(e); }
};

// ── PUT /api/marketplace/plans/:id ───────────────────────────────────────────
const updatePlan = async (req, res, next) => {
  try {
    const coachProfile = await CoachProfile.findOne({ userId: req.user._id });
    if (!coachProfile) return sendError(res, 403, 'Not a coach');

    const allowed = [
      'title','description','thumbnailUrl','difficulty','goal',
      'durationDays','price','tags','schedule','isPublished','previewUrl',
    ];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const plan = await MarketplacePlan.findOneAndUpdate(
      { _id: req.params.id, coachId: coachProfile._id },
      { $set: update },
      { new: true },
    );
    if (!plan) return sendError(res, 404, 'Plan not found');
    return sendSuccess(res, 200, 'Plan updated', plan);
  } catch (e) { next(e); }
};

// ── POST /api/marketplace/plans/:id/purchase ──────────────────────────────────
const purchasePlan = async (req, res, next) => {
  try {
    const plan = await MarketplacePlan.findById(req.params.id);
    if (!plan || !plan.isPublished) return sendError(res, 404, 'Plan not found');

    const existing = await Purchase.findOne({ userId: req.user._id, planId: plan._id });
    if (existing) return sendError(res, 400, 'Already purchased');

    // Payment simulation — replace with Stripe/Razorpay in production
    const { paymentMethod = 'card', transactionId = '' } = req.body;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays + 30);

    const purchase = await Purchase.create({
      userId:        req.user._id,
      planId:        plan._id,
      coachId:       plan.coachId,
      amount:        plan.price,
      currency:      plan.currency,
      paymentMethod,
      transactionId,
      expiresAt,
      status:        'completed',
      accessGranted: true,
    });

    await MarketplacePlan.findByIdAndUpdate(plan._id, { $inc: { purchaseCount: 1 } });
    await CoachProfile.findByIdAndUpdate(plan.coachId, {
      $inc: { plansSold: 1, totalEarnings: plan.price },
    });

    return sendSuccess(res, 201, 'Purchase successful', purchase);
  } catch (e) { next(e); }
};

// ── GET /api/marketplace/purchases (user's purchases) ─────────────────────────
const myPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find({ userId: req.user._id, status: 'completed' })
      .populate({
        path:     'planId',
        populate: { path: 'coachId', select: 'displayName profilePhoto' },
      })
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, 200, 'Purchases fetched', purchases);
  } catch (e) { next(e); }
};

// ── GET /api/marketplace/coach/plans (coach's own plans) ──────────────────────
const myCoachPlans = async (req, res, next) => {
  try {
    const coachProfile = await CoachProfile.findOne({ userId: req.user._id });
    if (!coachProfile) return sendError(res, 403, 'Not a coach');

    const plans = await MarketplacePlan.find({ coachId: coachProfile._id })
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, 200, 'My plans', plans);
  } catch (e) { next(e); }
};

module.exports = {
  listPlans, getPlan, createPlan, updatePlan,
  purchasePlan, myPurchases, myCoachPlans,
};

'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const CoachProfile        = require('../models/CoachProfile');
const CoachFollower       = require('../models/CoachFollower');
const CoachReview         = require('../models/CoachReview');
const MarketplacePlan     = require('../models/MarketplacePlan');
const TransformationStory = require('../models/TransformationStory');
const User                = require('../models/User');

// ── GET /api/coaches ──────────────────────────────────────────────────────────
const listCoaches = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      search, goal, role, minRating, maxPrice, sort = 'rating',
      featured,
    } = req.query;

    const query = { status: 'approved', isActive: true };

    if (search) query.$text = { $search: search };
    if (goal)   query.goals = goal;
    if (role)   query.role  = role;
    if (minRating) query.avgRating = { $gte: parseFloat(minRating) };
    if (featured)  query.isVerified = true;

    const sortMap = {
      rating:    { avgRating: -1 },
      followers: { followerCount: -1 },
      newest:    { createdAt: -1 },
      price:     { 'pricing.consultationPerHour': 1 },
    };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await CoachProfile.countDocuments(query);
    const coaches = await CoachProfile.find(query)
      .sort(sortMap[sort] || sortMap.rating)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name phone')
      .lean();

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
    const coach = await CoachProfile.findById(req.params.id)
      .populate('userId', 'name phone')
      .lean();
    if (!coach) return sendError(res, 404, 'Coach not found');

    // Attach isFollowing flag if user is authenticated
    let isFollowing = false;
    if (req.user) {
      isFollowing = !!(await CoachFollower.findOne({
        coachId: coach._id,
        userId:  req.user._id,
      }));
    }

    return sendSuccess(res, 200, 'Coach fetched', { ...coach, isFollowing });
  } catch (e) { next(e); }
};

// ── POST /api/coaches/apply ───────────────────────────────────────────────────
const applyAsCoach = async (req, res, next) => {
  try {
    const existing = await CoachProfile.findOne({ userId: req.user._id });
    if (existing) return sendError(res, 400, 'Application already exists');

    const {
      displayName, bio, tagline, role, specializations,
      experience, languages, certifications, goals, pricing,
    } = req.body;

    const profile = await CoachProfile.create({
      userId: req.user._id,
      displayName, bio, tagline,
      role:            role || 'coach',
      specializations: specializations || [],
      experience:      experience || 0,
      languages:       languages  || ['English'],
      certifications:  certifications || [],
      goals:           goals || [],
      pricing:         pricing || {},
    });

    return sendSuccess(res, 201, 'Application submitted', profile);
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
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const profile = await CoachProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update },
      { new: true },
    );
    if (!profile) return sendError(res, 404, 'Coach profile not found');
    return sendSuccess(res, 200, 'Profile updated', profile);
  } catch (e) { next(e); }
};

// ── POST /api/coaches/:id/follow ──────────────────────────────────────────────
const toggleFollow = async (req, res, next) => {
  try {
    const existing = await CoachFollower.findOne({
      coachId: req.params.id,
      userId:  req.user._id,
    });

    if (existing) {
      await existing.deleteOne();
      await CoachProfile.findByIdAndUpdate(req.params.id, { $inc: { followerCount: -1 } });
      return sendSuccess(res, 200, 'Unfollowed', { following: false });
    }

    await CoachFollower.create({ coachId: req.params.id, userId: req.user._id });
    await CoachProfile.findByIdAndUpdate(req.params.id, { $inc: { followerCount: 1 } });
    return sendSuccess(res, 200, 'Following', { following: true });
  } catch (e) { next(e); }
};

// ── GET /api/coaches/:id/plans ────────────────────────────────────────────────
const getCoachPlans = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { coachId: req.params.id, isPublished: true };
    if (type) query.type = type;
    const plans = await MarketplacePlan.find(query).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, 'Plans fetched', plans);
  } catch (e) { next(e); }
};

// ── GET /api/coaches/:id/reviews ──────────────────────────────────────────────
const getCoachReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await CoachReview.countDocuments({ coachId: req.params.id, isModerated: true });
    const reviews = await CoachReview.find({ coachId: req.params.id, isModerated: true })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    return sendSuccess(res, 200, 'Reviews fetched', { reviews, total });
  } catch (e) { next(e); }
};

// ── POST /api/coaches/:id/reviews ─────────────────────────────────────────────
const addReview = async (req, res, next) => {
  try {
    const { rating, comment, transformationPhotoUrl } = req.body;
    const coachId = req.params.id;

    const review = await CoachReview.create({
      coachId,
      userId:  req.user._id,
      rating,
      comment:                comment || '',
      transformationPhotoUrl: transformationPhotoUrl || '',
      isVerified:             false,
    });

    // Recalculate avg rating
    const agg = await CoachReview.aggregate([
      { $match: { coachId: review.coachId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (agg[0]) {
      await CoachProfile.findByIdAndUpdate(coachId, {
        avgRating:   Math.round(agg[0].avg * 10) / 10,
        reviewCount: agg[0].count,
      });
    }

    return sendSuccess(res, 201, 'Review added', review);
  } catch (e) { next(e); }
};

// ── GET /api/coaches/:id/transformations ──────────────────────────────────────
const getTransformations = async (req, res, next) => {
  try {
    const stories = await TransformationStory.find({
      coachId: req.params.id, isPublished: true,
    }).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, 200, 'Transformations fetched', stories);
  } catch (e) { next(e); }
};

// ── GET /api/coaches/my/profile (coach's own) ─────────────────────────────────
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await CoachProfile.findOne({ userId: req.user._id })
      .populate('userId', 'name phone')
      .lean();
    if (!profile) return sendError(res, 404, 'Profile not found');
    return sendSuccess(res, 200, 'My profile', profile);
  } catch (e) { next(e); }
};

module.exports = {
  listCoaches, getCoach, applyAsCoach, updateProfile,
  toggleFollow, getCoachPlans, getCoachReviews, addReview,
  getTransformations, getMyProfile,
};

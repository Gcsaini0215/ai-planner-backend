'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const Food = require('../models/Food');

/**
 * GET /api/foods?category=fruits&page=1&limit=30
 */
const getFoods = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 30 } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (category) filter.category = category;

    const [foods, total] = await Promise.all([
      Food.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
      Food.countDocuments(filter),
    ]);

    return sendSuccess(
      res, 200, 'Foods fetched', foods,
      paginationMeta({ total, page: Number(page), limit: Number(limit) })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/foods/search?q=chicken&category=protein
 */
const searchFoods = async (req, res, next) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return sendError(res, 400, 'Search query must be at least 2 characters');
    }

    const skip   = (Number(page) - 1) * Number(limit);
    const filter = {
      $or: [
        { $text: { $search: q } },
        { name: { $regex: q, $options: 'i' } },
      ],
    };
    if (category) filter.category = category;

    const [foods, total] = await Promise.all([
      Food.find(filter).sort({ score: { $meta: 'textScore' }, name: 1 })
        .skip(skip).limit(Number(limit)),
      Food.countDocuments(filter),
    ]);

    return sendSuccess(
      res, 200, 'Search results', foods,
      paginationMeta({ total, page: Number(page), limit: Number(limit) })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/foods/:id
 */
const getFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return sendError(res, 404, 'Food not found');
    return sendSuccess(res, 200, 'Food fetched', food);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/foods  (creates a custom user food)
 */
const createFood = async (req, res, next) => {
  try {
    const food = await Food.create({
      ...req.body,
      isCustom:  true,
      createdBy: req.user?._id,
    });
    return sendSuccess(res, 201, 'Custom food created', food);
  } catch (error) {
    next(error);
  }
};

module.exports = { getFoods, searchFoods, getFood, createFood };

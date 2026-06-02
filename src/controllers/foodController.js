'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const prisma = require('../config/prisma');

/** GET /api/foods */
const getFoods = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 30 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const where = {};
    if (category) where.category = category;

    const [foods, total] = await Promise.all([
      prisma.food.findMany({ where, orderBy: { name: 'asc' }, skip, take: Number(limit) }),
      prisma.food.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Foods fetched', foods,
      paginationMeta({ total, page: Number(page), limit: Number(limit) }));
  } catch (error) { next(error); }
};

/** GET /api/foods/search */
const searchFoods = async (req, res, next) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    if (!q || q.trim().length < 2) return sendError(res, 400, 'Search query must be at least 2 characters');

    const skip  = (Number(page) - 1) * Number(limit);
    const where = {
      OR: [
        { name:     { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ],
    };
    if (category) where.category = category;

    const [foods, total] = await Promise.all([
      prisma.food.findMany({ where, orderBy: { name: 'asc' }, skip, take: Number(limit) }),
      prisma.food.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Search results', foods,
      paginationMeta({ total, page: Number(page), limit: Number(limit) }));
  } catch (error) { next(error); }
};

/** GET /api/foods/:id */
const getFood = async (req, res, next) => {
  try {
    const food = await prisma.food.findUnique({ where: { id: req.params.id } });
    if (!food) return sendError(res, 404, 'Food not found');
    return sendSuccess(res, 200, 'Food fetched', food);
  } catch (error) { next(error); }
};

/** POST /api/foods */
const createFood = async (req, res, next) => {
  try {
    const food = await prisma.food.create({
      data: { ...req.body, isCustom: true, createdById: req.user?.id || null },
    });
    return sendSuccess(res, 201, 'Custom food created', food);
  } catch (error) { next(error); }
};

module.exports = { getFoods, searchFoods, getFood, createFood };

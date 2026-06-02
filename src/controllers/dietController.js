'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const prisma = require('../config/prisma');

const createDiet = async (req, res, next) => {
  try {
    const diet = await prisma.dietPlan.create({
      data: { ...req.body, userId: req.user.id },
    });
    return sendSuccess(res, 201, 'Diet plan created', diet);
  } catch (error) { next(error); }
};

const getDiets = async (req, res, next) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const where = { userId: req.user.id };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [diets, total] = await Promise.all([
      prisma.dietPlan.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
      prisma.dietPlan.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Diet plans fetched', diets,
      paginationMeta({ total, page: Number(page), limit: Number(limit) }));
  } catch (error) { next(error); }
};

const getDiet = async (req, res, next) => {
  try {
    const diet = await prisma.dietPlan.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!diet) return sendError(res, 404, 'Diet plan not found');
    return sendSuccess(res, 200, 'Diet plan fetched', diet);
  } catch (error) { next(error); }
};

const updateDiet = async (req, res, next) => {
  try {
    const existing = await prisma.dietPlan.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return sendError(res, 404, 'Diet plan not found');
    const diet = await prisma.dietPlan.update({ where: { id: req.params.id }, data: req.body });
    return sendSuccess(res, 200, 'Diet plan updated', diet);
  } catch (error) { next(error); }
};

const deleteDiet = async (req, res, next) => {
  try {
    const existing = await prisma.dietPlan.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return sendError(res, 404, 'Diet plan not found');
    await prisma.dietPlan.delete({ where: { id: req.params.id } });
    return sendSuccess(res, 200, 'Diet plan deleted');
  } catch (error) { next(error); }
};

module.exports = { createDiet, getDiets, getDiet, updateDiet, deleteDiet };

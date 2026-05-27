'use strict';

const { sendSuccess, sendError, paginationMeta } = require('../utils/response');
const DietPlan = require('../models/DietPlan');

const createDiet = async (req, res, next) => {
  try {
    const diet = await DietPlan.create({ ...req.body, userId: req.user._id });
    return sendSuccess(res, 201, 'Diet plan created', diet);
  } catch (error) {
    next(error);
  }
};

const getDiets = async (req, res, next) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;
    const skip   = (Number(page) - 1) * Number(limit);
    const filter = { userId: req.user._id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [diets, total] = await Promise.all([
      DietPlan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      DietPlan.countDocuments(filter),
    ]);

    return sendSuccess(
      res, 200, 'Diet plans fetched', diets,
      paginationMeta({ total, page: Number(page), limit: Number(limit) })
    );
  } catch (error) {
    next(error);
  }
};

const getDiet = async (req, res, next) => {
  try {
    const diet = await DietPlan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!diet) return sendError(res, 404, 'Diet plan not found');
    return sendSuccess(res, 200, 'Diet plan fetched', diet);
  } catch (error) {
    next(error);
  }
};

const updateDiet = async (req, res, next) => {
  try {
    const diet = await DietPlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!diet) return sendError(res, 404, 'Diet plan not found');
    return sendSuccess(res, 200, 'Diet plan updated', diet);
  } catch (error) {
    next(error);
  }
};

const deleteDiet = async (req, res, next) => {
  try {
    const diet = await DietPlan.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!diet) return sendError(res, 404, 'Diet plan not found');
    return sendSuccess(res, 200, 'Diet plan deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { createDiet, getDiets, getDiet, updateDiet, deleteDiet };

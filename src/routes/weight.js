'use strict';

const router = require('express').Router();
const { logWeight, getWeightHistory, deleteWeightLog } = require('../controllers/weightController');
const { protect } = require('../middleware/auth');
const Joi      = require('joi');
const validate = require('../middleware/validate');

const weightSchema = Joi.object({
  weight: Joi.number().min(10).max(500).required(),
  date:   Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note:   Joi.string().max(200).optional().allow(''),
});

router.use(protect);

router.post('/',        validate(weightSchema), logWeight);    // POST /api/weight
router.get('/history',  getWeightHistory);                     // GET  /api/weight/history?days=30
router.delete('/:id',   deleteWeightLog);                      // DEL  /api/weight/:id

module.exports = router;

'use strict';

const router = require('express').Router();
const { logWater, getWaterToday, getWaterHistory, deleteWaterLog } = require('../controllers/waterController');
const { protect } = require('../middleware/auth');
const Joi      = require('joi');
const validate = require('../middleware/validate');

const waterSchema = Joi.object({
  amount: Joi.number().integer().min(1).max(5000).required(),
  date:   Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note:   Joi.string().max(200).optional().allow(''),
});

router.use(protect);

router.post('/',       validate(waterSchema), logWater);   // POST /api/water
router.get('/today',   getWaterToday);                     // GET  /api/water/today
router.get('/history', getWaterHistory);                   // GET  /api/water/history
router.delete('/:id',  deleteWaterLog);                    // DEL  /api/water/:id

module.exports = router;

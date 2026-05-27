'use strict';

const router = require('express').Router();
const {
  createMeal, getMeals, getMeal, updateMeal, deleteMeal, getDailySummary,
} = require('../controllers/mealController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');
const { createMealSchema, updateMealSchema } = require('../validations/mealValidation');

router.use(protect);

router.get('/summary', getDailySummary);                           // GET  /api/meals/summary
router.route('/')
  .get(getMeals)                                                   // GET  /api/meals
  .post(validate(createMealSchema), createMeal);                   // POST /api/meals

router.route('/:id')
  .get(getMeal)                                                    // GET  /api/meals/:id
  .put(validate(updateMealSchema), updateMeal)                     // PUT  /api/meals/:id
  .delete(deleteMeal);                                             // DEL  /api/meals/:id

module.exports = router;

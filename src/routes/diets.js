'use strict';

const router = require('express').Router();
const { createDiet, getDiets, getDiet, updateDiet, deleteDiet } = require('../controllers/dietController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');
const { createDietSchema, updateDietSchema } = require('../validations/dietValidation');

router.use(protect);

router.route('/')
  .get(getDiets)
  .post(validate(createDietSchema), createDiet);

router.route('/:id')
  .get(getDiet)
  .put(validate(updateDietSchema), updateDiet)
  .delete(deleteDiet);

module.exports = router;

'use strict';

const router = require('express').Router();
const { getProfile, updateProfile, getDashboard } = require('../controllers/userController');
const { protect }  = require('../middleware/auth');
const validate     = require('../middleware/validate');
const { updateProfileSchema } = require('../validations/userValidation');

router.use(protect);   // all user routes require auth

router.get('/profile',   getProfile);
router.put('/profile',   validate(updateProfileSchema), updateProfile);
router.get('/dashboard', getDashboard);

module.exports = router;

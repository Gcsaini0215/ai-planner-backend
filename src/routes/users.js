'use strict';

const router = require('express').Router();
const { getProfile, updateProfile, getDashboard, deleteAccount } = require('../controllers/userController');
const { protect }  = require('../middleware/auth');
const validate     = require('../middleware/validate');
const { updateProfileSchema } = require('../validations/userValidation');

router.use(protect);   // all user routes require auth

router.get('/profile',   getProfile);
router.put('/profile',   validate(updateProfileSchema), updateProfile);
router.get('/dashboard', getDashboard);
router.delete('/account', deleteAccount);  // archive + hard-delete

module.exports = router;

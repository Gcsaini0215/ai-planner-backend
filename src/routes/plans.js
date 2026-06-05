'use strict';

const router = require('express').Router();
const c      = require('../controllers/plansController');
const { protect, requireCoach } = require('../middleware/auth');

// All plans routes require authentication + coach role
router.use(protect, requireCoach);

// GET /api/plans                      — list coach's CRM/marketplace plans
router.get('/',                      c.listPlans);

// GET /api/plans/:id                  — single plan details
router.get('/:id',                   c.getPlan);

// GET /api/plans/:id/statistics       — subscriber & revenue statistics
router.get('/:id/statistics',        c.getPlanStatistics);

// GET /api/plans/:id/subscribers      — paginated subscriber list
router.get('/:id/subscribers',       c.getPlanSubscribers);

module.exports = router;

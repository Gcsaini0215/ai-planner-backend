'use strict';
const router = require('express').Router();
const m      = require('../controllers/marketplaceController');
const { protect } = require('../middleware/auth');

router.get('/plans',                        m.listPlans);
router.get('/plans/:id',                    m.getPlan);
router.post('/plans',            protect,   m.createPlan);
router.put('/plans/:id',         protect,   m.updatePlan);
router.post('/plans/:id/purchase', protect, m.purchasePlan);
router.get('/purchases',         protect,   m.myPurchases);
router.get('/coach/plans',       protect,   m.myCoachPlans);
module.exports = router;

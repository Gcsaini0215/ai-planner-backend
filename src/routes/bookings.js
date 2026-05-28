'use strict';
const router = require('express').Router();
const b      = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/',          b.createBooking);
router.get('/',           b.getMyBookings);
router.get('/coach',      b.getCoachBookings);
router.put('/:id',        b.updateBooking);
module.exports = router;

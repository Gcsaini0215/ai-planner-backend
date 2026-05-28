'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const Booking     = require('../models/Booking');
const CoachProfile = require('../models/CoachProfile');

// ── POST /api/bookings ────────────────────────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const { coachId, scheduledAt, type, durationMins, notes } = req.body;

    const coach = await CoachProfile.findById(coachId);
    if (!coach) return sendError(res, 404, 'Coach not found');

    // Check slot conflict
    const conflict = await Booking.findOne({
      coachId,
      scheduledAt: new Date(scheduledAt),
      status: { $in: ['pending', 'confirmed'] },
    });
    if (conflict) return sendError(res, 409, 'Slot already booked');

    const amount = coach.pricing?.consultationPerHour || 0;

    const booking = await Booking.create({
      userId:      req.user._id,
      coachId,
      scheduledAt: new Date(scheduledAt),
      type:        type || 'video',
      durationMins: durationMins || 60,
      amount,
      currency:    coach.pricing?.currency || 'USD',
      notes:       notes || '',
    });

    return sendSuccess(res, 201, 'Booking created', booking);
  } catch (e) { next(e); }
};

// ── GET /api/bookings — user's bookings ───────────────────────────────────────
const getMyBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('coachId', 'displayName profilePhoto')
      .sort({ scheduledAt: -1 })
      .lean();
    return sendSuccess(res, 200, 'Bookings fetched', bookings);
  } catch (e) { next(e); }
};

// ── GET /api/bookings/coach — coach's bookings ───────────────────────────────
const getCoachBookings = async (req, res, next) => {
  try {
    const coachProfile = await CoachProfile.findOne({ userId: req.user._id });
    if (!coachProfile) return sendError(res, 403, 'Not a coach');

    const { status } = req.query;
    const query = { coachId: coachProfile._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('userId', 'name phone')
      .sort({ scheduledAt: 1 })
      .lean();
    return sendSuccess(res, 200, 'Bookings fetched', bookings);
  } catch (e) { next(e); }
};

// ── PUT /api/bookings/:id ─────────────────────────────────────────────────────
const updateBooking = async (req, res, next) => {
  try {
    const { status, cancelReason, meetingLink, scheduledAt } = req.body;

    const coachProfile = await CoachProfile.findOne({ userId: req.user._id });

    const filter = coachProfile
      ? { _id: req.params.id, coachId: coachProfile._id }
      : { _id: req.params.id, userId: req.user._id };

    const update = {};
    if (status)      update.status      = status;
    if (cancelReason) update.cancelReason = cancelReason;
    if (meetingLink)  update.meetingLink  = meetingLink;
    if (scheduledAt)  update.scheduledAt  = new Date(scheduledAt);

    const booking = await Booking.findOneAndUpdate(filter, { $set: update }, { new: true });
    if (!booking) return sendError(res, 404, 'Booking not found');
    return sendSuccess(res, 200, 'Booking updated', booking);
  } catch (e) { next(e); }
};

// ── GET /api/coaches/:id/slots ────────────────────────────────────────────────
const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    if (!date) return sendError(res, 400, 'date required');

    const coach = await CoachProfile.findById(req.params.id).lean();
    if (!coach) return sendError(res, 404, 'Coach not found');

    const dayOfWeek = new Date(date).getDay();
    const slots = (coach.availability || []).filter(s => s.dayOfWeek === dayOfWeek);

    // Remove already booked
    const booked = await Booking.find({
      coachId: coach._id,
      scheduledAt: {
        $gte: new Date(date),
        $lt:  new Date(new Date(date).getTime() + 86400000),
      },
      status: { $in: ['pending', 'confirmed'] },
    }).lean();

    const bookedTimes = booked.map(b =>
      b.scheduledAt.toTimeString().slice(0, 5)
    );

    const available = slots.filter(s => !bookedTimes.includes(s.startTime));
    return sendSuccess(res, 200, 'Slots fetched', available);
  } catch (e) { next(e); }
};

module.exports = {
  createBooking, getMyBookings, getCoachBookings,
  updateBooking, getAvailableSlots,
};

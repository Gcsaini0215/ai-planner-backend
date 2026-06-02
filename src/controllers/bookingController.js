'use strict';

const { sendSuccess, sendError } = require('../utils/response');
const prisma = require('../config/prisma');

// ── POST /api/bookings ────────────────────────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const { coachId, scheduledAt, type, durationMins, notes } = req.body;

    const coach = await prisma.coachProfile.findUnique({ where: { id: coachId } });
    if (!coach) return sendError(res, 404, 'Coach not found');

    const scheduledDate = new Date(scheduledAt);

    const conflict = await prisma.booking.findFirst({
      where: {
        coachId,
        scheduledAt: scheduledDate,
        status: { in: ['pending', 'confirmed'] },
      },
    });
    if (conflict) return sendError(res, 409, 'Slot already booked');

    const pricing = coach.pricing || {};
    const amount  = pricing.consultationPerHour || 0;

    const booking = await prisma.booking.create({
      data: {
        userId:      req.user.id,
        coachId,
        scheduledAt: scheduledDate,
        type:        type        || 'video',
        durationMins: durationMins || 60,
        amount,
        currency:    pricing.currency || 'USD',
        notes:       notes || '',
      },
    });

    return sendSuccess(res, 201, 'Booking created', booking);
  } catch (e) { next(e); }
};

// ── GET /api/bookings ─────────────────────────────────────────────────────────
const getMyBookings = async (req, res, next) => {
  try {
    const where = { userId: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const bookings = await prisma.booking.findMany({
      where,
      include: { coach: { select: { displayName: true, profilePhoto: true } } },
      orderBy: { scheduledAt: 'desc' },
    });
    return sendSuccess(res, 200, 'Bookings fetched', bookings);
  } catch (e) { next(e); }
};

// ── GET /api/bookings/coach ───────────────────────────────────────────────────
const getCoachBookings = async (req, res, next) => {
  try {
    const coachProfile = await prisma.coachProfile.findUnique({ where: { userId: req.user.id } });
    if (!coachProfile) return sendError(res, 403, 'Not a coach');

    const where = { coachId: coachProfile.id };
    if (req.query.status) where.status = req.query.status;

    const bookings = await prisma.booking.findMany({
      where,
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
    return sendSuccess(res, 200, 'Bookings fetched', bookings);
  } catch (e) { next(e); }
};

// ── PUT /api/bookings/:id ─────────────────────────────────────────────────────
const updateBooking = async (req, res, next) => {
  try {
    const { status, cancelReason, meetingLink, scheduledAt } = req.body;

    const coachProfile = await prisma.coachProfile.findUnique({ where: { userId: req.user.id } });

    const where = coachProfile
      ? { id: req.params.id, coachId: coachProfile.id }
      : { id: req.params.id, userId: req.user.id };

    const existing = await prisma.booking.findFirst({ where });
    if (!existing) return sendError(res, 404, 'Booking not found');

    const update = {};
    if (status)       update.status       = status;
    if (cancelReason) update.cancelReason = cancelReason;
    if (meetingLink)  update.meetingLink  = meetingLink;
    if (scheduledAt)  update.scheduledAt  = new Date(scheduledAt);

    const booking = await prisma.booking.update({ where: { id: req.params.id }, data: update });
    return sendSuccess(res, 200, 'Booking updated', booking);
  } catch (e) { next(e); }
};

// ── GET /api/coaches/:id/slots ────────────────────────────────────────────────
const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return sendError(res, 400, 'date required');

    const coach = await prisma.coachProfile.findUnique({ where: { id: req.params.id } });
    if (!coach) return sendError(res, 404, 'Coach not found');

    const dayOfWeek = new Date(date).getDay();
    const availability = Array.isArray(coach.availability) ? coach.availability : [];
    const slots = availability.filter((s) => s.dayOfWeek === dayOfWeek);

    const dayStart = new Date(date);
    const dayEnd   = new Date(dayStart.getTime() + 86400000);

    const booked = await prisma.booking.findMany({
      where: {
        coachId: coach.id,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { in: ['pending', 'confirmed'] },
      },
    });

    const bookedTimes = booked.map((b) => b.scheduledAt.toTimeString().slice(0, 5));
    const available   = slots.filter((s) => !bookedTimes.includes(s.startTime));

    return sendSuccess(res, 200, 'Slots fetched', available);
  } catch (e) { next(e); }
};

module.exports = { createBooking, getMyBookings, getCoachBookings, updateBooking, getAvailableSlots };

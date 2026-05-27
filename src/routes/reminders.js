'use strict';

const router = require('express').Router();
const {
  createReminder, getReminders, getReminder,
  updateReminder, deleteReminder, toggleReminder,
} = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');
const { createReminderSchema, updateReminderSchema } = require('../validations/reminderValidation');

router.use(protect);

router.route('/')
  .get(getReminders)
  .post(validate(createReminderSchema), createReminder);

router.route('/:id')
  .get(getReminder)
  .put(validate(updateReminderSchema), updateReminder)
  .delete(deleteReminder);

router.patch('/:id/toggle', toggleReminder);

module.exports = router;

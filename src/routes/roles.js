'use strict';

const router              = require('express').Router();
const { getRoles }        = require('../controllers/rolesController');

// GET /api/roles  — public, no auth needed
router.get('/', getRoles);

module.exports = router;

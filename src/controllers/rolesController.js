'use strict';

const prisma                     = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/roles
 * Returns all active roles ordered by sortOrder.
 * Public — no auth required.
 *
 * Uses prisma.role if the Prisma client has been regenerated after the Role
 * model was added; falls back to raw SQL otherwise so the endpoint always works.
 */
const getRoles = async (req, res, next) => {
  try {
    let roles;

    if (prisma.role) {
      // Prisma client is up-to-date
      roles = await prisma.role.findMany({
        where:   { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select:  { slug: true, name: true, description: true, icon: true },
      });
    } else {
      // Prisma client not yet regenerated — use raw SQL
      roles = await prisma.$queryRawUnsafe(
        `SELECT "slug","name","description","icon"
         FROM "Role"
         WHERE "isActive" = true
         ORDER BY "sortOrder" ASC`,
      );
    }

    return sendSuccess(res, 200, 'Roles fetched', roles);
  } catch (error) {
    next(error);
  }
};

module.exports = { getRoles };

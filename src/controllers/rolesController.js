'use strict';

const prisma                     = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/roles
 * Returns all active roles ordered by sortOrder.
 * Public — no auth required.
 *
 * Query params:
 *   ?excludeUser=true  (default true) — omits the 'user' slug so the
 *                      professional registration screen never shows it.
 */
const getRoles = async (req, res, next) => {
  try {
    const excludeUser = req.query.excludeUser !== 'false'; // default: exclude

    let roles;

    if (prisma.role) {
      roles = await prisma.role.findMany({
        where: {
          isActive: true,
          ...(excludeUser ? { slug: { not: 'user' } } : {}),
        },
        orderBy: { sortOrder: 'asc' },
        // ── id MUST be included so Flutter can send roleId (UUID) on register ──
        select: { id: true, slug: true, name: true, description: true, icon: true },
      });
    } else {
      // Prisma client not yet regenerated — raw SQL fallback
      const where = excludeUser
        ? `WHERE "isActive" = true AND "slug" != 'user'`
        : `WHERE "isActive" = true`;
      roles = await prisma.$queryRawUnsafe(
        `SELECT "id","slug","name","description","icon"
         FROM "Role"
         ${where}
         ORDER BY "sortOrder" ASC`,
      );
    }

    return sendSuccess(res, 200, 'Roles fetched', roles);
  } catch (error) {
    next(error);
  }
};

module.exports = { getRoles };

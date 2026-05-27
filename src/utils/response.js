'use strict';

/**
 * Send a uniform success response.
 * @param {import('express').Response} res
 * @param {number}  statusCode
 * @param {string}  message
 * @param {*}       data
 * @param {object}  [meta]  – pagination, totals, etc.
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const body = { success: true, message };
  if (data  !== null) body.data = data;
  if (meta  !== null) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Send a uniform error response.
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * Build pagination meta from Mongoose count + query params.
 */
const paginationMeta = ({ total, page, limit }) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

module.exports = { sendSuccess, sendError, paginationMeta };

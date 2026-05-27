'use strict';

const { sendError } = require('../utils/response');

/**
 * Generic Joi validation middleware factory.
 *
 * Usage:
 *   router.post('/route', validate(schema), controller)
 *
 * @param {import('joi').Schema} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field:   d.context?.key || d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return sendError(res, 422, 'Validation failed', errors);
  }

  req[source] = value;   // replace with sanitised/defaulted values
  next();
};

module.exports = validate;

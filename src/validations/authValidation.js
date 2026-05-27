'use strict';

const Joi = require('joi');

const firebaseLoginSchema = Joi.object({
  firebaseToken: Joi.string().required().messages({
    'string.empty': 'Firebase ID token is required',
    'any.required': 'Firebase ID token is required',
  }),
  phone: Joi.string().trim().optional(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { firebaseLoginSchema, refreshTokenSchema };

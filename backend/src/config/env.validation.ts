import * as Joi from 'joi';

export default (config: Record<string, unknown>) => {
  const schema = Joi.object({
    NODE_ENV: Joi.string().valid('development','production','test').default('development'),
    PORT: Joi.number().default(3001),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('7d'),
  });

  const { error, value } = schema.validate(config, { allowUnknown: true });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
};

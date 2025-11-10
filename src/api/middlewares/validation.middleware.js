const { ValidationError } = require('../../utils/errors');
const logger = require('../../utils/logger');

function validate(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      logger.warn('Validation failed', {
        path: req.path,
        errors: error.errors,
      });

      const details = error.errors?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      next(
        new ValidationError('Invalid request data', {
          errors: details,
        })
      );
    }
  };
}

module.exports = validate;


export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.query);
    Object.defineProperty(req, 'query', {
      value: parsed,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    next();
  } catch (error) {
    next(error);
  }
};
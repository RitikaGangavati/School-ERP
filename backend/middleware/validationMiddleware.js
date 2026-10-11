const validate = (schema, source = "body") => {
  const middleware = (req, res, next) => {
    // Fail loudly if a route passes a missing schema (wrong import name / missing export)
    if (!schema) {
      return next(
        new Error(`validate(): schema is undefined for ${req.method} ${req.originalUrl}`)
      );
    }

    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Express 5: req.query is read-only, so plain assignment is silently ignored.
    // Define it as an own property on the request instead.
    if (source === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    } else {
      req[source] = result.data;
    }

    next();
  };

  // Metadata read by the Swagger generator (docs/swagger.js)
  middleware.schema = schema;
  middleware.source = source;
  return middleware;
};

module.exports = { validate };
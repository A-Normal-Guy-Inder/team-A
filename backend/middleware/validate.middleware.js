const ApiError = require("../utils/ApiError");

/**
 * Declarative request validation.
 *
 * A schema maps a request source (`body`, `params`, `query`) to
 * `{ field: [rule, rule, ...] }`. Every field is checked so the client gets the
 * full picture in one round-trip instead of one error at a time.
 *
 *   validate({ body: { title: [rules.required("Title"), rules.string("Title", { max: 120 })] } })
 */
function validate(schema) {
    const sources = Object.keys(schema);

    return function validateRequest(req, res, next) {
        const errors = {};

        for (const source of sources) {
            const fields = schema[source];
            const payload = req[source] || {};

            for (const [field, fieldRules] of Object.entries(fields)) {
                for (const rule of fieldRules) {
                    const message = rule(payload[field], payload, req);
                    if (message) {
                        errors[field] = message;
                        break; // first failure per field is enough
                    }
                }
            }
        }

        if (Object.keys(errors).length) {
            const [firstMessage] = Object.values(errors);
            return next(ApiError.badRequest(firstMessage, errors));
        }

        return next();
    };
}

module.exports = validate;

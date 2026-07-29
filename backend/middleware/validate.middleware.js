const ApiError = require("../utils/ApiError");

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
                        break;
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

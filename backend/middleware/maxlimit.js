const rateLimit = require("express-rate-limit")

const coLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: 'Nombre de tentatives autorisées dépassé'
})

module.exports = { coLimiter }

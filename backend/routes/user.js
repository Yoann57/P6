const express = require('express');
const router = express.Router();
const maxconnection = require("../middleware/maxlimit")

const userCtrl = require('../controllers/user');

router.post('/signup', userCtrl.signup);
router.post('/login', maxconnection.coLimiter, userCtrl.login);

module.exports = router;
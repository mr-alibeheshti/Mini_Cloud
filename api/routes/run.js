
const express = require('express');
const router = express.Router();
const RunController = require('../controller/run');

const runController = new RunController();

router.post('/', (req, res, next) => runController.run(req, res, next));
module.exports = router;

const express = require('express');
const router = express.Router();
const DockerController = require('../controller/container');

const dockerController = new DockerController();

router.post('/start-all', (req, res, next) => dockerController.startAll(req, res, next));
router.post('/stop-all', (req, res, next) => dockerController.stopAll(req, res, next));
router.post('/ps/', (req, res, next) => dockerController.ps(req, res, next));
router.post('/inspect/:containerId', (req, res, next) => dockerController.inspect(req, res, next));
router.post('/start/:containerId', (req, res, next) => dockerController.start(req, res, next));
router.post('/stop/:containerId', (req, res, next) => dockerController.stop(req, res, next));





module.exports = router;

const express = require('express');
const router = express.Router();
const ContainerController = require('../controller/container');

const containerController = new ContainerController();

router.post('/start-all', (req, res, next) => containerController.startAll(req, res, next));
router.post('/stop-all', (req, res, next) => containerController.stopAll(req, res, next));
router.post('/ps/', (req, res, next) => containerController.ps(req, res, next));
router.post('/inspect/:containerId', (req, res, next) => containerController.inspect(req, res, next));
router.post('/start/:containerId', (req, res, next) => containerController.start(req, res, next));
router.post('/stop/:containerId', (req, res, next) => containerController.stop(req, res, next));
router.post('/remove/:containerId', (req, res, next) => containerController.remove(req, res, next));
router.post('/update/:containerId', (req, res, next) => containerController.update(req, res, next));
router.post('/log/:containerId', (req, res, next) => containerController.log(req, res, next));
router.post('/stat/:containerId', (req, res, next) => containerController.stat(req, res, next));

module.exports = router;

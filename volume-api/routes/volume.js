const express = require('express');
const router = express.Router();
const VolumeController = require('../controller/volume');

const volumeController = new VolumeController();

router.post('/add/:volumeName', (req, res, next) => volumeController.add(req, res, next));
router.post('/remove/:volumeName', (req, res, next) => volumeController.remove(req, res, next));
router.get('/ps', (req, res, next) => volumeController.ps(req, res, next));
router.get('/inspect/:volumeName', (req, res, next) => volumeController.inspect(req, res, next));

module.exports = router;

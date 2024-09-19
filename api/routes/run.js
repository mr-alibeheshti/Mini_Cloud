const express = require('express');
const router = express.Router();
const RunController = require('../controller/run');

const runController = new RunController();

router.post('/', async (req, res, next) => {
  try {
    const { imageName, hostPort, containerPort, cpu, volume, environment, memory, domain } = req.query;
    
    const result = await runController.createService(imageName, hostPort, containerPort, cpu, volume, environment, memory, domain);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;



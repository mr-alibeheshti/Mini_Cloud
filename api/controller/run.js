const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

class RunController {
  constructor() {
    this.docker = docker;
  }

  async run(req, res, next) {
    try {
      const { imageName, hostPort, containerPort, cpu, volume, environment, memory } = req.query;
      
      if (!imageName) {
        return res.status(400).send({ error: 'Image name is required.' });
      }

      if (!hostPort || !containerPort) {
        return res.status(400).send({ error: 'Both hostPort and containerPort are required.' });
      }

      const query = { cpu, volume, environment, memory };
      const data = await this.runContainer(imageName, hostPort, containerPort, query);
      res.send(data);
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  }

  async runContainer(imageName, hostPort, containerPort, query) {
    const ports = [hostPort, containerPort];
    if (!ports || ports.length !== 2) {
      throw new Error('Invalid or missing port format. Use the format host:container, e.g., 8080:80.');
    }

    const cpuPercent = query.cpu ?? 10;
    const cpuPeriod = 1000000;
    const cpuQuota = Math.round((cpuPeriod * cpuPercent) / 100);

    let memoryBytes = (query.memory ? parseInt(query.memory) * 1024 * 1024 : 512 * 1024 * 1024);

    let volumeBindings = [];
    if (query.volume) {
      const volumes = query.volume.split(':');
      if (volumes.length !== 2) {
        throw new Error('Invalid volume format. Use the format hostPath:containerPath.');
      }
      volumeBindings.push(query.volume);
    }

    try {
      await new Promise((resolve, reject) => {
        docker.pull(imageName, (err, stream) => {
          if (err) {
            return reject(err);
          }
            if (err) {
              return reject(err);
            }
            resolve();
        });
      });
      const container = await docker.createContainer({
        Image: imageName,
        ExposedPorts: { [`${containerPort}/tcp`]: {} },
        HostConfig: {
          PortBindings: { [`${containerPort}/tcp`]: [{ HostPort: hostPort }] },
          CpuQuota: cpuQuota,
          CpuPeriod: cpuPeriod,
          Binds: volumeBindings,
          Memory: memoryBytes,
        },
        Env: query.environment ? query.environment.split(',').map((env) => env.trim()) : [],
      });

      await container.start();
      return { message: 'Container started successfully', containerId: container.id };
    } catch (err) {
      throw new Error(`Error running container: ${err.message}`);
    }
  }
}

module.exports = RunController;

const Docker = require('dockerode');
const axios = require('axios');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

class ContainerController {
  constructor() {
    this.docker = docker;
  }

  async run(req, res, next) {
    try {
      const imageName = req.params.imageName;
      const flags = req.body.query;
      const data = await this.runContainer(imageName, flags);
      res.send(data);
    } catch (err) {
      next(err);
    }
  }

  async runContainer(imageName, flags) {
    const ports = [80,80];
    if (ports.length !== 2) {
      throw new Error('Invalid port format. Use the format host:container, e.g., 8080:80.');
    }

    const [HostPort, ContainerPort] = ports;
    // const envArray = flags.environment ? flags.environment.split(',').map((env) => env.trim()) : [];
    // const cpuPercent = flags.cpu ?? 10;
    const cpuPeriod = 1000000;
    const cpuQuota = Math.round((cpuPeriod * cpuPercent) / 100);

    let volumeBindings = [];
    if (flags.volume) {
      const volumes = flags.volume.split(':');
      if (volumes.length !== 2) {
        throw new Error('Invalid volume format. Use the format hostPath:containerPath.');
      }
      volumeBindings.push(flags.volume);
    }

    try {
      await new Promise((resolve, reject) => {
        docker.pull(imageName, (err, stream) => {
          if (err) {
            return reject(err);
          }
          docker.modem.followProgress(stream, (err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        });
      });

      // Assuming there's more code here to run the container...
    } catch (err) {
      throw new Error(`Error running container: ${err.message}`);
    }
  }

  async log(req, res, next) {
    try {
      const containerId = req.params.containerId;
      const data = await this.getContainerLogs(containerId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  async getContainerLogs(containerId) {
    try {
      const query = `{logs="container_id"} |= "${containerId}"`;
      const response = await axios.get('http://localhost:3100/loki/api/v1/query_range', {
        params: {
          query: query,
          limit: 100,
        },
      });

      const logs = response.data.data.result;
      const logArray = [];

      if (logs.length === 0) {
        logArray.push('No logs found');
      } else {
        logs.forEach((log) => {
          log.values.forEach((value) => {
            const logTime = new Date(parseInt(value[0], 10) / 1000000).toISOString();
            logArray.push(`[${logTime}] ${value[1]}`);
          });
        });
      }

      return logArray;
    } catch (error) {
      console.error(`Error fetching logs for container ${containerId}:`, error.message);
      throw new Error(`Error fetching logs for container ${containerId}: ${error.message}`);
    }
  }

  async inspect(req, res, next) {
    try {
      const containerId = req.params.containerId;
      const data = await this.inspectContainer(containerId);
      res.json({ message: 'Process completed', data });
    } catch (err) {
      next(err);
    }
  }

  async stat(req, res, next) {
    try {
      const containerId = req.params.containerId;
      const data = await this.getContainerStat(containerId);
      res.json({ message: 'Process completed', data });
    } catch (err) {
      next(err); 
    }
  }

  async start(req, res, next) {
    try {
      const containerId = req.params.containerId;
      const data = await this.startContainer(containerId);
      res.json({ message: 'Process completed', data });
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const isForce = req.query.force === 'true';
      const containerId = req.params.containerId;
      const data = await this.removeContainer(containerId, isForce);
      res.json({ message: 'Process completed', data });
    } catch (err) {
      next(err);
    }
  }

  async stop(req, res, next) {
    try {
      const containerId = req.params.containerId;
      const data = await this.stopContainer(containerId);
      res.json({ message: 'Process completed', data });
    } catch (err) {
      next(err);
    }
  }

  async ps(req, res, next) {
    try {
      const showAll = req.query.all === 'true';
      const results = [];
      const containers = await this.listContainers({ all: showAll });

      for (const container of containers) {
        try {
          results.push({
            containerName: container.Names,
            containerId: container.Id,
            containerStatus: container.Status,
            Image: container.Image
          });
        } catch (err) {
          results.push({
            containerId: container.Id,
            status: 'failed',
            error: err.message
          });
        }
      }

      res.json({ message: 'Process completed', results });
    } catch (err) {
      next(err);
    }
  }

  async startAll(req, res, next) {
    try {
      const results = [];
      const containers = await this.listContainers({ all: true });

      for (const container of containers) {
        try {
          await this.startContainer(container.Id);
          results.push({ containerId: container.Id, status: 'started' });
        } catch (err) {
          results.push({
            containerId: container.Id,
            status: 'failed',
            error: err.message
          });
        }
      }

      res.send(results);
    } catch (err) {
      next(err);
    }
  }

  async stopAll(req, res, next) {
    try {
      const results = [];
      const containers = await this.listContainers({ all: true });

      for (const container of containers) {
        try {
          await this.stopContainer(container.Id);
          results.push({ containerId: container.Id, status: 'Stopped' });
        } catch (err) {
          results.push({
            containerId: container.Id,
            status: 'failed',
            error: err.message
          });
        }
      }

      res.send(results);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { containerId } = req.params;
      const { ram, cpu } = req.query;

      await this.updateContainer(containerId, ram, cpu);
      res.json({ message: 'Container updated successfully' });
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  }

  async updateContainer(containerId, ram, cpu) {
    try {
      const data = await this.inspectContainer(containerId);
      const imageName = data.Config.Image;
      const ports = data.HostConfig.PortBindings || {};
      const env = data.Config.Env || [];
      const volumes = data.Volumes || {};

      await this.pullImage(imageName);

      await this.stopContainer(containerId);
      await this.removeContainer(containerId);

      const updatedHostConfig = {
        Binds: Object.keys(volumes).map(volume => `${volume}:${volume}`),
        Memory: ram ? ram * 1024 * 1024 : undefined,
      };

      if (cpu !== undefined) {
        const cpuPercent = cpu;
        const cpuPeriod = 1000000;
        updatedHostConfig.CpuQuota = Math.round((cpuPeriod * cpuPercent) / 100);
        updatedHostConfig.CpuPeriod = cpuPeriod;
      }

      await this.createContainer({
        Image: imageName,
        ExposedPorts: data.Config.ExposedPorts || {},
        HostConfig: updatedHostConfig,
        Env: env,
      });
    } catch (err) {
      throw new Error(`Error updating container ${containerId}: ${err.message}`);
    }
  }

  async createContainer(options) {
    return new Promise((resolve, reject) => {
      docker.createContainer(options, (createErr, newContainer) => {
        if (createErr) return reject(new Error(`Error creating container: ${createErr.message}`));
        if (!newContainer) return reject(new Error(`Failed to create new container`));
        newContainer.start((startErr) => {
          if (startErr) return reject(new Error(`Error starting updated container: ${startErr.message}`));
          this.log(`Updated and started container`);
          resolve();
        });
      });
    });
  }

  async pullImage(imageName) {
    return new Promise((resolve, reject) => {
      docker.pull(imageName, (pullErr, stream) => {
        if (pullErr) return reject(new Error(`Error pulling image ${imageName}: ${pullErr.message}`));
        docker.modem.followProgress(stream, (progressErr) => {
          if (progressErr) return reject(new Error(`Error pulling image ${imageName}: ${progressErr.message}`));
          resolve();
        });
      });
    });
  }

  async inspectContainer(containerId) {
    return new Promise((resolve, reject) => {
      const container = docker.getContainer(containerId);
      container.inspect((err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
  }

  async stopContainer(containerId) {
    return new Promise((resolve, reject) => {
      const container = docker.getContainer(containerId);
      container.stop((err) => {
        if (err) return reject(err);
        resolve({ message: 'Container stopped' });
      });
    });
  }

  async removeContainer(containerId, isForce = false) {
    return new Promise((resolve, reject) => {
      const container = docker.getContainer(containerId);
      container.remove({ force: isForce }, (err) => {
        if (err) return reject(err);
        resolve({ message: 'Container removed' });
      });
    });
  }

  async listContainers(options = {}) {
    return new Promise((resolve, reject) => {
      docker.listContainers(options, (err, containers) => {
        if (err) return reject(err);
        resolve(containers);
      });
    });
  }

  async startContainer(containerId) {
    return new Promise((resolve, reject) => {
      const container = docker.getContainer(containerId);
      container.start((err) => {
        if (err) return reject(err);
        resolve({ message: 'Container started' });
      });
    });
  }
}

module.exports = ContainerController;

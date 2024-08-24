const Docker = require('dockerode');
const axios = require('axios');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

class ContainerController {
  constructor() {
    this.docker = docker;
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
          if (progressErr) return reject(new Error(`Error updating image ${imageName}: ${progressErr.message}`));
          resolve();
        });
      });
    });
  }

  async listContainers(options) {
    try {
      const containers = await this.docker.listContainers(options);
      return containers;
    } catch (err) {
      throw new Error(`Error listing containers: ${err.message}`);
    }
  }

  async removeContainer(containerId, isForce) {
    const container = docker.getContainer(containerId);
    return new Promise((resolve, reject) => {
      container.remove({ force: isForce }, (removeErr) => {
        if (removeErr) return reject(new Error(`Error removing container ${containerId}: ${removeErr.message}`));
        this.log(`Removed container ${containerId}`);
        resolve();
      });
    });
  }

  async inspectContainer(containerId) {
    try {
      const container = this.docker.getContainer(containerId);
      return await container.inspect();
    } catch (err) {
      throw new Error(`Error inspecting container ${containerId}: ${err.message}`);
    }
  }

  async startContainer(containerId, volumeName) {
    try {
      const container = this.docker.getContainer(containerId);
      const data = await this.inspectContainer(containerId);

      if (data.State.Running) {
        this.log(`Container ${containerId} is already running.`);
        return;
      }

      const binds = volumeName ? [`${volumeName}:${data.Config.WorkingDir || '/app'}`] : [];

      if (binds.length > 0) {
        await container.update({
          HostConfig: {
            Binds: binds
          }
        });
      }

      await new Promise((resolve, reject) => {
        container.start((err) => {
          if (err) return reject(new Error(`Error starting container ${containerId}: ${err.message}`));
          this.log(`Started container ${containerId} with volume ${volumeName}`);
          resolve();
        });
      });
    } catch (err) {
      throw new Error(`Error in startContainer: ${err.message}`);
    }
  }

  async stopContainer(containerId) {
    const container = docker.getContainer(containerId);
    return new Promise((resolve, reject) => {
      container.stop((stopErr) => {
        if (stopErr && stopErr.statusCode !== 304) {
          return reject(new Error(`Error stopping container ${containerId}: ${stopErr.message}`));
        }
        if (stopErr && stopErr.statusCode === 304) {
          this.log(`Container ${containerId} is already stopped, attempting to force stop...`);
          container.kill((killErr) => {
            if (killErr) return reject(new Error(`Error force stopping container ${containerId}: ${killErr.message}`));
            this.log(`Force stopped container ${containerId}`);
            resolve();
          });
        } else {
          this.log(`Stopped container ${containerId}`);
          resolve();
        }
      });
    });
  }

  async getContainerStat(containerId) {
    try {
      const [cpuResponse, memoryResponse, maxMemoryResponse, diskResponse, memoryLimitResponse] = await Promise.all([
        axios.get('http://localhost:9090/api/v1/query', {
          params: {
            query: `rate(container_cpu_usage_seconds_total{name="${containerId}"}[1m]) * 100`,
          },
        }),
        axios.get('http://localhost:9090/api/v1/query', {
          params: {
            query: `container_memory_usage_bytes{name="${containerId}"}`,
          },
        }),
        axios.get('http://localhost:9090/api/v1/query', {
          params: {
            query: `container_memory_max_usage_bytes{name="${containerId}"}`,
          },
        }),
        axios.get('http://localhost:9090/api/v1/query', {
          params: {
            query: `container_fs_usage_bytes{name="${containerId}"}`
          },
        }),
        axios.get('http://localhost:9090/api/v1/query', {
          params: {
            query: `container_spec_memory_limit_bytes{name="${containerId}"}`
          },
        }),
      ]);

      return {
        cpuUsagePercentage: parseFloat(cpuResponse.data.data.result[0]?.value[1] || '0').toFixed(6),
        memoryUsageMB: (parseFloat(memoryResponse.data.data.result[0]?.value[1] || '0') / (1024 * 1024)).toFixed(2),
        maxMemoryUsageMB: (parseFloat(maxMemoryResponse.data.data.result[0]?.value[1] || '0') / (1024 * 1024)).toFixed(2),
        diskUsageMB: (parseFloat(diskResponse.data.data.result[0]?.value[1] || '0') / (1024 * 1024)).toFixed(2),
        memoryLimitMB: (parseFloat(memoryLimitResponse.data.data.result[0]?.value[1] || '0') / (1024 * 1024 * 10000000)).toFixed(2),
      };
    } catch (error) {
      throw new Error(`Error fetching stats for container ${containerId}: ${error.message}`);
    }
  }

}

module.exports = ContainerController;

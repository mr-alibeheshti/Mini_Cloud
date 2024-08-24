const Docker = require('dockerode');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

class DockerController {
  constructor() {
    this.docker = docker;
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
  async start(req, res, next) {
    try {
      const containerId = req.params.containerId; 
      const data = await this.startContainer(containerId);
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
          results.push({ containerName: container.Names,containerId:container.Id,containerStatus:container.Status,Image:container.Image});
        } catch (err) {
          results.push({ containerId: container.Id, status: 'failed', error: err.message });
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
          results.push({ containerId: container.Id, status: 'failed', error: err.message });
        }
      }

      res.send(results)
    } catch (err) {
      next(err);
    }
  }
  async stopAll(req,res,next) {
    const results = [];
        const containers = await this.listContainers({ all: true });
        for (const container of containers) {
            try {
              await this.stopContainer(container.Id);
              results.push({ containerId: container.Id, status: 'Stoped' });
            } catch (err) {
              results.push({ containerId: container.Id, status: 'failed', error: err.message });
            }
          }
      res.send(results)
    }
    
  async listContainers(options) {
    try {
      const containers = await this.docker.listContainers(options);
      console.log('Containers:', containers);
      return containers;
    } catch (err) {
      throw new Error(`Error listing containers: ${err.message}`);
    }
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

async stopContainer(containerId){
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
            // if (.remove) this.removeContainer(containerId);
            resolve();
          });
        } else {
          this.log(`Stopped container ${containerId}`);
        //   if (flags.remove) this.removeContainer(containerId);
          resolve();
        }
      });
    });
  }

  log(message) {
    console.log(message);
  }
}

module.exports = DockerController;

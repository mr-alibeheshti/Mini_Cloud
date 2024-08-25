const Docker = require('dockerode');
const axios = require('axios');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

class VolumeController {
  constructor() {
    this.docker = docker;
  }

  async add(req, res, next) {
    try {
        const volumeName = req.params.volumeName
        const mountPoint = req.query.mountPoint
        const data = await this.createVolume(volumeName, mountPoint)
        res.send(data)
    } catch (err) {
      next(err);
    }
  }
  async remove(req, res, next) {
    try {
        const volumeName = req.params.volumeName
        const data = await this.removeVolume(volumeName)
        res.send(data)
    } catch (err) {
      next(err);
    }
  }
  async ps(req, res, next) {
    try {
        const data = await this.listVolumes()
        res.send(data)
    } catch (err) {
      next(err);
    }
  }
  async inspect(req, res, next) {
    try {
        const volumeName = req.params.volumeName
        const data = await this.inspectVolume(volumeName)
        res.send(data)
    } catch (err) {
      next(err);
    }
  }
  
    async createVolume(volumeName, mountPoint, driver = 'local'){
    const volumeConfig = {
      Name: volumeName,
      Driver: driver,
      DriverOpts: driver === 'local' && mountPoint ? {
        type: 'volume',
        o: `bind`,
        device: mountPoint,
      } : undefined,
    };
  
    try {
      await docker.createVolume(volumeConfig);
      return(`Created volume ${volumeName}`);
    } catch (err) {
      throw new Error(`Error creating volume ${volumeName}: ${err.message}`);
    }
  }

   async removeVolume(volumeName){
    try {
      await docker.getVolume(volumeName).remove();
      return(`Removed volume ${volumeName}`);
    } catch (err) {
      throw new Error(`Error removing volume ${volumeName}: ${err.message}`);
    }
  }

  async listVolumes() {
    try {
      const volumes = await docker.listVolumes();
      const volumesArray = [];
  
      if (volumes.Volumes) {
        volumes.Volumes.forEach((volume) => {
          volumesArray.push({
            Name: volume.Name,
            Driver: volume.Driver
          });
        });
      } else {
        this.log('No volumes found');
      }
      return volumesArray;
    } catch (err) {
      throw new Error(`Error listing volumes: ${err.message}`);
    }
  }
  


   async inspectVolume(volumeName) {
    try {
      const volume = docker.getVolume(volumeName);
      const data = await volume.inspect();
      return(JSON.stringify(data, null, 2));
    } catch (err) {
      throw new Error(`Error inspecting volume ${volumeName}: ${err.message}`);
    }
  }
}
module.exports = VolumeController;

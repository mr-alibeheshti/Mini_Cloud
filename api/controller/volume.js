const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

class VolumeController {
  constructor() {
    this.docker = docker;
  }

  async add(req, res, next) {
    try {
      const volumeName = req.params.volumeName;
      const mountPoint = req.query.mountPoint;
      const sizeLimitation = req.query.sizelimit;
      const data = await this.createVolume(volumeName, mountPoint, sizeLimitation);
      res.send(data);
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      const volumeName = req.params.volumeName;
      const data = await this.removeVolume(volumeName);
      res.send(data);
    } catch (err) {
      next(err);
    }
  }

  async ps(req, res, next) {
    try {
      const data = await this.listVolumes();
      res.send(data);
    } catch (err) {
      next(err);
    }
  }

  async inspect(req, res, next) {
    try {
      const volumeName = req.params.volumeName;
      const data = await this.inspectVolume(volumeName);
      res.send(data);
    } catch (err) {
      next(err);
    }
  }

  async createVolume(volumeName, mountPoint, sizeLimitation, driver = 'local') {
    const volumeConfig = {
      Name: volumeName,
      Driver: driver,
      DriverOpts: driver === 'local' && mountPoint ? {
        type: 'volume',
        o: 'bind',
        device: mountPoint,
      } : undefined,
    };

    try {
      const sizeLimit = sizeLimitation ? `${sizeLimitation}G` : '1G';
      const loopFilePath = path.join('/Volumes/', `Useremail@gmail.com_${volumeName}.loop`);

      execSync(`truncate -s ${sizeLimit} ${loopFilePath}`, { stdio: 'inherit' });

      execSync(`sudo chmod 666 ${loopFilePath}`, { stdio: 'inherit' });

      execSync(`mkfs.ext4 ${loopFilePath}`, { stdio: 'inherit' });

      if (!fs.existsSync(mountPoint)) {
        execSync(`sudo mkdir -p ${mountPoint}`, { stdio: 'inherit' });
      }

      execSync(`sudo chmod 777 ${mountPoint}`, { stdio: 'inherit' });

      execSync(`sudo mount ${loopFilePath} ${mountPoint}`, { stdio: 'inherit' });

      return `Created volume Useremail@gmail.com_${volumeName} with ${sizeLimitation} size and mounted to ${mountPoint}`;
    } catch (err) {
      throw new Error(`Error creating volume Useremail@gmail.com_${volumeName}: ${err.message}`);
    }
  }

  async removeVolume(volumeName) {
    try {
      await docker.getVolume(volumeName).remove();
      return `Removed volume ${volumeName}`;
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
      return JSON.stringify(data, null, 2);
    } catch (err) {
      throw new Error(`Error inspecting volume ${volumeName}: ${err.message}`);
    }
  }
}

module.exports = VolumeController;

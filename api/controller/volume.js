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
      const sizeLimitation = req.query.sizeLimit;
      console.log('its    dadsad' + req.query.sizeLimit);
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
      res.send({ message: data });
    } catch (err) {
      next(err);
    }
  }

  
  async createVolume(volumeName, sizeLimitation) {
    await docker.createVolume({
      Name: volumeName,
      Driver: 'local', 
    });
  
    const mountPoint = `/var/lib/docker/volumes/${volumeName}/_data`;
  
    try {
      const sizeLimit = sizeLimitation ? `${sizeLimitation}G` : '1G';
      const loopFilePath = path.join('/Volumes/', `Useremail@gmail.com_${volumeName}.loop`);
  
      console.log(`Creating loopback file at ${loopFilePath} with size ${sizeLimit}`);
      execSync(`truncate -s ${sizeLimit} ${loopFilePath}`, { stdio: 'inherit' });
  
      console.log(`Setting permissions for ${loopFilePath}`);
      execSync(`chmod 666 ${loopFilePath}`, { stdio: 'inherit' });
  
      console.log(`Formatting ${loopFilePath} as ext4`);
      execSync(`mkfs.ext4 ${loopFilePath}`, { stdio: 'inherit' });
  
      if (!fs.existsSync(mountPoint)) {
        console.log(`Creating mount point at ${mountPoint}`);
        execSync(`mkdir -p ${mountPoint}`, { stdio: 'inherit' });
      }
  
      console.log(`Setting permissions for mount point ${mountPoint}`);
      execSync(`chmod 777 ${mountPoint}`, { stdio: 'inherit' });
  
      console.log(`Mounting ${loopFilePath} to ${mountPoint}`);
      execSync(`mount ${loopFilePath} ${mountPoint}`, { stdio: 'inherit' });
  
      console.log(`Creating Docker volume with name ${volumeName}`);
  
      return {
        message: `Created volume Useremail@gmail.com_${volumeName} with size ${sizeLimitation}G and mounted to ${mountPoint}`,
      };
    } catch (err) {
      throw new Error(`Error creating volume Useremail@gmail.com_${volumeName}: ${err.message}`);
    }
  }
    async removeVolume(volumeName) {
    try {
      const loopFilePath = path.join('/Volumes/', `Useremail@gmail.com_${volumeName}.loop`);
      const volumeMountPoint = `/path/to/mount/${volumeName}`; 

      console.log(`Unmounting ${volumeMountPoint}`);
      execSync(` umount ${volumeMountPoint}`, { stdio: 'inherit' });

      console.log(`Removing Docker volume ${volumeName}`);
      await this.docker.getVolume(volumeName).remove();

      console.log(`Deleting loopback file ${loopFilePath}`);
      execSync(` rm -f ${loopFilePath}`, { stdio: 'inherit' });

      return `Removed volume ${volumeName}`;
    } catch (err) {
      throw new Error(`Error removing volume ${volumeName}: ${err.message}`);
    }
  }
}

module.exports = VolumeController;
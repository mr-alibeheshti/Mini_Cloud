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
      const sizeLimitation = req.query.sizelimit ? `${req.query.sizelimit}G` : '2G';
      const data = await this.createVolume(volumeName, sizeLimitation);
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

  async createVolume(volumeName, sizeLimitation) {
    try {
      await docker.createVolume({
        Name: volumeName,
        Driver: 'local', 
      });
      execSync(`sudo lvcreate -L ${sizeLimitation} -n ${volumeName} minicloudVolume -y`)
      execSync(`sudo mkfs.ext4 /dev/minicloudVolume/${volumeName} `)
      execSync(`sudo mount /dev/minicloudVolume/${volumeName} /var/lib/docker/volumes/${volumeName}/_data`)
      execSync(`sudo rmdir /var/lib/docker/volumes/${volumeName}/_data/lost+found`)
      return `Created volume ${volumeName} with size ${sizeLimitation ? sizeLimitation + 'G' : 'default'}`;
    } catch (err) {
      throw new Error(`Error creating volume ${volumeName}: ${err.message}`);
    }
  }

  async removeVolume(volumeName) {
    try {
      const volume = docker.getVolume(volumeName);
      await volume.remove();
      return `Removed volume ${volumeName}`;
    } catch (err) {
      throw new Error(`Error removing volume ${volumeName}: ${err.message}`);
    }
  }

  async listVolumes() {
    try {
      const volumes = await docker.listVolumes();
      return volumes.Volumes || [];
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

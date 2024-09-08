const Docker = require('dockerode');
const axios = require('axios');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class ContainerController {
  constructor() {
    this.docker = docker;
  }
  async changeDomain(req, res) {
    const { currentDomain, newDomain } = req.body;

    if (!currentDomain || !newDomain) {
      return res.status(400).send({ error: 'Both currentDomain and newDomain are required.' });
    }

    try {
      const formattedCurrentDomain = currentDomain;
      const formattedNewDomain = newDomain;

      const hostsFilePath = '/etc/hosts';
      let hostsFileContent = await fs.readFile(hostsFilePath, 'utf8');

      if (!hostsFileContent.includes(formattedCurrentDomain)) {
        return res.status(400).send({ error: `Domain ${formattedCurrentDomain} not found in ${hostsFilePath}` });
      }

      hostsFileContent = hostsFileContent.replace(new RegExp(`127.0.0.1 ${formattedCurrentDomain}`, 'g'), `127.0.0.1 ${formattedNewDomain}`);
      await fs.writeFile(hostsFilePath, hostsFileContent);
      console.log(`Updated domain in ${hostsFilePath}`);

      const nginxAvailablePath = '/etc/nginx/sites-available';
      const nginxEnabledPath = '/etc/nginx/sites-enabled';
      const currentNginxConfigPath = path.join(nginxAvailablePath, formattedCurrentDomain);
      const newNginxConfigPath = path.join(nginxAvailablePath, formattedNewDomain);
      const currentNginxConfigLink = path.join(nginxEnabledPath, formattedCurrentDomain);
      const newNginxConfigLink = path.join(nginxEnabledPath, formattedNewDomain);

      if (fs.existsSync(currentNginxConfigLink)) {
        await fs.unlink(currentNginxConfigLink);
        console.log(`Removed old Nginx symlink at ${currentNginxConfigLink}`);
      }

      if (fs.existsSync(newNginxConfigLink)) {
        await fs.unlink(newNginxConfigLink);
        console.log(`Removed existing Nginx symlink at ${newNginxConfigLink}`);
      }

      if (!fs.existsSync(currentNginxConfigPath)) {
        return res.status(400).send({ error: `Nginx configuration for ${formattedCurrentDomain} not found.` });
      }

      let nginxConfigContent = await fs.readFile(currentNginxConfigPath, 'utf8');

      const portMatch = nginxConfigContent.match(/proxy_pass http:\/\/localhost:(\d+);/);
      if (!portMatch) {
        return res.status(400).send({ error: 'Could not find port in the current Nginx configuration.' });
      }
      const currentPort = portMatch[1];

      nginxConfigContent = nginxConfigContent
        .replace(new RegExp(formattedCurrentDomain, 'g'), formattedNewDomain)
        .replace(`proxy_pass http://localhost:${currentPort};`, `proxy_pass http://localhost:${currentPort};`);

      await fs.writeFile(newNginxConfigPath, nginxConfigContent);
      console.log(`Created new Nginx config at ${newNginxConfigPath}`);

      await fs.symlink(newNginxConfigPath, newNginxConfigLink);
      console.log(`Created new Nginx symlink at ${newNginxConfigLink}`);

      const certPath = `/etc/nginx/ssl/${formattedNewDomain}`;
      await fs.ensureDir(certPath);

      const certFile = path.join(certPath, 'cert.pem');
      const keyFile = path.join(certPath, 'key.pem');

      if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
        execSync(`mkcert -key-file ${keyFile} -cert-file ${certFile} ${formattedNewDomain}`);
        console.log(`SSL certificate created for domain ${formattedNewDomain} at ${certPath}.`);
      } else {
        console.log(`SSL certificate already exists for domain ${formattedNewDomain}.`);
      }

      const sslNginxConfig = `
server {
    listen 443 ssl;
    server_name ${formattedNewDomain};

    ssl_certificate ${certFile};
    ssl_certificate_key ${keyFile};

    location / {
        proxy_pass http://localhost:${currentPort};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

      const sslNginxConfigPath = path.join(nginxAvailablePath, `${formattedNewDomain}`);
      await fs.writeFile(sslNginxConfigPath, sslNginxConfig);
      console.log(`Nginx SSL configuration for ${formattedNewDomain} created at ${sslNginxConfigPath}`);

      execSync('sudo nginx -t');
      execSync('sudo nginx -s reload');
      console.log('Nginx reloaded');

      res.send({ message: `Domain successfully changed from ${formattedCurrentDomain} to ${formattedNewDomain}` });
    } catch (err) {
      console.error(`Failed to change domain: ${err.message}`);
      res.status(500).send({ error: `Failed to change domain: ${err.message}` });
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
          results.push({ containerId: container.Id, status: 'stopped' });
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
        resolve();
      });
    });
  }

  async removeContainer(containerId, force) {
    return new Promise((resolve, reject) => {
      const container = docker.getContainer(containerId);
      container.remove({ force }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async listContainers(options) {
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
        resolve();
      });
    });
  }

  async getContainerStat(containerId) {
    return new Promise((resolve, reject) => {
      const container = docker.getContainer(containerId);
      container.stats({ stream: false }, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
  }
  async execShell(containerId, ws) {
    try {
      const container = docker.getContainer(containerId);
      const exec = await new Promise((resolve, reject) => {
        container.exec({
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
          Cmd: ['bash'],
        }, (err, execInstance) => {
          if (err) return reject(err);
          resolve(execInstance);
        });
      });

      const stream = await new Promise((resolve, reject) => {
        exec.start({ hijack:true,stdin: true }, (err, execStream) => {
          if (err) return reject(err);
          resolve(execStream);
        });
      });

      stream.on('data', (chunk) => {
        ws.send(chunk);
      });

      stream.on('end', () => {
        ws.close();
      });

      stream.on('error', (streamErr) => {
        ws.send(`Stream Error: ${streamErr.message}`);
      });

      ws.on('message', (message) => {
        stream.write(message);
      });

      ws.on('close', () => {
        stream.end();
      });

      ws.on('error', (wsErr) => {
        stream.end();
        console.error(`WebSocket Error: ${wsErr.message}`);
      });

    } catch (err) {
      ws.send(`Error: ${err.message}`);
      ws.close();
    }
  }

}  

module.exports = ContainerController;

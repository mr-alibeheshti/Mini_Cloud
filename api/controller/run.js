const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const net = require('net');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

class RunController {
  constructor() {
    this.docker = docker;
  }

  generateRandomSubdomain() {
    return Math.random().toString(36).substring(2, 7);
  }

  async isDomainConfiguredInNginx(domain) {
    const nginxAvailablePath = '/etc/nginx/sites-available';
    const nginxEnabledPath = '/etc/nginx/sites-enabled';
    const nginxConfigPath = path.join(nginxAvailablePath, domain);
    const nginxConfigLink = path.join(nginxEnabledPath, domain);

    return fs.existsSync(nginxConfigPath) || fs.existsSync(nginxConfigLink);
  }

  async isPortInUse(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      server.once('listening', () => {
        server.close();
        resolve(false);
      });
      server.listen(port);
    });
  }

  async isDomainInUse(domain, port) {
    const isDomainConfigured = await this.isDomainConfiguredInNginx(domain);
    const isPortUsed = await this.isPortInUse(port);
    return isDomainConfigured || isPortUsed;
  }

  async run(req, res, next) {
    try {
      const { imageName, hostPort, containerPort, cpu, volume, environment, memory, domain } = req.query;

      if (!imageName) {
        return res.status(400).send({ error: 'Image name is required.' });
      }

      if (!hostPort || !containerPort) {
        return res.status(400).send({ error: 'Both hostPort and containerPort are required.' });
      }

      const domainInUse = await this.isDomainInUse(domain, hostPort);
      if (domain && domainInUse) {
        return res.status(400).send({ error: `Domain ${domain} is already in use. Please choose a different domain.` });
      }

      const query = { cpu, volume, environment, memory };
      const data = await this.runContainer(imageName, hostPort, containerPort, domain, query);

      res.send(data);
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  }

  async runContainer(imageName, hostPort, containerPort, domain, query) {
    console.log("Received domain in runContainer method:", domain);

    const cpuPercent = query.cpu ?? 10;
    const cpuPeriod = 1000000;
    const cpuQuota = Math.round((cpuPeriod * cpuPercent) / 100);

    let memoryBytes = (query.memory ? parseInt(query.memory) * 1024 * 1024 : 512 * 1024 * 1024);

    let volumeBindings = [];
    if (query.volume) {
      const volumes = query.volume.split(',');
      volumes.forEach(volume => {
        const [hostPath, containerPath] = volume.split(':');
        if (hostPath && containerPath) {
          volumeBindings.push(`${hostPath}:${containerPath}`);
        } else {
          throw new Error('Invalid volume format. Use the format hostPath:containerPath.');
        }
      });
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

      if (!domain) {
        domain = `${this.generateRandomSubdomain()}.minicloud.local`;
        console.log("Generated random subdomain:", domain);
      } else {
        console.log("Using provided domain:", domain);
      }

      const hostsFilePath = '/etc/hosts';
      const domainEntry = `127.0.0.1 ${domain}`;

      try {
        const hostsFileContent = await fs.readFile(hostsFilePath, 'utf8');
        if (hostsFileContent.includes(domainEntry)) {
          console.log(`Domain ${domain} already exists in ${hostsFilePath}.`);
        } else {
          await fs.appendFile(hostsFilePath, `\n${domainEntry}`);
          console.log(`Domain ${domain} added to ${hostsFilePath}`);
        }
      } catch (err) {
        console.error(`Failed to add domain to ${hostsFilePath}:`, err.message);
        throw new Error(`Failed to add domain to ${hostsFilePath}: ${err.message}`);
      }

      await this.setupNginx(domain, hostPort);

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
      return { message: `Container started successfully. Your container is accessible at http://${domain}`, containerId: container.id };

    } catch (err) {
      throw new Error(`Error running container: ${err.message}`);
    }
  }

  async setupNginx(domain, hostPort) {
    const nginxAvailablePath = '/etc/nginx/sites-available';
    const nginxEnabledPath = '/etc/nginx/sites-enabled';
  
    await fs.ensureDir(nginxAvailablePath);
    await fs.ensureDir(nginxEnabledPath);
  
    const nginxConfigLinkPath = path.join(nginxEnabledPath, domain);
  
    try {
      if (fs.existsSync(nginxConfigLinkPath)) {
        await fs.unlink(nginxConfigLinkPath);
      }
    } catch (err) {
      console.error(`Failed to set up Nginx for ${domain}:`, err.message);
      throw new Error(`Failed to set up Nginx for ${domain}: ${err.message}`);
    }
  
    const nginxConfig = `
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://${domain}:${hostPort};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
  
    const nginxConfigPath = path.join(nginxAvailablePath, `${domain}`);
    const nginxEnabledConfigLink = path.join(nginxEnabledPath, `${domain}`);
  
    try {
      if (fs.existsSync(nginxEnabledConfigLink)) {
        await fs.unlink(nginxEnabledConfigLink);
      }
  
      await fs.writeFile(nginxConfigPath, nginxConfig);
      console.log(`Nginx configuration for ${domain} created at ${nginxConfigPath}`);
  
      await fs.symlink(nginxConfigPath, nginxEnabledConfigLink);
      console.log(`Nginx configuration symlink created at ${nginxEnabledConfigLink}`);
  
      execSync('nginx -t');
      execSync('sudo systemctl restart nginx.service', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        console.log(`Nginx reloaded and ${domain} is now accessible.`);
      });

    } catch (err) {
      console.error(`Failed to set up Nginx for ${domain}:`, err.message);
      throw new Error(`Failed to set up Nginx for ${domain}: ${err.message}`);
    }
  }
}

module.exports = RunController;

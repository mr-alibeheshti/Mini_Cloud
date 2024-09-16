const Docker = require('dockerode');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
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

    return fs.access(nginxConfigPath).then(() => true).catch(() => false) ||
           fs.access(nginxConfigLink).then(() => true).catch(() => false);
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
      const data = await this.runService(imageName, hostPort, containerPort, domain, query);
  
      res.send(data);
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  }
  

  async runService(imageName, hostPort, containerPort, domain, query) {
    const cpuPercent = query.cpu ?? 10;
    const cpuLimit = Math.round(cpuPercent * 100000000);
  
    const memoryBytes = (query.memory ? parseInt(query.memory) * 1024 * 1024 : 512 * 1024 * 1024);
  
    let volumeBindings = [];
    if (query.volume) {
      const volumes = query.volume.split(',');
      volumes.forEach(volume => {
        const [hostPath, containerPath] = volume.split(':');
        if (hostPath && containerPath) {
          volumeBindings.push({ Type: 'bind', Source: hostPath, Target: containerPath });
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
      }
  
      const hostsFilePath = '/etc/hosts';
      const domainEntry = `127.0.0.1 ${domain}`;
  
      try {
        const hostsFileContent = await fs.readFile(hostsFilePath, 'utf8');
        if (!hostsFileContent.includes(domainEntry)) {
          await fs.appendFile(hostsFilePath, `\n${domainEntry}`);
        }
      } catch (err) {
        throw new Error(`Failed to add domain to ${hostsFilePath}: ${err.message}`);
      }
  
      await this.setupNginx(domain, hostPort);
  
      const service = await docker.createService({
        Name: `my_service_${this.generateRandomSubdomain()}`,
        TaskTemplate: {
          ContainerSpec: {
            Image: imageName,
            Env: query.environment ? query.environment.split(',').map((env) => env.trim()) : [],
            Mounts: volumeBindings,
          },
          Resources: {
            Limits: {
              MemoryBytes: memoryBytes,
              NanoCPUs: cpuLimit,
            },
          },
        },
        EndpointSpec: {
          Ports: [
            {
              Protocol: 'tcp',
              TargetPort: parseInt(containerPort),
              PublishedPort: parseInt(hostPort),
            },
          ],
        },
        Mode: {
          Replicated: {
            Replicas: 1,
          },
        },
      });
  
      return { message: `Service created successfully. Your service is accessible at http://${domain}`, serviceId: service.id };
  
    } catch (err) {
      throw new Error(`Error running service: ${err.message}`);
    }
  }
  
  

  async setupNginx(domain, hostPort) {
    const nginxAvailablePath = '/etc/nginx/sites-available';
    const nginxEnabledPath = '/etc/nginx/sites-enabled';
  
    await fs.mkdir(nginxAvailablePath, { recursive: true });
    await fs.mkdir(nginxEnabledPath, { recursive: true });
  
    const nginxConfigLinkPath = path.join(nginxEnabledPath, domain);
  
    try {
      if (await fs.stat(nginxConfigLinkPath).catch(() => false)) {
        await fs.unlink(nginxConfigLinkPath);
      }
    } catch (err) {
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
      if (await fs.stat(nginxEnabledConfigLink).catch(() => false)) {
        await fs.unlink(nginxEnabledConfigLink);
      }
  
      await fs.writeFile(nginxConfigPath, nginxConfig);
      await fs.symlink(nginxConfigPath, nginxEnabledConfigLink);
  
      exec('nginx -t', (error, stdout, stderr) => {
        if (error) {
          console.error(`Nginx test error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Nginx test stderr: ${stderr}`);
          return;
        }
        console.log(`Nginx test stdout: ${stdout}`);
  
        exec('sudo systemctl restart nginx.service', (error, stdout, stderr) => {
          if (error) {
            console.error(`Restart error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`Restart stderr: ${stderr}`);
            return;
          }
          console.log(`Nginx restarted successfully. ${domain} is now accessible.`);
        });
      });

    } catch (err) {
      throw new Error(`Failed to set up Nginx for ${domain}: ${err.message}`);
    }
  }
}

module.exports = RunController;

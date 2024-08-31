const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

class RunController {
  constructor() {
    this.docker = docker;
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
      const volumes = query.volume.split(':');
      if (volumes.length !== 2) {
        throw new Error('Invalid volume format. Use the format hostPath:containerPath.');
      }
      volumeBindings.push(query.volume);
    }

    try {
      // Pull the Docker image
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

      if (domain) {
        domain = `${domain}.minicloud.local`;

        console.log("Processing domain:", domain);

        const hostsFilePath = '/etc/hosts';
        const domainEntry = `127.0.0.1 ${domain}`;

        try {
          const hostsFileContent = await fs.readFile(hostsFilePath, 'utf8');
          if (hostsFileContent.includes(domainEntry)) {
            console.log(`Domain ${domain} already exists in ${hostsFilePath}. Skipping deployment.`);
            return { message: `Domain ${domain} already exists. Deployment skipped.` };
          }

          await fs.appendFile(hostsFilePath, `\n${domainEntry}`);
          console.log(`Domain ${domain} added to ${hostsFilePath}`);
        } catch (err) {
          console.error(`Failed to add domain to ${hostsFilePath}:`, err.message);
          throw new Error(`Failed to add domain to ${hostsFilePath}: ${err.message}`);
        }

        const nginxConfig = `
          server {
              listen 80;
              server_name ${domain};

              location / {
                  proxy_pass http://localhost:${hostPort}; 
                  proxy_set_header Host $host;
                  proxy_set_header X-Real-IP $remote_addr;
                  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                  proxy_set_header X-Forwarded-Proto $scheme;
              }
          }`;

        const nginxAvailablePath = '/etc/nginx/sites-available';
        const nginxEnabledPath = '/etc/nginx/sites-enabled';

        await fs.ensureDir(nginxAvailablePath);
        await fs.ensureDir(nginxEnabledPath);

        const nginxConfigPath = path.join(nginxAvailablePath, domain);
        const nginxConfigLink = path.join(nginxEnabledPath, domain);

        try {
          if (fs.existsSync(nginxConfigLink)) {
            await fs.unlink(nginxConfigLink);
          }

          await fs.writeFile(nginxConfigPath, nginxConfig);
          console.log(`Nginx configuration for ${domain} created at ${nginxConfigPath}`);

          await fs.symlink(nginxConfigPath, nginxConfigLink);
          console.log(`Nginx configuration symlink created at ${nginxConfigLink}`);

          execSync('sudo nginx -t');  // Test Nginx configuration
          execSync('sudo nginx -s reload');  // Reload Nginx
          console.log(`Nginx reloaded and ${domain} is now active`);

        } catch (err) {
          console.error(`Failed to set up Nginx for ${domain}:`, err.message);
          throw new Error(`Failed to set up Nginx for ${domain}: ${err.message}`);
        }

      } else {
        console.log("No domain provided");
      }

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
      return { message: 'Container started successfully', containerId: container.id };

    } catch (err) {
      throw new Error(`Error running container: ${err.message}`);
    }
  }
}

module.exports = RunController;

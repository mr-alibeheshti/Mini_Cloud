const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
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
      if(domain){
      if (domainInUse) {
        return res.status(400).send({ error: `Domain ${domain} is already in use. Please choose a different domain.` });
      }}

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

      await this.setupNginxAndSSL(domain, hostPort);

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
      return { message: `Container started successfully. Your container is accessible at https://${domain}`, containerId: container.id };

    } catch (err) {
      throw new Error(`Error running container: ${err.message}`);
    }
  }

  async setupNginxAndSSL(domain, hostPort) {
    const nginxAvailablePath = '/etc/nginx/sites-available';
    const nginxEnabledPath = '/etc/nginx/sites-enabled';

    await fs.ensureDir(nginxAvailablePath);
    await fs.ensureDir(nginxEnabledPath);

    const nginxConfigLink = path.join(nginxEnabledPath, domain);

    try {
      if (fs.existsSync(nginxConfigLink)) {
        await fs.unlink(nginxConfigLink);
      }

    } catch (err) {
      console.error(`Failed to set up Nginx for ${domain}:`, err.message);
      throw new Error(`Failed to set up Nginx for ${domain}: ${err.message}`);
    }

    const certPath = `/etc/nginx/ssl/${domain}`;
    await fs.ensureDir(certPath);
    execSync(`mkcert -key-file ${certPath}/key.pem -cert-file ${certPath}/cert.pem ${domain}`);
    console.log(`SSL certificate created for domain ${domain} at ${certPath}.`);

    const sslNginxConfig = `
server {
    listen 443 ssl;
    server_name ${domain};

    ssl_certificate ${certPath}/cert.pem;
    ssl_certificate_key ${certPath}/key.pem;

    location / {
        proxy_pass http://localhost:${hostPort};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

    const sslNginxConfigPath = path.join(nginxAvailablePath, `${domain}`);
    const sslNginxConfigLink = path.join(nginxEnabledPath, `${domain}`);

    try {
      if (fs.existsSync(sslNginxConfigLink)) {
        await fs.unlink(sslNginxConfigLink);
      }

      await fs.writeFile(sslNginxConfigPath, sslNginxConfig);
      console.log(`Nginx SSL configuration for ${domain} created at ${sslNginxConfigPath}`);

      await fs.symlink(sslNginxConfigPath, sslNginxConfigLink);
      console.log(`Nginx SSL configuration symlink created at ${sslNginxConfigLink}`);

      execSync('sudo nginx -t');
      execSync('sudo systemctl reload nginx');
      console.log(`Nginx reloaded and ${domain} is now accessible via HTTPS.`);
    } catch (err) {
      console.error(`Failed to set up Nginx SSL for ${domain}:`, err.message);
      throw new Error(`Failed to set up Nginx SSL for ${domain}: ${err.message}`);
    }
  }
}

module.exports = RunController;
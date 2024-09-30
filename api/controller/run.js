const Docker = require('dockerode');
const { MongoClient } = require('mongodb');
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const mongoUri = 'mongodb://mongo:27017';
const mongoClient = new MongoClient(mongoUri);
const fs = require('fs').promises;
const path = require('path');
const { exec, execSync } = require('child_process');
class RunController {
  constructor() {
    this.docker = docker;
    this.mongoClient = mongoClient;
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



  async connectToMongoDB() {
    try {
      await this.mongoClient.connect();
      console.log('Connected to MongoDB');
    } catch (err) {
      throw new Error(`Failed to connect to MongoDB: ${err.message}`);
    }
  }

  async saveServiceToDatabase(serviceInfo) {
    const db = this.mongoClient.db('minicloud');
    const collection = db.collection('services');
  
    const nodeToIpMap = {
      'ukpdlf75x9scy32y8plwsd2x6': '192.168.100.204',
      'au8bz22241dukrrso8o0x5hp4': '192.168.100.120',
      'jaratge5vg5jaw2alsr38o70o': '192.168.100.111',
    };
  
    try {
      const nodeId = serviceInfo.nodeId;

      const ipAddress = nodeToIpMap[nodeId] || 'N/A';
  
      const serviceWithIp = { ...serviceInfo, ipAddress };
  
      await collection.insertOne(serviceWithIp);
      console.log('Service information saved to MongoDB');
    } catch (err) {
      throw new Error(`Failed to save service to MongoDB: ${err.message}`);
    }
  }
  

  async createService(imageName, hostPort, containerPort, cpu, volume, environment, memory, domain) {
    if (!imageName) {
      throw new Error('Image name must be provided');
    }
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

    const hostPortInt = parseInt(hostPort, 10);
    const containerPortInt = parseInt(containerPort, 10);
    const serviceName = `my_service_${Math.random().toString(36).substring(2, 7)}`;
    await this.addUpstreamConfig(serviceName, hostPort);
    await this.setupNginx(domain, serviceName);

    const service = await this.docker.createService({
      Name: serviceName,
      TaskTemplate: {
        ContainerSpec: {
          Image: imageName,
          Env: environment ? environment.split(',').map((env) => env.trim()) : [],
          Mounts: volume ? volume.split(',').map((vol) => {
            const [source, target] = vol.split(':');
            return { Type: 'bind', Source: source, Target: target };
          }) : [],
          Resources: {
            Limits: {
              MemoryBytes: memory ? parseInt(memory) * 1024 * 1024 : 512 * 1024 * 1024,
              NanoCPUs: cpu ? Math.round(cpu * 100000000) : 100000000,
            },
          },
        },
        Networks: [{ Target: 'my_network' }],
      },
      EndpointSpec: {
        Ports: [{ Protocol: 'tcp', TargetPort: containerPortInt, PublishedPort: hostPortInt }],
      },
    });

    console.log('Service created successfully');

    await new Promise((resolve) => setTimeout(resolve, 5000));
    
    let tasks = await this.docker.listTasks({ filters: { service: [service.id] } });
    while (tasks.some(task => task.Status.State !== 'running')) {
      console.log('Waiting for the service to be fully running...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      tasks = await this.docker.listTasks({ filters: { service: [service.id] } });
    }

    const tasksInfo = tasks.map(task => ({
      containerId: task.Status.ContainerStatus?.ContainerID || 'N/A',
      nodeId: task.NodeID,
      serviceName: serviceName,
      domain: domain,
    }));

    await this.connectToMongoDB();
    await Promise.all(tasksInfo.map(task => this.saveServiceToDatabase(task)));

    return { message: 'Service created and tasks information saved to MongoDB', tasksInfo };
  }
 catch (err) {
      console.error(err);
      throw new Error(`Error creating service: ${err.message}`);
    }
    async addUpstreamConfig(serviceName, hostPort) {
      const nginxConfPath = '/etc/nginx/nginx.conf';
      const upstreamConfig = `
  upstream ${serviceName} {
      server 192.168.100.204:${hostPort};
      server 192.168.100.120:${hostPort};
      server 192.168.100.111:${hostPort};
  }
  `;
  
  try {
    const nginxConfContent = await fs.readFile(nginxConfPath, 'utf8');
    if (!nginxConfContent.includes(`upstream ${serviceName}`)) {
      const newNginxConfContent = nginxConfContent.replace(/http {/, `http {\n${upstreamConfig}`);
      await fs.writeFile(nginxConfPath, newNginxConfContent);
      console.log(`Added upstream ${serviceName} to nginx.conf`);
    }
  } catch (err) {
    throw new Error(`Failed to update nginx.conf: ${err.message}`);
  }
}

async setupNginx(domain, serviceName) {
  const nginxAvailablePath = '/etc/nginx/sites-available';
  const nginxEnabledPath = '/etc/nginx/sites-enabled';
  const certPath = "/etc/nginx/ssl";
  await fs.mkdir(nginxAvailablePath, { recursive: true });
  await fs.mkdir(nginxEnabledPath, { recursive: true });

  const nginxConfigPath = path.join(nginxAvailablePath, domain);
  const nginxConfigLink = path.join(nginxEnabledPath, domain);
  execSync(`cd /etc/nginx/ssl ; mkcert ${domain}`);

  const nginxConfig = 
  `server {
      listen 443 ssl;
      server_name ${domain};
  
      ssl_certificate /etc/nginx/ssl/${domain}.pem;
      ssl_certificate_key /etc/nginx/ssl/${domain}-key.pem;
  
      location / {
          proxy_pass http://${serviceName};
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }`;
  

  try {
    if (await fs.stat(nginxConfigLink).catch(() => false)) {
      await fs.unlink(nginxConfigLink);
    }

    await fs.writeFile(nginxConfigPath, nginxConfig);
    await fs.symlink(nginxConfigPath, nginxConfigLink);

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

      exec('systemctl restart nginx.service', (error, stdout, stderr) => {
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
import { Args, Command, Flags } from '@oclif/core';
import Docker, { ContainerInfo } from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export default class Containers extends Command {
  static args = {
    Operation: Args.string({
      description: 'Operation to perform on Docker containers (stopAll, stop, start, ps, remove, update, inspect)',
      required: true,
    }),
    ContainerId: Args.string({
      description: 'ID or Name of the Docker container',
      required: false,
    }),
  };

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Force stop containers',
      required: false,
    }),
    remove: Flags.boolean({
      char: 'r',
      description: 'Remove containers after stopping them',
      required: false,
    }),
    all: Flags.boolean({
      char: 'a',
      description: 'List all containers including stopped ones',
      required: false,
    }),
    volume: Flags.string({
      char: 'v',
      description: 'Path to volume to be mounted to the container',
      required: false,
    }),
  };

  static description = 'Run Docker operations such as stopping, removing, starting, updating, or listing containers on the server';

  static examples = [
    '<%= config.bin %> <%= command.id %> stopAll',
    '<%= config.bin %> <%= command.id %> startAll',
    '<%= config.bin %> <%= command.id %> stop <container_id> -f',
    '<%= config.bin %> <%= command.id %> ps -a',
    '<%= config.bin %> <%= command.id %> remove <container_id> -r',
    '<%= config.bin %> <%= command.id %> start <container_id>',
    '<%= config.bin %> <%= command.id %> update <container_id>',
    '<%= config.bin %> <%= command.id %> inspect <container_id>',
    '<%= config.bin %> <%= command.id %> start <container_id> -v /path/to/volume:/container/path',
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Containers);

    try {
      switch (args.Operation) {
        case 'startAll':
          await this.handleStartAll();
          break;

        case 'stopAll':
          await this.handleStopAll(flags);
          break;

        case 'stop':
          if (!args.ContainerId) throw new Error('Container ID is required for the stop operation.');
          await this.handleStop(args.ContainerId, flags);
          break;

        case 'start':
          if (!args.ContainerId) throw new Error('Container ID is required for the start operation.');
          await this.handleStart(args.ContainerId, flags.volume);
          break;

        case 'update':
          if (!args.ContainerId) {
            await this.handleUpdateAll();
          } else {
            await this.handleUpdate(args.ContainerId);
          }
          break;

        case 'ps':
          await this.handlePs(flags);
          break;

        case 'remove':
          if (!args.ContainerId) throw new Error('Container ID is required for the remove operation.');
          await this.handleRemove(args.ContainerId);
          break;

        case 'inspect':
          if (!args.ContainerId) throw new Error('Container ID is required for the inspect operation.');
          await this.handleInspect(args.ContainerId);
          break;

        default:
          throw new Error(`Invalid operation: ${args.Operation}. Supported operations are: startAll, stopAll, stop, start, ps, remove, update, inspect.`);
      }
    } catch (error: any) {
      this.error(error.message);
    }
  }

  private async handleStartAll(): Promise<void> {
    this.log('Starting all containers...');
    const containers = await this.listContainers({ all: true });
    for (const containerInfo of containers) {
      await this.startContainer(containerInfo.Id);
    }
  }

  private async handleStopAll(flags: any): Promise<void> {
    this.log('Stopping all containers...');
    const containers = await this.listContainers({ all: true });
    for (const containerInfo of containers) {
      await this.stopContainer(containerInfo.Id, flags);
    }
  }

  private async handleStop(containerId: string, flags: any): Promise<void> {
    this.log(`Stopping container ${containerId}...`);
    await this.stopContainer(containerId, flags);
  }

  private async handleStart(containerId: string, volume?: string): Promise<void> {
    this.log(`Starting container ${containerId}...`);
    await this.startContainer(containerId, volume);
  }

  private async handleUpdateAll(): Promise<void> {
    this.log('Updating all containers...');
    const containers = await this.listContainers({ all: true });
    for (const containerInfo of containers) {
      await this.updateContainer(containerInfo.Id);
    }
  }

  private async handleUpdate(containerId: string): Promise<void> {
    this.log(`Updating container ${containerId}...`);
    await this.updateContainer(containerId);
  }

  private async handlePs(flags: any): Promise<void> {
    this.log('Listing containers...');
    const containers = await this.listContainers({ all: flags.all || false });
    containers.forEach(containerInfo => {
      this.log(`ID: ${containerInfo.Id}, Image: ${containerInfo.Image}, Status: ${containerInfo.Status}, Name: ${containerInfo.Names}`);
    });
  }

  private async handleRemove(containerId: string): Promise<void> {
    this.log(`Removing container ${containerId}...`);
    await this.removeContainer(containerId);
  }

  private async handleInspect(containerId: string): Promise<void> {
    this.log(`Inspecting container ${containerId}...`);
    const data = await this.inspectContainer(containerId);
    this.log(JSON.stringify(data, null, 2));
  }

  private async listContainers(options: any): Promise<ContainerInfo[]> {
    return new Promise((resolve, reject) => {
      docker.listContainers(options, (err, containers: any) => {
        if (err) return reject(err);
        resolve(containers);
      });
    });
  }

  private async stopContainer(containerId: string, flags: any): Promise<void> {
    const container = docker.getContainer(containerId);
    return new Promise((resolve, reject) => {
      container.stop((stopErr: any) => {
        if (stopErr && stopErr.statusCode !== 304) {
          return reject(new Error(`Error stopping container ${containerId}: ${stopErr.message}`));
        }
        if (stopErr && stopErr.statusCode === 304 && flags.force) {
          this.log(`Container ${containerId} is already stopped, attempting to force stop...`);
          container.kill((killErr: any) => {
            if (killErr) return reject(new Error(`Error force stopping container ${containerId}: ${killErr.message}`));
            this.log(`Force stopped container ${containerId}`);
            if (flags.remove) this.removeContainer(containerId);
            resolve();
          });
        } else {
          this.log(`Stopped container ${containerId}`);
          if (flags.remove) this.removeContainer(containerId);
          resolve();
        }
      });
    });
  }

  private async startContainer(containerId: string, volumeName?: string): Promise<void> {
    const container = docker.getContainer(containerId);
    const data = await this.inspectContainer(containerId);

    const binds = volumeName ? [`${volumeName}:${data.Config.WorkingDir || '/app'}`] : [];

    if (binds.length > 0) {
        await container.update({
            HostConfig: {
                Binds: binds
            }
        });
    }

    return new Promise((resolve, reject) => {
        container.start((err: any) => {
            if (err) return reject(new Error(`Error starting container ${containerId}: ${err.message}`));
            this.log(`Started container ${containerId} with volume ${volumeName}`);
            resolve();
        });
    });
}



  private async removeContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    return new Promise((resolve, reject) => {
      container.remove({ force: true }, (removeErr: any) => {
        if (removeErr) return reject(new Error(`Error removing container ${containerId}: ${removeErr.message}`));
        this.log(`Removed container ${containerId}`);
        resolve();
      });
    });
  }

  private async updateContainer(containerId: string): Promise<void> {
    const container = docker.getContainer(containerId);
    const data = await this.inspectContainer(containerId);

    const imageName = data.Config.Image;
    const ports = data.HostConfig.PortBindings || {};
    const env = data.Config.Env || [];
    const volumes = data.Volumes || {};

    await this.pullImage(imageName);

    await this.stopContainer(containerId, {});
    await this.removeContainer(containerId);

    await this.createContainer({
      Image: imageName,
      ExposedPorts: data.Config.ExposedPorts || {},
      HostConfig: {
        PortBindings: ports,
        Binds: Object.keys(volumes).map(volume => `${volume}:${volume}`),
      },
      Env: env,
    });
  }

  private inspectContainer(containerId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      docker.getContainer(containerId).inspect((err: any, data: any) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
  }

  private pullImage(imageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      docker.pull(imageName, (pullErr: any, stream: any) => {
        if (pullErr) return reject(new Error(`Error pulling image ${imageName}: ${pullErr.message}`));
        docker.modem.followProgress(stream, (progressErr: any) => {
          if (progressErr) return reject(new Error(`Error updating image ${imageName}: ${progressErr.message}`));
          resolve();
        });
      });
    });
  }

  private createContainer(options: any): Promise<void> {
    return new Promise((resolve, reject) => {
      docker.createContainer(options, (createErr: any, newContainer: Docker.Container | undefined) => {
        if (createErr) return reject(new Error(`Error creating container: ${createErr.message}`));
        if (!newContainer) return reject(new Error(`Failed to create new container`));
        newContainer.start((startErr: any) => {
          if (startErr) return reject(new Error(`Error starting updated container: ${startErr.message}`));
          this.log(`Updated and started container`);
          resolve();
        });
      });
    });
  }
}

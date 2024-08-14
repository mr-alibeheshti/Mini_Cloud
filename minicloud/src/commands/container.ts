import { Args, Command, Flags } from '@oclif/core';
import Docker, { ContainerInfo } from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export default class Containers extends Command {
  static args = {
    Operation: Args.string({
      description: 'Operation to perform on Docker containers (stopAll, stop, start, ps, remove)',
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
  };

  static description = 'Run Docker operations such as stopping, removing, starting, or listing containers on the server';

  static examples = [
    '<%= config.bin %> <%= command.id %> stopAll',
    '<%= config.bin %> <%= command.id %> startAll',
    '<%= config.bin %> <%= command.id %> stop <container_id> -f',
    '<%= config.bin %> <%= command.id %> ps -a',
    '<%= config.bin %> <%= command.id %> remove <container_id> -r',
    '<%= config.bin %> <%= command.id %> start <container_id>',
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Containers);

    switch (args.Operation) {
      case 'startAll':
        this.log('Starting all containers...');
        docker.listContainers({ all: true }, (err, containers) => {
          if (err) {
            this.error(`Error listing containers: ${err.message}`);
            return;
          }
          containers!.forEach((containerInfo: ContainerInfo) => {
            const container = docker.getContainer(containerInfo.Id);
            container.start((startErr: any) => {
              if (startErr) {
                this.error(`Error starting container ${containerInfo.Id}: ${startErr.message}`);
              } else {
                this.log(`Started container ${containerInfo.Id}`);
              }
            });
          });
        });
        break;

      case 'stopAll':
        this.log('Stopping all containers...');
        docker.listContainers({ all: true }, (err, containers) => {
          if (err) {
            this.error(`Error listing containers: ${err.message}`);
            return;
          }
          containers!.forEach((containerInfo: ContainerInfo) => {
            const container = docker.getContainer(containerInfo.Id);
            container.stop((stopErr: any) => {
              if (stopErr && stopErr.statusCode !== 304) {
                this.error(`Error stopping container ${containerInfo.Id}: ${stopErr.message}`);
              } else if (stopErr && stopErr.statusCode === 304 && flags.force) {
                this.log(`Container ${containerInfo.Id} is already stopped, attempting to force stop...`);
                container.kill((killErr: any) => {
                  if (killErr) {
                    this.error(`Error force stopping container ${containerInfo.Id}: ${killErr.message}`);
                  } else {
                    this.log(`Force stopped container ${containerInfo.Id}`);
                    if (flags.remove) {
                      this.removeContainer(container);
                    }
                  }
                });
              } else {
                this.log(`Stopped container ${containerInfo.Id}`);
                if (flags.remove) {
                  this.removeContainer(container);
                }
              }
            });
          });
        });
        break;

      case 'stop':
        if (!args.ContainerId) {
          this.error('Container ID is required for the stop operation.');
          return;
        }
        this.log(`Stopping container ${args.ContainerId}...`);
        const stopContainer = docker.getContainer(args.ContainerId);
        stopContainer.stop((err: any) => {
          if (err && err.statusCode !== 304) {
            this.error(`Error stopping container ${args.ContainerId}: ${err.message}`);
          } else if (err && err.statusCode === 304 && flags.force) {
            this.log(`Container ${args.ContainerId} is already stopped, attempting to force stop...`);
            stopContainer.kill((killErr: any) => {
              if (killErr) {
                this.error(`Error force stopping container ${args.ContainerId}: ${killErr.message}`);
              } else {
                this.log(`Force stopped container ${args.ContainerId}`);
                if (flags.remove) {
                  this.removeContainer(stopContainer);
                }
              }
            });
          } else {
            this.log(`Stopped container ${args.ContainerId}`);
            if (flags.remove) {
              this.removeContainer(stopContainer);
            }
          }
        });
        break;

      case 'start':
        if (!args.ContainerId) {
          this.error('Container ID is required for the start operation.');
          return;
        }
        this.log(`Starting container ${args.ContainerId}...`);
        const startContainer = docker.getContainer(args.ContainerId);
        startContainer.start((err: any) => {
          if (err) {
            this.error(`Error starting container ${args.ContainerId}: ${err.message}`);
          } else {
            this.log(`Started container ${args.ContainerId}`);
          }
        });
        break;

      case 'ps':
        this.log('Listing containers...');
        docker.listContainers({ all: flags.all || false }, (err, containers) => {
          if (err) {
            this.error(`Error listing containers: ${err.message}`);
            return;
          }
          containers!.forEach((containerInfo: ContainerInfo) => {
            this.log(`ID: ${containerInfo.Id}, Image: ${containerInfo.Image}, Status: ${containerInfo.Status}`);
          });
        });
        break;

      case 'remove':
        if (!args.ContainerId) {
          this.error('Container ID is required for the remove operation.');
          return;
        }
        this.log(`Removing container ${args.ContainerId}...`);
        const removeContainer = docker.getContainer(args.ContainerId);
        this.removeContainer(removeContainer);
        break;

      default:
        this.error(`Invalid operation: ${args.Operation}. Supported operations are: startAll, stopAll, stop, start, ps, remove.`);
        break;
    }
  }

  private removeContainer(container: Docker.Container) {
    container.remove({ force: true }, (removeErr: any) => {
      if (removeErr) {
        this.error(`Error removing container ${container.id}: ${removeErr.message}`);
      } else {
        this.log(`Removed container ${container.id}`);
      }
    });
  }
}

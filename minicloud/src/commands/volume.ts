import { Args, Command, Flags } from '@oclif/core';
import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export default class Volume extends Command {
  static args = {
    Operation: Args.string({
      description: 'Operation to perform on Docker volumes (add, remove, removeAll, ps, inspect)',
      required: true,
    }),
    name: Args.string({ description: 'Name of Docker Volume or Container ID (for inspect)' }),
  };

  static flags = {
    mountPoint: Flags.string({ description: 'Storage location for volume (only for local driver)', char: 'm' }),
  };

  static description = 'Run Docker operations such as adding, removing, or listing volumes';

  static examples = [
    '<%= config.bin %> <%= command.id %> add myVolume -m /var/tmp/dockerme -d local',
    '<%= config.bin %> <%= command.id %> remove myVolume',
    '<%= config.bin %> <%= command.id %> removeAll',
    '<%= config.bin %> <%= command.id %> ps',
    '<%= config.bin %> <%= command.id %> inspect myVolume',
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Volume);

    try {
      switch (args.Operation) {
        case 'add':
          if (!args.name) {
            throw new Error("Volume name is required for 'add' operation.");
          }
          await this.createVolume(args.name, flags.mountPoint);
          break;
        case 'remove':
          if (!args.name) {
            throw new Error("Volume name is required for 'remove' operation.");
          }
          await this.removeVolume(args.name);
          break;
        case 'removeAll':
          await this.removeAllVolumes();
          break;
        case 'ps':
          await this.listVolumes();
          break;
        case 'inspect':
          if (!args.name) {
            throw new Error("Volume name is required for 'inspect' operation.");
          }
          await this.inspectVolume(args.name);
          break;
        default:
          this.error(`Invalid operation: ${args.Operation}. Supported operations are: add, remove, removeAll, ps, inspect.`);
      }
    } catch (error: any) {
      this.error(`An error occurred: ${error.message}`);
    }
  }

  private async createVolume(volumeName: string, mountPoint?: string, driver: string = 'local'): Promise<void> {
    const volumeConfig: Docker.VolumeCreateOptions = {
      Name: volumeName,
      Driver: driver,
      DriverOpts: driver === 'local' && mountPoint ? {
        type: 'bind',
        device: mountPoint,
        o: 'bind',
      } : undefined,
    };

    try {
      await docker.createVolume(volumeConfig);
      this.log(`Created volume ${volumeName}`);
    } catch (err: any) {
      throw new Error(`Error creating volume ${volumeName}: ${err.message}`);
    }
  }

  private async removeVolume(volumeName: string): Promise<void> {
    try {
      await docker.getVolume(volumeName).remove();
      this.log(`Removed volume ${volumeName}`);
    } catch (err: any) {
      throw new Error(`Error removing volume ${volumeName}: ${err.message}`);
    }
  }

  private async removeAllVolumes(): Promise<void> {
    try {
      const volumes = await this.listVolumes();
      for (const volume of volumes) {
        const isInUse = await this.checkIfVolumeInUse(volume.Name);
        if (!isInUse) {
          await this.removeVolume(volume.Name);
        } else {
          this.log(`Volume ${volume.Name} is in use and cannot be removed.`);
        }
      }
      this.log('Removed all unused volumes');
    } catch (err: any) {
      this.error(`Error removing all volumes: ${err.message}`);
    }
  }

  private async listVolumes(): Promise<Docker.VolumeInspectInfo[]> {
    try {
      const volumes = await docker.listVolumes();
      if (volumes.Volumes) {
        this.log('Docker Volumes:');
        volumes.Volumes.forEach((volume: Docker.VolumeInspectInfo) => {
          this.log(`- Name: ${volume.Name}, Driver: ${volume.Driver}`);
        });
        return volumes.Volumes;
      } else {
        this.log('No volumes found');
        return [];
      }
    } catch (err: any) {
      throw new Error(`Error listing volumes: ${err.message}`);
    }
  }

  private async checkIfVolumeInUse(volumeName: string): Promise<boolean> {
    try {
      const containers = await docker.listContainers({ all: true });
      return containers.some(container =>
        container.Mounts.some(mount => mount.Name === volumeName)
      );
    } catch (err: any) {
      throw new Error(`Error checking if volume is in use: ${err.message}`);
    }
  }

  private async inspectVolume(volumeName: string): Promise<void> {
    try {
      const volume = docker.getVolume(volumeName);
      const data = await volume.inspect();
      this.log(JSON.stringify(data, null, 2));
    } catch (err: any) {
      throw new Error(`Error inspecting volume ${volumeName}: ${err.message}`);
    }
  }
}

import { Args, Command, Flags } from '@oclif/core';
import Docker from 'dockerode';
import axios from 'axios';
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export default class Volume extends Command {
  static args = {
    Operation: Args.string({
      description: 'Operation to perform on Docker volumes (add, remove, ps, inspect)',
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
          try{
            const response = await axios.post(`http://127.0.0.1:3500/api/v1/volume/add/${args.name}/${flags.mountPoint ? `?mountPoint=${flags.mountPoint}` : ""}`)
            console.log('Response data:', response.data);
        } catch (error: any) {
          console.error('Error occurred:', error.message);
        }
          break;
        case 'remove':
          if (!args.name) {
            throw new Error("Volume name is required for 'add' operation.");
          }
          const response = await axios.post(`http://127.0.0.1:3500/api/v1/volume/remove/${args.name}/`)
          console.log('Response data:', response.data);
          break;
        case 'ps':
          const ps = await axios.get(`http://127.0.0.1:3500/api/v1/volume/ps`)
          console.log('Response data:', ps.data);
            break;
        case 'inspect':
          if (!args.name) {
            throw new Error("Volume name is required for 'inspect' operation.");
          }
          try{
            const response = await axios.get(`http://127.0.0.1:3500/api/v1/volume/inspect/${args.name}`)
            console.log('Response data:', response.data);
        } catch (error: any) {
          console.error('Error occurred:', error.message);
        }          break;
        default:
          this.error(`Invalid operation: ${args.Operation}. Supported operations are: add, remove, removeAll, ps, inspect.`);
      }
    } catch (error: any) {
      this.error(`An error occurred: ${error.message}`);
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

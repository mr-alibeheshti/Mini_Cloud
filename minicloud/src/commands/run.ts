import { Args, Command, Flags } from '@oclif/core';
<<<<<<< HEAD
import axios from 'axios';
=======
import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
>>>>>>> bfe2b53ca8a6e45b09f897a71f187187ac4afc2f

export default class Run extends Command {
  static args = {
    Image: Args.string({ description: 'Name of Docker Image in Docker Hub', required: true }),
  };

  static flags = {
    port: Flags.string({ description: 'Port of Host:Container', required: true, char: 'p' }),
    connectionType: Flags.string({ description: 'UDP/TCP, default: TCP', default: 'tcp', char: 't' }),
    name: Flags.string({ description: 'Custom name of Container', char: 'n' }),
    environment: Flags.string({ description: 'Environment data in format KEY=value,KEY2=value2', char: 'e' }),
    volume: Flags.string({ description: 'Volume mapping in format hostPath:containerPath', char: 'v' }),
    ram: Flags.integer({ description: 'Memory limit for the container in MB', char: 'r' }),
    cpu: Flags.integer({ description: 'CPU quota for the container as a percentage', char: 'c' }),
  };

  static description = 'Run your Docker image from Docker Hub on the server';



  async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);
    const [hostPort, containerPort] = flags.port.split(':');

    try {
<<<<<<< HEAD
      const response = await axios.post(`http://127.0.0.1:3500/api/v1/run?imageName=${args.Image}&hostPort=${hostPort}&containerPort=${containerPort}&cpu=${flags.cpu}&volume=${flags.volume}&environment=${flags.environment}&memory=${flags.ram}`);
      this.log('Response data:', response.data);
    } catch (error:any) {
      if (error.response && error.response.data && error.response.data.error) {
        const errorMessage = error.response.data.error;
        this.log('Error message:', errorMessage);
=======
      this.log(`Pulling image ${args.Image} from Docker Hub...`);
      await new Promise<void>((resolve, reject) => {
        docker.pull(args.Image, (err: any, stream: any) => {
          if (err) {
            return reject(err);
          }
          docker.modem.followProgress(stream,
            (err: any) => {
              if (err) {
                return reject(err);
              }
              this.log('Image pull finished successfully.');
              resolve();
            },
            (event: any) => {
              this.log(event.status);
            }
          );
        });
      });

      this.log(`Running image ${args.Image} on host port ${HostPort}...`);
      const container = await docker.createContainer({
        Image: args.Image,
        ExposedPorts: { [`${ContainerPort}/${connectionType}`]: {} },
        HostConfig: {
          Memory: flags.ram ? flags.ram * 1024 * 1024 : 25 * 1024 * 1024,
          CpuQuota: cpuQuota,
          CpuPeriod: cpuPeriod,
          PortBindings: { [`${ContainerPort}/${connectionType}`]: [{ HostPort }] },
          Binds: volumeBindings.length > 0 ? volumeBindings : undefined,
          LogConfig: {
            Type: "fluentd",
            Config: {
              "tag": "docker.{{.ID}}"
            }
          }
        },
        name: flags.name,
        Env: envArray,
      });
      await container.start();

      const logs = await container.logs({
        stdout: true,
        stderr: true,
        follow: true,
      });

      if (logs instanceof require('stream').Readable) {
        logs.on('data', (data: Buffer) => {
          this.log(data.toString());
        });
>>>>>>> bfe2b53ca8a6e45b09f897a71f187187ac4afc2f
      } else {
        this.log('Error:', error);
      }
    }
    
  }
}
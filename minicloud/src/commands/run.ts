import { Args, Command, Flags } from '@oclif/core';
import { Container } from 'dockerode';
import { env } from 'process';
import { getEnvironmentData } from 'worker_threads';
const Docker = require('dockerode');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export default class Run extends Command {
  static args = {
    port: Args.string({ description: 'Port Of Host:Container', required: true }),
    Image: Args.string({ description: 'Name of Docker Image in Docker Hub', required: true }),
    
  };
  static flags = {
    connectionType: Flags.string({ description: 'UDP/TCP, default: TCP', default: 'tcp',char: 'c'}),
    name: Flags.string({ description: 'Custom name of Conatainer',char: 'n'}),
    environment: Flags.string({ description: 'Environment data in format KEY=value,KEY2=value2', char: 'e' }),

  }

  static description = 'run Your Docker Image from Docker Hub on Server';

  static examples = [
    `<%= config.bin %> <%= command.id %> 80:80 -c udp -n myContainer httpd`,
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);
    const ports = args.port.split(':');
    if(ports.length != 2){
      this.error('Invalid port format. Use the format host:container, e.g., 8080:80.');
    }
    let HostPort = ports[0]
    let ContainerPort = ports[1]
    try {
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

      const connectionType = flags.connectionType.toLowerCase();
      let envArray: string[] = [];
      if (flags.environment) {
        envArray = flags.environment.split(',').map((env) => env.trim());
      }
      this.log(`Running image ${args.Image} on host port ${flags.host}...`);
      const container = await docker.createContainer({
        Image: args.Image,
        ExposedPorts: { [`${ContainerPort}/${connectionType}`]: {} },
        HostConfig: {
          PortBindings: { [`${ContainerPort}/${connectionType}`]: [{HostPort}] },
        },
        Tty: true,
        name : flags.name,
        env: envArray
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
      } else {
        this.log('Logs are not in expected format.');
      }

      await container.wait();

      this.log(`Container ${container.id} finished execution.`);
      await container.remove();
    } catch (error) {
      this.error(`Failed to run Docker image: ${error}`);
    }
  }
}

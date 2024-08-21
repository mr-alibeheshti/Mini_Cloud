import { Args, Command, Flags } from '@oclif/core';
import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

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

  static examples = [
    `<%= config.bin %> <%= command.id %> -p 80:80 -t tcp -n myContainer -r 640000000 -c 70 -v /host/path:/container/path httpd`,
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);

    const ports = flags.port.split(':');
    if (ports.length !== 2) {
      this.error('Invalid port format. Use the format host:container, e.g., 8080:80.');
    }

    const [HostPort, ContainerPort] = ports;
    const connectionType = flags.connectionType.toLowerCase();
    const envArray = flags.environment ? flags.environment.split(',').map((env) => env.trim()) : [];
    const cpuPercent = flags.cpu ?? 10;
    const cpuPeriod = 1000000;
    const cpuQuota = Math.round((cpuPeriod * cpuPercent) / 100);

    let volumeBindings: string[] = [];
    if (flags.volume) {
      const volumes = flags.volume.split(':');
      if (volumes.length !== 2) {
        this.error('Invalid volume format. Use the format hostPath:containerPath.');
      }
      volumeBindings.push(flags.volume);
    }

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
      } else {
        this.log('Logs are not in the expected format.');
      }
      await container.wait();
    } catch (error: any) {
      this.error(`Failed to run Docker image: ${error.message}`);
    }
  }
}

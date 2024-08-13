import { Args, Command } from '@oclif/core';
const Docker = require('dockerode');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export default class Deploy extends Command {
  static args = {
    Image: Args.string({ description: 'Name of Docker Image in Docker Hub', required: true }),
  };

  static description = 'Deploy Your Docker Image from Docker Hub on Server';

  static examples = [
    `<%= config.bin %> <%= command.id %> httpd`,
  ];

  async run(): Promise<void> {
    const { args } = await this.parse(Deploy);
    this.log(`You Selected ${args.Image}`);

    try {
      this.log(`Pulling image ${args.Image} from Docker Hub...`);
      await new Promise<void>((resolve, reject) => {
        docker.pull(args.Image, (err: any, stream: any) => {
          if (err) {
            return reject(err);
          }
          docker.modem.followProgress(stream, 
            (err: any, output: any) => {
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

      this.log(`Running image ${args.Image} on port 80...`);
      const container = await docker.createContainer({
        Image: args.Image,
        ExposedPorts: { '80/tcp': {} }, // Expose port 80
        HostConfig: {
          PortBindings: { '80/tcp': [{ HostPort: '80' }] }, // Bind container port 80 to host port 80
        },
        Tty: true,
        AttachStdin: true, 
        AttachStdout: true,
        AttachStderr: true
      });

      await container.start();

      const logs = await container.logs({
        stdout: true,
        stderr: true,
        follow: true
      });

      if (logs instanceof require('stream').Readable) {
        logs.on('data', (data: Buffer) => {
          this.log(data.toString());
        });
      } else {
        this.log('Logs are not in expected format.');
      }

      await container.wait();

      await container.remove();
    } catch (error) {
      this.error(`Failed to deploy Docker image: ${error}`);
    }
  }
}

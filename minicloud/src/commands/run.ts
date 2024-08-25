import { Args, Command, Flags } from '@oclif/core';
import axios from 'axios';

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
    `<%= config.bin %> <%= command.id %> -p 80:80 -t tcp -n myContainer -r 640 -c 70 -v /host/path:/container/path httpd`,
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);

    if (!flags.port || !flags.port.includes(':')) {
      this.error('Invalid port format. Use the format hostPort:containerPort.');
      return;
    }

    const [hostPort, containerPort] = flags.port.split(':');

    try {
      const response = await axios.post(`http://127.0.0.1:3500/api/v1/run?imageName=${args.Image}&hostPort=${hostPort}&containerPort=${containerPort}&cpu=${flags.cpu}&volume=${flags.volume}&environment=${flags.environment}&memory=${flags.ram}`);
      this.log('Response data:', response.data);
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        const errorMessage = error.response.data.error;
        this.log('Error message:', errorMessage);
      } else {
        this.log('Error:', error.message);
      }
    }
  }
}

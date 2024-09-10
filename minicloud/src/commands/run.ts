import { Args, Command, Flags } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../base-command';

export default class Run extends BaseCommand {
  static args = {
    Domain: Args.string({ description: 'Domain name for the container', required: false }),
    Image: Args.string({ description: 'Name of Docker Image in Docker Hub', required: true }),
  };

  static description = 'Run your Docker image from Docker Hub on the server with a domain';

  static examples = [
    `<%= config.bin %> <%= command.id %> -p 80:80 -t tcp -n myContainer -r 640 -c 70 -v /host/path:/container/path httpd mydomain`,
  ];

  static flags = {
    connectionType: Flags.string({ char: 't', default: 'tcp', description: 'UDP/TCP, default: TCP' }),
    cpu: Flags.integer({ char: 'c', description: 'CPU quota for the container as a percentage' }),
    environment: Flags.string({ char: 'e', description: 'Environment data in format KEY=value,KEY2=value2' }),
    name: Flags.string({ char: 'n', description: 'Custom name of Container' }),
    port: Flags.string({ char: 'p', description: 'Port of Host:Container', required: true }),
    ram: Flags.integer({ char: 'r', description: 'Memory limit for the container in MB' }),
    volume: Flags.string({ char: 'v', description: 'Volume mapping in format hostPath:containerPath', required: false }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);

    if (!flags.port || !flags.port.includes(':')) {
      this.error('Invalid port format. Use the format hostPort:containerPort.');
      return;
    }

    const [hostPort, containerPort] = flags.port.split(':');

    const imageName = encodeURIComponent(args.Image);
    const domain = args.Domain ? encodeURIComponent(args.Domain) : '';
    const cpu = flags.cpu ? `&cpu=${encodeURIComponent(flags.cpu.toString())}` : '';
    const memory = flags.ram ? `&memory=${encodeURIComponent(flags.ram.toString())}` : '';
    const volume = flags.volume ? `&volume=${encodeURIComponent(flags.volume)}` : '';
    const environment = flags.environment ? `&environment=${encodeURIComponent(flags.environment)}` : '';

    const url = `http://api.minicloud.local/api/v1/run?imageName=${imageName}&domain=${domain}&hostPort=${hostPort}&containerPort=${containerPort}${cpu}${memory}${volume}${environment}`;
    
    try {
      const response = await axios.post(url);
      this.log('Response data:', response.data);
    } catch (error) {
      this.handleError(error);
    }
  }
}

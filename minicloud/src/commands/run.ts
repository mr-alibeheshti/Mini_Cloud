import { Args, Command, Flags } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../base-command';

export default class Run extends BaseCommand {
  static args = {
    Image: Args.string({ description: 'Name of Docker Image in Docker Hub', required: true }),
    Domain: Args.string({ description: 'Domain name for the container', required: false }),
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
    port: Flags.integer({ char: 'p', description: 'Port of Container'}),
    ram: Flags.integer({ char: 'r', description: 'Memory limit for the container in MB' }),
    volume: Flags.string({ char: 'v', description: 'Volume mapping in format hostPath:containerPath', required: false }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);

    const imageName = (args.Image);
    const domain = args.Domain ? (args.Domain) : '';
    const cpu = flags.cpu ? `&cpu=${(flags.cpu.toString())}` : '';
    const memory = flags.ram ? `&memory=${(flags.ram.toString())}` : '';
    const containerPort = flags.port ? `&containerPort=${(flags.port)}` : '&containerPort=80';
    const volume = flags.volume ? `&volume=${(flags.volume)}` : '';
    const environment = flags.environment ? `&environment=${(flags.environment)}` : '';
    const url = `http://localhost:3500/api/v1/run?imageName=${imageName}${containerPort}&domain=${domain}${cpu}${memory}${volume}${environment}`;
    console.log(url);
    try {
      const response = await axios.post(url);
      this.log('Response data:', response.data);
    } catch (error) {
      this.handleError(error);
    }
  }
}

import { Args, Command, Flags } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../base-command';
export default class Run extends BaseCommand {
  static args = {
    Image: Args.string({ description: 'Name of Docker Image in Docker Hub', required: true }),
  };

  static description = 'Run your Docker image from Docker Hub on the server';

  static examples = [
    `<%= config.bin %> <%= command.id %> -p 80:80 -t tcp -n myContainer -r 640 -c 70 -v /host/path:/container/path httpd`,
  ];

  static flags = {
    connectionType: Flags.string({ char: 't', default: 'tcp', description: 'UDP/TCP, default: TCP' }),
    cpu: Flags.integer({ char: 'c', description: 'CPU quota for the container as a percentage' }),
    environment: Flags.string({ char: 'e', description: 'Environment data in format KEY=value,KEY2=value2' }),
    name: Flags.string({ char: 'n', description: 'Custom name of Container' }),
    port: Flags.string({ char: 'p', description: 'Port of Host:Container', required: true }),
    ram: Flags.integer({ char: 'r', description: 'Memory limit for the container in MB' }),
    volume: Flags.string({ char: 'v', description: 'Volume mapping in format hostPath:containerPath',required: false }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);

    if (!flags.port || !flags.port.includes(':')) {
      this.error('Invalid port format. Use the format hostPort:containerPort.');
      return;
    }

    const [hostPort, containerPort] = flags.port.split(':');

    try {
      const response = await axios.post(
        `http://127.0.0.1:3500/api/v1/run?imageName=${args.Image}&hostPort=${hostPort}&containerPort=${containerPort}` +
        `${flags.cpu ? `&cpu=${flags.cpu}` : ''}` +
        `${flags.ram ? `&memory=${flags.ram}` : ''}` +
        `${flags.volume ? `&volume=${flags.volume}` : ''}` +
        `${flags.environment ? `&environment=${flags.environment}` : ''}`
      );      
      this.log('Response data:', response.data);
    } catch (error: any) {
        this.handleError(error);
      } 
    }
  }

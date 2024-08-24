import { Args, Command, Flags } from '@oclif/core';
import Docker, { Container, ContainerInfo } from 'dockerode';
import axios from 'axios';
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export default class Containers extends Command {
  static args = {
    Operation: Args.string({
      description: 'Operation to perform on Docker containers (stopAll, stop, start, ps, remove, update, inspect, logs, stat)',
      required: true,
    }),
    ContainerId: Args.string({
      description: 'ID or Name of the Docker container',
      required: false,
    }),
  };

  static flags = {
    environment: Flags.string({ description: 'Environment data in format KEY=value,KEY2=value2', char: 'e' }),

    force: Flags.boolean({
      char: 'f',
      description: 'Force stop containers',
      required: false,
    }),
    remove: Flags.boolean({
      char: 'r',
      description: 'Remove containers after stopping them',
      required: false,
    }),
    all: Flags.boolean({
      char: 'a',
      description: 'List all containers including stopped ones',
      required: false,
    }),
    volume: Flags.string({
      char: 'v',
      description: 'Path to volume to be mounted to the container',
      required: false,
    }),
    ram: Flags.integer({
      description: 'Memory limit for the container in MB',
      char: 'm',
      required: false,
    }),
    cpu: Flags.integer({
      description: 'CPU quota for the container as a percentage',
      char: 'c',
      required: false,
    }),
    port: Flags.string({
      description: 'Port mapping in format hostPort:containerPort',
      char: 'p',
      required: false,
    }),
  };

  static description = 'Run Docker operations such as stopping, removing, starting, updating,logging,statting,inspecting or listing containers on the server';

  static examples = [
    '<%= config.bin %> <%= command.id %> stopAll',
    '<%= config.bin %> <%= command.id %> startAll',
    '<%= config.bin %> <%= command.id %> stop <container_id> -f',
    '<%= config.bin %> <%= command.id %> ps -a',
    '<%= config.bin %> <%= command.id %> remove <container_id> -r',
    '<%= config.bin %> <%= command.id %> start <container_id>',
    '<%= config.bin %> <%= command.id %> update <container_id> --ram 512 --cpu 50',
    '<%= config.bin %> <%= command.id %> inspect <container_id>',
    '<%= config.bin %> <%= command.id %> logs <container_id>',
    '<%= config.bin %> <%= command.id %> stat <container_id>',
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Containers);

    try {
      switch (args.Operation) {
        case 'startAll':
          try{
          const response = await axios.post("http://127.0.0.1:3500/api/v1/container/start-all");
          console.log('Response data:', response.data);
        } catch (error:any  ) {
          console.error('Error occurred:', error.message.message);
        }   
        break;
        case 'stopAll':
          try{
            const response = await axios.post("http://127.0.0.1:3500/api/v1/container/stop-all");
            console.log('Response data:', response.data);
          } catch (error:any  ) {
            console.error('Error occurred:', error.message.message);
          }             break;
        case 'stop':
          if (!args.ContainerId) throw new Error('Container ID is required for the stop operation.');
          try {
            const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/stop/${args.ContainerId}`);
            console.log('Response data:', response.data.message);
          } catch (error: any) {
            console.error('Error occurred:', error.message);
          }
        break;
        case 'start':
            if (!args.ContainerId) throw new Error('Container ID is required for the start operation.');
            try {
              const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/start/${args.ContainerId}`);
              console.log('Response data:', response.data.message);
            } catch (error: any) {
              console.error('Error occurred:', error.message);
            }
            break;
        case 'update':
            if (!args.ContainerId) throw new Error('Container ID is required for the update operation.');
            try {
              const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/update/${args.ContainerId}/?cpu=${flags.cpu}&ram=${flags.ram}`);
              console.log('Response data:', response.data.message);
            } catch (error: any) {
              console.error('Error occurred:', error.message);
            }
            break;
        case 'logs':
          try {
            const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/log/${args.ContainerId}`);
            console.log('Response data:', response.data.data);
          } catch (error: any) {
            console.error('Error occurred:', error.message);
          }
          break;
          case 'stat':
            if (!args.ContainerId) throw new Error('Container ID is required for the stat operation.');
            try {
              const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/stat/${args.ContainerId}`);
              console.log('Response data:', response.data.data); 
            } catch (error:any) {
              console.error('Error occurred:', error.message);
            }
            break;
          
        case 'ps':
          try{
            const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/ps/${flags.all ? '?all=true' : ''}`);
            console.log('Response data:', response.data.results);
          } catch (error:any  ) {
            console.error('Error occurred:', error.message.message);
          }
          break;
        case 'remove':
          if (!args.ContainerId) throw new Error('Container ID is required for the remove operation.');
          try {
            const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/remove/${args.ContainerId}/${flags.force ? '?force=true' : ''}`);
            console.log('Response data:', response.data.message);
          } catch (error: any) {
            console.error('Error occurred:', error.message);
          }
          break;
        case 'inspect':
            if (!args.ContainerId) throw new Error('Container ID is required for the inspect operation.');
            try {
              const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/inspect/${args.ContainerId}`);
              console.log('Response data:', response.data);
            } catch (error: any) {
              console.error('Error occurred:', error.message);
            }
            break;
  
        default:
          throw new Error(`Invalid operation: ${args.Operation}. Supported operations are: startAll, stopAll, stop, start, ps, remove, update, inspect, logs, stat.`);
      }
    } catch (error: any) {
      this.error(error.message);
    }
  }
}

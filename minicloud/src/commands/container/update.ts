import { Args, Flags } from '@oclif/core';
import axios from 'axios';
import BaseCommand from '../../baseCommand';

export default class Update extends BaseCommand {
  static args = {
    ContainerId: Args.string({ description: 'ID or Name of the Docker container', required: true }),
  };

  static flags = {
    ram: Flags.integer({ description: 'Memory limit for the container in MB', char: 'm', required: false }),
    cpu: Flags.integer({ description: 'CPU quota for the container as a percentage', char: 'c', required: false }),
  };

  static description = 'Update resource limits for a Docker container';

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Update);

    try {
      const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/update/${args.ContainerId}`, {
        cpu: flags.cpu,
        ram: flags.ram,
      });
      this.log('Response data:', response.data.message);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

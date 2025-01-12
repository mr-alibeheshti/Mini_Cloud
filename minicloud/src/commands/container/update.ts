import { Args, Flags } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../../base-command';

export default class Update extends BaseCommand {
  static args = {
    ContainerId: Args.string({ description: 'ID or Name of the Docker container', required: true }),
  };

  static description = 'Update resource limits for a Docker container';

  static flags = {
    cpu: Flags.integer({ char: 'c', description: 'CPU quota for the container as a percentage', required: false }),
    ram: Flags.integer({ char: 'm', description: 'Memory limit for the container in MB', required: false }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Update);

    try {
      const ContainerId = (args.ContainerId);
      const cpu = (`${flags.cpu ? `?cpu=${flags.cpu}`:  ''}`);
      const ram = (`${flags.ram ? `&ram=${flags.ram}`:  ''}`);
      const response = await axios.post(`http://localhost:3500/api/v1/container/update/${ContainerId}/${cpu}${ram}`);
      this.log('Response data:', response.data.message);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

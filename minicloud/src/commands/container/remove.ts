import { Args, Flags } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../../base-command';

export default class Remove extends BaseCommand {
  static args = {
    ContainerId: Args.string({ description: 'ID or Name of the Docker container', required: true }),
  };

  static description = 'Remove a Docker container';

  static flags = {
    force: Flags.boolean({ char: 'f', description: 'Force remove the container', required: false }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Remove);

    try {
      const ContainerId = (args.ContainerId);
      const force = (`${flags.force ? '?force=true' : ''}`);
      const response = await axios.post(`http://localhost:3500/api/v1/container/remove/${ContainerId}/${force}`);
      this.log('Response data:', response.data.message);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

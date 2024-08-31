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
      const response = await axios.post(`http://api.minicloud.local/api/v1/container/remove/${args.ContainerId}/${flags.force ? '?force=true' : ''}`);
      this.log('Response data:', response.data.message);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

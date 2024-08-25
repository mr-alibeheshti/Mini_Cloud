import { Args, Flags } from '@oclif/core';
import axios from 'axios';
import BaseCommand from '../../baseCommand';

export default class Remove extends BaseCommand {
  static args = {
    ContainerId: Args.string({ description: 'ID or Name of the Docker container', required: true }),
  };

  static flags = {
    force: Flags.boolean({ char: 'f', description: 'Force remove the container', required: false }),
  };

  static description = 'Remove a Docker container';

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Remove);

    try {
      const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/remove/${args.ContainerId}/${flags.force ? '?force=true' : ''}`);
      this.log('Response data:', response.data.message);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

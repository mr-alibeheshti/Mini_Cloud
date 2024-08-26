import { Args } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../../base-command';

export default class Inspect extends BaseCommand {
  static args = {
    ContainerId: Args.string({ description: 'ID or Name of the Docker container', required: true }),
  };

  static description = 'Inspect a Docker container';

  async run(): Promise<void> {
    const { args } = await this.parse(Inspect);

    try {
      const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/inspect/${args.ContainerId}`);
      this.log('Response data:', response.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

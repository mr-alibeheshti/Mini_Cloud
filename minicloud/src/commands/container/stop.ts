import { Args } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../../base-command';

export default class Stop extends BaseCommand {
  static args = {
    ContainerId: Args.string({ description: 'ID or Name of the Docker container', required: true }),
  };

  static description = 'Stop a Docker container';

  async run(): Promise<void> {
    const { args } = await this.parse(Stop);

    try {
      const response = await axios.post(`http://localhost:3500/api/v1/container/stop/${args.ContainerId}`);
      this.log('Response data:', response.data.message);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

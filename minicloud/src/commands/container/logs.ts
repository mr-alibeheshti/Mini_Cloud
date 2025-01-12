import { Args } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../../base-command';

export default class Logs extends BaseCommand {
  static args = {
    ContainerId: Args.string({ description: 'ID or Name of the Docker container', required: true }),
  };

  static description = 'Fetch logs of a Docker container';

  async run(): Promise<void> {
    const { args } = await this.parse(Logs);

    try {
      const ContainerId = (args.ContainerId);
      const response = await axios.post(`http://localhost:3500/api/v1/container/log/${ContainerId}`);
      this.log('Response data:', response.data.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

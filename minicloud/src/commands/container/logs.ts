import { Args } from '@oclif/core';
import axios from 'axios';
import BaseCommand from '../../baseCommand';

export default class Logs extends BaseCommand {
  static args = {
    ContainerId: Args.string({ description: 'ID or Name of the Docker container', required: true }),
  };

  static description = 'Fetch logs of a Docker container';

  async run(): Promise<void> {
    const { args } = await this.parse(Logs);

    try {
      const response = await axios.post(`http://127.0.0.1:3500/api/v1/container/log/${args.ContainerId}`);
      this.log('Response data:', response.data.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}
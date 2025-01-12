import { Args } from '@oclif/core';
import axios from 'axios';
import BaseCommand from '../../base-command';

export default class ChangeDomain extends BaseCommand {
  static args = {
    currentDomain: Args.string({ description: 'Current domain name of the container', required: true }),
    newDomain: Args.string({ description: 'New domain name for the container', required: true }),
    serviceName: Args.string({ description: 'serviceName', required: true }),
  };

  static description = 'Change the domain name of a Docker container';

  async run(): Promise<void> {
    const { args } = await this.parse(ChangeDomain);

    const currentDomain = (args.currentDomain);
    const newDomain = (args.newDomain);
    const serviceName = (args.serviceName);

    try {
      const response = await axios.post(`http://localhost:3500/api/v1/container/change-domain`, {
        currentDomain,
        newDomain,
        serviceName
      });
      this.log('Response data:', response.data.message);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  handleError(error: any): void {
    if (error.response) {
      this.error(`Error: ${error.response.status} - ${error.response.data.error}`);
    } else if (error.request) {
      this.error('No response received from the server.');
    } else {
      this.error(`Request failed: ${error.message}`);
    }
  }
}

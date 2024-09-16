import { Args, Flags } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../../base-command';

export default class ChangeDomain extends BaseCommand {
  static args = {
    currentDomain: Args.string({ description: 'Current domain name of the container', required: true }),
    newDomain: Args.string({ description: 'New domain name for the container', required: true }),
  };

  static description = 'Change the domain name of a Docker container';

  async run(): Promise<void> {
    const { args } = await this.parse(ChangeDomain);

    const currentDomain = encodeURIComponent(args.currentDomain);
    const newDomain = encodeURIComponent(args.newDomain);

    try {
      const response = await axios.post(`http://localhost:3500/api/v1/container/change-domain`, {
        currentDomain,
        newDomain,
      });
      this.log('Response data:', response.data.message);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

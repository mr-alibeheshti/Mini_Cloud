import { Args } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../../base-command';

export default class InspectVolume extends BaseCommand {
  static args = {
    name: Args.string({ description: 'Name of Docker Volume', required: true }),
  };

  static description = 'Inspect a Docker volume';

  async run(): Promise<void> {
    const { args } = await this.parse(InspectVolume);

    const url = `http://api.minicloud.local/api/v1/volume/inspect/${args.name}`;
    
    try {
      const response = await axios.get(url);
      this.log('Response data:', response.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

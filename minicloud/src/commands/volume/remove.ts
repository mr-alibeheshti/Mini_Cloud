import { Args } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../../base-command';

export default class RemoveVolume extends BaseCommand {
  static args = {
    name: Args.string({ description: 'Name of Docker Volume', required: true }),
  };

  static description = 'Remove a Docker volume';

  async run(): Promise<void> {
    const { args } = await this.parse(RemoveVolume);

    const url = `http://localhost:3501/api/v1/volume/remove/${args.name}`;
    
    try {
      const response = await axios.post(url);
      this.log('Response data:', response.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

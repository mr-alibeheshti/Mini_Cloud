import { Args, Flags } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../../base-command';

export default class AddVolume extends BaseCommand {
  static args = {
    name: Args.string({ description: 'Name of Docker Volume', required: true }),
  };

  static description = 'Add a new Docker volume';

  static flags = {
    SizeLimit: Flags.string({ char: 's', description: 'Limitation Size Of Volume' }),
    mountPoint: Flags.string({ char: 'm', description: 'Storage location for volume' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddVolume);

    const queryParams = [];
    if (flags.mountPoint) queryParams.push(`mountPoint=${flags.mountPoint}`);
    if (flags.SizeLimit) queryParams.push(`sizelimit=${flags.SizeLimit}`);

    const url = `http://localhost:3500/api/v1/volume/add/${args.name}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
    console.log('Request URL:', url);

    try {
      const response = await axios.post(url);
      this.log('Response data:', response.data);
    } catch (error) {
      this.handleError(error);
    }
  }
}

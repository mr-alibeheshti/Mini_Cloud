import { Args, Flags } from '@oclif/core';
import axios from 'axios';
import BaseCommand from '../../base-command';

export default class AddVolume extends BaseCommand {
  static args = {
    name: Args.string({ description: 'Name of Docker Volume', required: true }),
  };

  static description = 'Add a new Docker volume';

  static flags = {
    mountPoint: Flags.string({ char: 'm', description: 'Storage location for volume' }),
    SizeLimit: Flags.string({ char: 's', description: 'Limitation Size Of Volume' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddVolume);

    // درست کردن URL برای درخواست
    const queryParams = [];
    if (flags.mountPoint) queryParams.push(`mountPoint=${flags.mountPoint}`);
    if (flags.SizeLimit) queryParams.push(`sizelimit=${flags.SizeLimit}`);

    const url = `http://api.minicloud.local/api/v1/volume/add/${args.name}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`;
    console.log('Request URL:', url);

    try {
      const response = await axios.post(url);
      this.log('Response data:', response.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

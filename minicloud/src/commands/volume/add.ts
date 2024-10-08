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
  
    try {
      const mountPoint = (flags.mountPoint ? `?mountPoint=${flags.mountPoint}` : '');
      const sizeLimit = (flags.SizeLimit ? `&sizeLimit=${flags.SizeLimit}` : '');
  
      const url = `http://localhost:3501/api/v1/volume/add/${args.name}${mountPoint}${sizeLimit}`;
      console.log('Request URL:', url);
  
      const response = await axios.post(url);
      this.log('Response data:', response.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}
  

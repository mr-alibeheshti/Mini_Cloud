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
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddVolume);

    const url = `http://127.0.0.1:3500/api/v1/volume/add/${args.name}/${flags.mountPoint ? `?mountPoint=${flags.mountPoint}` : ""}`;
    
    try {
      const response = await axios.post(url);
      this.log('Response data:', response.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

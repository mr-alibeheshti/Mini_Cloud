import axios from 'axios';

import BaseCommand from '../../base-command';

export default class PsVolume extends BaseCommand {
  static description = 'List all Docker volumes';

  async run(): Promise<void> {
    const url = 'http://127.0.0.1:3500/api/v1/volume/ps';
    
    try {
      const response = await axios.get(url);
      this.log('Response data:', response.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

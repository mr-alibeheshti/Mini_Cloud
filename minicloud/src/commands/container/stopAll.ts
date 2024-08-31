import axios from 'axios';

import BaseCommand from '../../base-command';

export default class StopAll extends BaseCommand {
  static description = 'Stop all Docker containers';

  async run(): Promise<void> {
    try {
      const response = await axios.post('http://api.minicloud.local/api/v1/container/stop-all');
      this.log('Response data:', response.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

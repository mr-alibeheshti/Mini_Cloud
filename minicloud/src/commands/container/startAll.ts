import BaseCommand from '../../baseCommand';
import axios from 'axios';

export default class StartAll extends BaseCommand {
  static description = 'Start all Docker containers';

  async run(): Promise<void> {
    try {
      const response = await axios.post('http://127.0.0.1:3500/api/v1/container/start-all');
      this.log('Response data:', response.data);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

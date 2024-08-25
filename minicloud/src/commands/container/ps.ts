import { Flags } from '@oclif/core';
import axios from 'axios';
import BaseCommand from '../../baseCommand';

export default class Ps extends BaseCommand {
  static flags = {
    all: Flags.boolean({ char: 'a', description: 'List all containers including stopped ones', required: false }),
  };

  static description = 'List Docker containers';

  async run(): Promise<void> {
    const { flags } = await this.parse(Ps);

    try {
      const response = await axios.get(`http://127.0.0.1:3500/api/v1/container/ps${flags.all ? '?all=true' : ''}`);
      this.log('Response data:', response.data.results);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}
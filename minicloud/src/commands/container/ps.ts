import { Flags } from '@oclif/core';
import axios from 'axios';

import BaseCommand from '../../base-command';

export default class Ps extends BaseCommand {
  static description = 'List Docker containers';

  static flags = {
    all: Flags.boolean({ char: 'a', description: 'List all containers including stopped ones', required: false }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Ps);

    try {
      const response = await axios.get(`http://localhost:3500/api/v1/container/ps${flags.all ? '?all=true' : ''}`);
      this.log('Response data:', response.data.results);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

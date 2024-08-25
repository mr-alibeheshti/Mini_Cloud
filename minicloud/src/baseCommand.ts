import { Command } from '@oclif/core';

export default abstract class BaseCommand extends Command {
  protected handleError(error: any): void {
    if (error.response && error.response.data && error.response.data.error) {
      const errorMessage = error.response.data.error;
      this.log('Error message:', errorMessage);
    } else {
      this.log('Error:', error.message || error);
    }
  }
}

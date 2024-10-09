import { Args, Command } from '@oclif/core';
import * as readline from 'node:readline';
import WebSocket from 'ws';

export default class ExecShell extends Command {
  static args = {
    containerId: Args.string({ description: 'ID or name of the Docker container', required: true }),
  };

  static description = 'Request shell access to a Docker container';

  async run(): Promise<void> {
    const { args } = await this.parse(ExecShell);
    const {containerId} = args;

    try {
      const ws = new WebSocket(`ws://192.168.100.204:3500//api/v1/container/shell/${containerId}`);

      ws.on('open', () => {
        console.log(`Connected to shell of container ${containerId}`);
        
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          terminal: true
        });

        rl.on('line', (input) => {
          ws.send(input + '\n'); 
        });

        process.stdout.on('resize', () => {
          const { columns, rows } = process.stdout;
          ws.send(JSON.stringify({ columns, rows, type: 'resize' }));
        });

        ws.on('message', (message) => {
          process.stdout.write(message.toString());
        });

        ws.on('close', () => {
          console.log('Shell session closed');
          rl.close();
        });

        ws.on('error', (error) => {
          console.error('Error during shell session:', error);
          rl.close();
        });

        rl.on('close', () => {
          ws.close();
          process.exit(0);
        });
      });

    } catch (error: any) {
      this.error(`Error requesting shell access: ${error.message}`);
    }
  }
}

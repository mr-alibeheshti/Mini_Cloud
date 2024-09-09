import { Args, Command } from '@oclif/core';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

export default class Build extends Command {
  static description = 'Upload a Dockerfile to the server to build a Docker image';

  static args = {
    filePath: Args.string({ description: 'Path to the Dockerfile to upload', required: true }),
    imageName: Args.string({ description: 'Name of the image', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(Build);
    const filePath = args.filePath;
    const imageName = args.imageName;

    try {
      this.log("start Build and run for Your DockerFile ;) ")
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      form.append('imageName', imageName);

      const response = await axios.post('http://api.minicloud.local/api/v1/container/build', form, {
        headers: {
          ...form.getHeaders(),
        }
      });
      this.log('File uploaded successfully:', response.data);
    } catch (error: any) {
      this.error(`Error processing file: ${error.message}`);
    }
  }
}

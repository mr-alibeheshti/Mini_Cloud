import { Args, Command } from '@oclif/core';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export default class Build extends Command {
  static description = 'Upload a Dockerfile to the server to build a Docker image';

  static args = {
    filePath: Args.string({ description: 'Path to the Dockerfile to upload', required: true }),
    ImageName: Args.string({ description: 'Name to the Image', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(Build);
    const filePath = args.filePath;
    const ImageName = args.ImageName;

    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      form.append('imageName', ImageName);

      const response = await axios.post('http://api.minicloud.local/api/v1/container/build', form, {
        headers: {
          ...form.getHeaders(),
        }
      });

      this.log('File uploaded successfully:', response.data);
    } catch (error: any) {
      this.error(`Error uploading file: ${error.message}`);
    }
  }
}
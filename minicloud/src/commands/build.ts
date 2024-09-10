import { Args, Command } from '@oclif/core';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'node:fs';
import path from 'node:path';
import { create } from 'tar';
import BaseCommand from '../base-command';

export default class Build extends BaseCommand {
  static args = {
    dirPath: Args.string({ description: 'Path to the directory containing Dockerfile', required: true }),
    imageName: Args.string({ description: 'Name of the image', required: true }),
  };

  static description = 'Upload a directory containing Dockerfile to the server to build a Docker image';

  async run(): Promise<void> {
    const { args } = await this.parse(Build);
    const {dirPath} = args;
    const {imageName} = args;

    try {
      this.log("Starting to tar the directory and upload...");

      const tarFilePath = path.join(path.dirname(dirPath), 'dockerfile.tar');
      await create({
        cwd: dirPath,
        file: tarFilePath,
        gzip: false,
        noDirRecurse: false,  
        portable: true,  
      }, ['.']);  

      const form = new FormData();
      form.append('file', fs.createReadStream(tarFilePath));  
      form.append('imageName', imageName);

      const response = await axios.post('http://api.minicloud.local/api/v1/container/build', form, {
        headers: {
          ...form.getHeaders(),
        }
      });
      this.log('Directory tarred and uploaded successfully:', response.data);
      fs.unlinkSync(tarFilePath);
    } catch (error: any) {
      this.handleError(error);
    }
  }
}

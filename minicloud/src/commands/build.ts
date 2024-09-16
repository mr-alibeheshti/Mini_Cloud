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
      const dockerfilePath = path.join(dirPath, 'Dockerfile');
      const packageJsonPath = path.join(dirPath, 'package.json');
      const requirementsPath = path.join(dirPath, 'requirements.txt');
      
      let foundFile = false;
      let appType:string = '';

      try {
        await fs.promises.access(dockerfilePath);
        appType = 'Dockerfile';
        foundFile = true;
        this.log('Dockerfile found.');
      } catch {}

      try {
        await fs.promises.access(packageJsonPath);
        appType = 'nodejs';
        foundFile = true;
        this.log('package.json found.');
      } catch {}

      try {
        await fs.promises.access(requirementsPath);
        appType = 'python';
        foundFile = true;
        this.log('requirements.txt found.');
      } catch {}

      if (!foundFile) {
        this.error('No Dockerfile, package.json, or requirements.txt found in the specified directory.');
        return;
      }
      const tarFilePath = path.join(path.dirname(dirPath), 'dockerfile.tar');
      await create({
        cwd: dirPath,
        file: tarFilePath,
        gzip: true,
        portable: true,  
      }, ['.']);  
      const form = new FormData();
      form.append('file', fs.createReadStream(tarFilePath));  
      form.append('imageName', imageName);
      form.append('type', appType);

      const response = await axios.post('http://localhost:3500/api/v1/container/build', form, {
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

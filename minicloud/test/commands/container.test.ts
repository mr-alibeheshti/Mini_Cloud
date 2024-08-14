import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('container', () => {
  it('runs container cmd', async () => {
    const {stdout} = await runCommand('container')
    expect(stdout).to.contain('hello world')
  })

  it('runs container --name oclif', async () => {
    const {stdout} = await runCommand('container --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})

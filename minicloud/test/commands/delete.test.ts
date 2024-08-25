import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('delete', () => {
  it('runs delete cmd', async () => {
    const {stdout} = await runCommand('delete')
    expect(stdout).to.contain('hello world')
  })

  it('runs delete --name oclif', async () => {
    const {stdout} = await runCommand('delete --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})

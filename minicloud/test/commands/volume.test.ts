import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('volume', () => {
  it('runs volume cmd', async () => {
    const {stdout} = await runCommand('volume')
    expect(stdout).to.contain('hello world')
  })

  it('runs volume --name oclif', async () => {
    const {stdout} = await runCommand('volume --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})

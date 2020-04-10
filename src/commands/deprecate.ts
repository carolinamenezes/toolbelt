import { flags as oclifFlags } from '@oclif/command'

import { CustomCommand } from '../utils/CustomCommand'
import { appsDeprecate } from '../lib/deprecate'

export default class Deprecate extends CustomCommand {
  static description = 'Deprecate an app'

  static examples = ['vtex deprecate vtex.service-example@0.0.1']

  static flags = {
    help: oclifFlags.help({ char: 'h' }),
    yes: oclifFlags.boolean({ description: 'Confirm all prompts', char: 'y', default: false }),
  }

  static args = [{ name: 'appId', required: true }]

  async run() {
    const {
      args: { appId },
      flags: { yes },
    } = this.parse(Deprecate)

    await appsDeprecate(appId, yes)
  }
}

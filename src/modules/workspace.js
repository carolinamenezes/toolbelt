import {WorkspacesClient} from '@vtex/workspaces'
import {map, prop} from 'ramda'
import log from '../logger'
import {getToken, getAccount} from '../conf'
import pkg from '../../package.json'

const client = new WorkspacesClient({
  authToken: getToken(),
  userAgent: `toolbelt-v-${pkg.version}`,
})

export default {
  workspace: {
    list: {
      description: 'List workspaces on this account',
      handler: () => {
        log.debug('Listing workspaces')
        client.list(getAccount()).then(res => {
          console.log(map(prop('name'), res.body).join('\n'))
        })
      },
    },
    new: {
      requiredArgs: 'name',
      description: 'Create a new workspace with this name',
      handler: (name) => {
        log.debug('Creating workspace', name)
        log.info('Create', name)
      },
    },
    delete: {
      requiredArgs: 'name',
      description: 'Delete this workspace',
      handler: (name) => {
        log.debug('Deleting workspace', name)
        log.info('Delete', name)
      },
    },
    promote: {
      requiredArgs: 'name',
      description: 'Promote this workspace to master',
      handler: (name) => {
        log.debug('Promoting workspace', name)
        log.info('Promote', name)
      },
    },
  },
}

import { InstanceOptions, IOClient, IOContext } from '@vtex/api'
import { createDummyLogger } from '../../clients/dummyLogger'
import * as env from '../../env'
import userAgent from '../../user-agent'
import { SessionManager } from '../session/SessionManager'

interface IOContextOptions {
  account?: string
  authToken?: string
  region?: string
  workspace?: string
}

export class IOClientFactory {
  public static DEFAULT_TIMEOUT = 15000

  public static createIOContext(opts?: IOContextOptions): IOContext {
    const session = SessionManager.getSingleton()
    const {
      account = session.account,
      authToken = session.token,
      region = env.region(),
      workspace = session.workspace || 'master',
    } = opts ?? {}

    return {
      account,
      userAgent,
      workspace,
      authToken,
      region,
      production: false,
      product: '',
      route: {
        id: '',
        params: {},
      },
      requestId: '',
      operationId: '',
      platform: '',
      logger: createDummyLogger(),
    }
  }

  public static createClient<T extends IOClient>(
    ClientClass: typeof IOClient,
    customContext: Partial<IOContext> = {},
    customOptions: Partial<InstanceOptions> = {}
  ): T {
    const clusterHeader = env.cluster() ? { 'x-vtex-upstream-target': env.cluster() } : null

    const defaultOptions = {
      timeout: (env.envTimeout || IOClientFactory.DEFAULT_TIMEOUT) as number,
      headers: {
        ...clusterHeader,
      },
    }

    const mergedOptions = { ...defaultOptions, ...customOptions }
    mergedOptions.headers = { ...defaultOptions.headers, ...customOptions.headers }

    const ioContext = {
      ...IOClientFactory.createIOContext(),
      ...customContext,
    }

    if (!ioContext.authToken) {
      return new Proxy(
        {},
        {
          get: () => () => {
            throw new Error(`Error trying to call client before login.`)
          },
        }
      ) as T
    }

    return new ClientClass(
      {
        ...IOClientFactory.createIOContext(),
        ...customContext,
      },
      mergedOptions
    ) as T
  }
}

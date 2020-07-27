import { InstanceOptions, IOClient, IOContext } from '@vtex/api'
import opn from 'opn'
import { storeUrl } from '../../../storeUrl'
import { IOClientFactory } from '../IOClientFactory'

export class VTEXID extends IOClient {
  private static readonly DEFAULT_TIMEOUT = 10000
  private static readonly DEFAULT_RETRIES = 2
  private static readonly BASE_URL = 'https://vtexid.vtex.com.br'
  private static readonly API_PATH_PREFIX = '/api/vtexid'
  private static readonly VTEX_ID_AUTH_COOKIE = 'VtexIdClientAutCookie'

  public static createClient(customContext: Partial<IOContext> = {}, customOptions: Partial<InstanceOptions> = {}) {
    return IOClientFactory.createClient<VTEXID>(VTEXID, customContext, customOptions, { requireAuth: false })
  }

  public static invalidateBrowserAuthCookie(account: string) {
    return opn(
      storeUrl({ account, addWorkspace: false, path: `${VTEXID.API_PATH_PREFIX}/pub/single-sign-out?scope=` }),
      { wait: false }
    )
  }

  constructor(ioContext: IOContext, opts: InstanceOptions) {
    super(ioContext, {
      timeout: VTEXID.DEFAULT_TIMEOUT,
      retries: VTEXID.DEFAULT_RETRIES,
      ...opts,
      baseURL: VTEXID.BASE_URL,
    })
  }

  public invalidateToolbeltToken(token: string) {
    return this.http.get(`/api/vtexid/pub/logout?scope=`, {
      headers: {
        Cookie: `${VTEXID.VTEX_ID_AUTH_COOKIE}=${token}`,
      },
    })
  }
}
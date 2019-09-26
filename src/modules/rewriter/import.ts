import { createHash } from 'crypto'
import { readFile, readJson, remove } from 'fs-extra'
import { compose, concat, difference, isEmpty, length, map, pluck, reduce, reject } from 'ramda'
import { createInterface } from 'readline'
import { Parser } from 'json2csv'
import { writeFile } from 'fs-extra'
import { resolve } from 'path'

import { rewriter } from '../../clients'
import { RedirectInput } from '../../clients/rewriter'
import log from '../../logger'
import { isVerbose } from '../../utils'
import { default as deleteRedirects } from './delete'
import {
  accountAndWorkspace,
  deleteMetainfo,
  MAX_RETRIES,
  METAINFO_FILE,
  progressBar,
  readCSV,
  saveMetainfo,
  showGraphQLErrors,
  sleep,
  splitJsonArray,
  validateInput,
  handleReadError,
  RETRY_INTERVAL_S,
  isLastChangeDate,
} from './utils'

const IMPORTS = 'imports'
const [account, workspace] = accountAndWorkspace

const inputSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      from: {
        type: 'string',
      },
      to: {
        type: 'string',
      },
      endDate: {
        type: 'string',
      },
      type: {
        type: 'string',
        enum: ['PERMANENT', 'TEMPORARY'],
      },
    },
    additionalProperties: false,
    required: ['from', 'to', 'type'],
  },
}

const handleImport = async (csvPath: string) => {
  const fileHash = (await readFile(csvPath)
    .then(data =>
      createHash('md5')
        .update(`${account}_${workspace}_${data}`)
        .digest('hex')
    )
    .catch(handleReadError)) as string
  const metainfo = await readJson(METAINFO_FILE).catch(() => ({}))
  const importMetainfo = metainfo[IMPORTS] || {}
  let counter = importMetainfo[fileHash] ? importMetainfo[fileHash].counter : 0
  const routes = await readCSV(csvPath)
  validateInput(inputSchema, routes)

  const routesList = splitJsonArray(routes)

  const bar = progressBar('Importing routes...', counter, length(routesList))

  const listener = createInterface({ input: process.stdin, output: process.stdout }).on('SIGINT', () => {
    saveMetainfo(metainfo, IMPORTS, fileHash, counter)
    console.log('\n')
    process.exit()
  })

  await Promise.each(routesList.splice(counter), async (redirects: RedirectInput[]) => {
    try {
      await rewriter.importRedirects(redirects)
    } catch (e) {
      await saveMetainfo(metainfo, IMPORTS, fileHash, counter)
      listener.close()
      throw e
    }
    counter++
    bar.tick()
  })

  log.info('Finished!\n')
  listener.close()
  deleteMetainfo(metainfo, IMPORTS, fileHash)
  return pluck('from', routes)
}

let retryCount = 0
export default async (csvPath: string, options: any) => {
  const reset = options ? options.r || options.reset : undefined
  let indexedRoutes
  if (reset) {
    const indexFiles = await rewriter.routesIndexFiles()
    const indexFileNames = reject(isLastChangeDate, indexFiles ? pluck('fileName', indexFiles) : [])
    indexedRoutes = await Promise.mapSeries(indexFileNames, rewriter.routesIndex)
      .then(compose<any, any, any>(
        pluck('id'),
        reduce(concat, [])
      ))
  }
  let importedRoutes
  try {
    importedRoutes = await handleImport(csvPath)
  } catch (e) {
    log.error('Error handling import')
    const maybeGraphQLErrors = showGraphQLErrors(e)
    if (isVerbose) {
      console.log(e)
    }
    if (retryCount >= MAX_RETRIES || maybeGraphQLErrors) {
      process.exit()
    }
    log.error(`Retrying in ${RETRY_INTERVAL_S} seconds...`)
    log.info('Press CTRL+C to abort')
    await sleep(RETRY_INTERVAL_S * 1000)
    retryCount++
    importedRoutes = await module.exports.default(csvPath)
  }
  if (reset) {
    const routesToDelete = difference(indexedRoutes || [], importedRoutes || [])
    if (routesToDelete && !isEmpty(routesToDelete)) {
      const fileName = `.vtex_redirects_to_delete_${Date.now().toString()}.csv`
      const filePath = `./${fileName}`
      log.info('Deleting old redirects...')
      log.info(
        `In case this step fails, run 'vtex redirects delete ${resolve(fileName)}' to finish deleting old redirects.`
      )
      const json2csvParser = new Parser({ fields: ['from'], delimiter: ';', quote: '' })
      const csv = json2csvParser.parse(map(route => ({ from: route }), routesToDelete))
      await writeFile(filePath, csv)
      await deleteRedirects(filePath)
      await remove(filePath)
    }
  }
  return importedRoutes
}

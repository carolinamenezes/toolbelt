import * as React from 'react'
import { Box, Static } from 'ink'
import { difference } from 'ramda'

import { AppReport, TestReport } from '../../../../clients/Tester'
import { useInterval } from '../useInterval'

import { Completed } from './completedApps'
import { Summary } from './summary'
import { parseReport } from './specsState'
import { Running } from './runningApps'

interface RealTimeReport {
  testId: string
  poll: () => Promise<TestReport>
  interval: number
  initialReport: TestReport
  requestedAt?: number
}

interface AppTest {
  appId: string
  specs: AppReport
}

export interface ReportProps {
  completedAppTests: AppTest[]
  runningAppTests: AppTest[]
}

export interface AppProps {
  appId: string
  specs: AppReport
}

const Report: React.FunctionComponent<ReportProps> = ({ completedAppTests, runningAppTests }) => (
  <Box flexDirection="column">
    <Static>
      {completedAppTests.map(({ appId, specs }) => (
        <Completed key={appId} appId={appId} specs={specs} />
      ))}
    </Static>

    {runningAppTests.length > 0 && (
      <Box flexDirection="column" marginTop={1}>
        {runningAppTests.map(({ appId, specs }) => (
          <Running key={appId} appId={appId} specs={specs} />
        ))}
      </Box>
    )}
  </Box>
)

export const RealTimeReport: React.FunctionComponent<RealTimeReport> = ({
  testId,
  poll,
  interval,
  initialReport,
  requestedAt,
}) => {
  const [delay, setDelay] = React.useState(interval)
  const [report, setReport] = React.useState<ReportProps>(parseReport(initialReport))

  const handleReport = ({ completedAppTests, runningAppTests }: ReportProps) => {
    const recentlyCompleted = difference(completedAppTests, report.completedAppTests)

    setReport({
      // careful not to reorder completed apps because they are Static
      completedAppTests: [...report.completedAppTests, ...recentlyCompleted],
      runningAppTests,
    })

    if (runningAppTests.length === 0) setDelay(null)
  }

  useInterval(
    () =>
      poll()
        .then(parseReport)
        .then(handleReport),
    delay
  )

  return (
    <Box flexDirection="column">
      <Report {...report} />
      <Box marginTop={1}>
        <Summary {...report} testId={testId} requestedAt={requestedAt} />
      </Box>
    </Box>
  )
}

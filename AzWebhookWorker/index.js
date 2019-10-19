import { env } from 'process'
import main from '../lib/main'

async function worker (context, queueItem) {
  await main({
    authToken: env.GITHUB_TOKEN,
    log: context.log,
    ...queueItem
  })

  context.done()
}

export default worker

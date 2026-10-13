import { configuration } from "./config"
import { createApp } from "./app"
const config = configuration()
const { app } = await createApp(config)
await app.listen({ host: "0.0.0.0", port: config.port })
let stopping = false
for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => {
  if (stopping) return
  stopping = true
  app.log.info({ signal }, "Backend shutting down")
  const deadline = setTimeout(() => {
    app.log.fatal("Backend shutdown timed out")
    process.exit(1)
  }, 25000)
  deadline.unref()
  void app.close().then(() => { clearTimeout(deadline) }).catch(error => {
    app.log.error({ err: error }, "Backend shutdown failed")
    process.exit(1)
  })
})

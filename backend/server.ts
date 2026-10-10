import { configuration } from "./config"
import { createApp } from "./app"
const { app } = await createApp(configuration())
await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 4000) })
for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => { void app.close() })

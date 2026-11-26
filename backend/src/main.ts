import { criarApp } from './app.factory.js'

// Servidor tradicional (Docker/local). Na Vercel o entrypoint é api/index.js
// -> dist/serverless.js, que não chama listen().
async function bootstrap() {
  const app = await criarApp()
  app.enableShutdownHooks()
  await app.listen(process.env.PORT ?? 3000)
}
await bootstrap()

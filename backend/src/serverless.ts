import type { IncomingMessage, ServerResponse } from 'node:http';
import { criarApp } from './app.factory.js';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

// O app é inicializado uma vez por instância da função e reaproveitado
// nas invocações seguintes (evita recriar o módulo e o pool do Prisma).
let handlerPromise: Promise<Handler> | undefined;

async function iniciar(): Promise<Handler> {
  const app = await criarApp();
  await app.init();
  return app.getHttpAdapter().getInstance() as Handler;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  handlerPromise ??= iniciar().catch((erro: unknown) => {
    handlerPromise = undefined; // permite nova tentativa após falha de boot
    throw erro;
  });
  const app = await handlerPromise;
  app(req, res);
}

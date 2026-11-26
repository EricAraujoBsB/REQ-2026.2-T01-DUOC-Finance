import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { TipoEvidencia } from '../rvt/evidencias/arquivo-evidencia.util.js';
import { nomeBucket, obterClienteSupabase } from '../storage/supabase-storage.js';

/** Comprovantes de reembolso no bucket privado do Supabase Storage. */
@Injectable()
export class ComprovanteStorageService {
  async salvar(reembolsoId: string, buffer: Buffer, tipo: TipoEvidencia) {
    // Chave gerada exclusivamente pelo servidor, nunca pelo usuário.
    const chave = `reembolsos/${reembolsoId}/${randomUUID()}.${tipo.extensao}`;
    const { error } = await obterClienteSupabase()
      .storage.from(nomeBucket())
      .upload(chave, buffer, { contentType: tipo.mimeType, upsert: false });
    if (error) {
      throw new InternalServerErrorException(
        `Falha ao gravar comprovante: ${error.message}`,
      );
    }
    return {
      chave,
      hashSha256: createHash('sha256').update(buffer).digest('hex'),
    };
  }

  async abrir(chave: string): Promise<Buffer> {
    const { data, error } = await obterClienteSupabase()
      .storage.from(nomeBucket())
      .download(chave);
    if (error || !data) {
      throw new NotFoundException('Comprovante não encontrado.');
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async remover(chave: string): Promise<void> {
    const { error } = await obterClienteSupabase()
      .storage.from(nomeBucket())
      .remove([chave]);
    if (error) {
      throw new InternalServerErrorException(
        `Falha ao remover comprovante: ${error.message}`,
      );
    }
  }
}

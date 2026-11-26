import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { nomeBucket, obterClienteSupabase } from '../../storage/supabase-storage.js';
import type { TipoEvidencia } from './arquivo-evidencia.util.js';

export interface ArquivoArmazenado {
  /** Chave do objeto no bucket (o que vai para o banco) */
  caminhoRelativo: string;
  hashSha256: string;
}

/**
 * Persistência das evidências no bucket privado do Supabase Storage, com
 * nome gerado pelo servidor. Bucket configurável por SUPABASE_STORAGE_BUCKET.
 */
@Injectable()
export class EvidenciasStorageService {
  private readonly logger = new Logger(EvidenciasStorageService.name);

  async salvar(
    rvtId: string,
    conteudo: Buffer,
    tipo: TipoEvidencia,
  ): Promise<ArquivoArmazenado> {
    const caminhoRelativo = `rvt/${rvtId}/${randomUUID()}.${tipo.extensao}`;
    const { error } = await obterClienteSupabase()
      .storage.from(nomeBucket())
      .upload(caminhoRelativo, conteudo, {
        contentType: tipo.mimeType,
        upsert: false,
      });
    if (error) {
      throw new InternalServerErrorException(
        `Falha ao gravar evidência: ${error.message}`,
      );
    }
    return {
      caminhoRelativo,
      hashSha256: createHash('sha256').update(conteudo).digest('hex'),
    };
  }

  /** Lê a evidência; 404 se o objeto não existir no bucket */
  async abrir(caminhoRelativo: string): Promise<Buffer> {
    const { data, error } = await obterClienteSupabase()
      .storage.from(nomeBucket())
      .download(caminhoRelativo);
    if (error || !data) {
      this.logger.warn(`Evidência ausente no storage: ${caminhoRelativo}`);
      throw new NotFoundException('Arquivo da evidência não encontrado.');
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async remover(caminhoRelativo: string): Promise<void> {
    const { error } = await obterClienteSupabase()
      .storage.from(nomeBucket())
      .remove([caminhoRelativo]);
    if (error) {
      this.logger.warn(
        `Não foi possível remover a evidência ${caminhoRelativo}: ${error.message}`,
      );
    }
  }
}

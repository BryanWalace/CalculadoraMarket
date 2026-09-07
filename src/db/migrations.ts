import {
  CREATE_LIST_ITEMS_LIST_ID_INDEX,
  CREATE_LIST_ITEMS_TABLE,
  CREATE_SHOPPING_LISTS_TABLE,
} from './schema';
import type { AppDatabase } from './types';

type Migration = (db: AppDatabase) => Promise<void>;

/**
 * Cada entrada é uma migração numerada (índice = versão alvo - 1). Uma
 * mudança de schema futura vira uma nova migração no fim da lista, nunca
 * uma edição de uma já existente — ver docs/plan.md ADR-04.
 */
const migrations: Migration[] = [
  async (db) => {
    await db.execAsync(CREATE_SHOPPING_LISTS_TABLE);
    await db.execAsync(CREATE_LIST_ITEMS_TABLE);
    await db.execAsync(CREATE_LIST_ITEMS_LIST_ID_INDEX);
  },
];

export async function runMigrations(db: AppDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  for (let version = currentVersion; version < migrations.length; version += 1) {
    await db.withTransactionAsync(async () => {
      await migrations[version](db);
    });
    // PRAGMA não aceita parâmetro `?` para o valor; `version` é sempre um
    // contador interno, nunca dado do usuário, então a interpolação é segura.
    await db.execAsync(`PRAGMA user_version = ${version + 1}`);
  }
}

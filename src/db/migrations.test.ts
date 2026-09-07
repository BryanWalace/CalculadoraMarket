import { runMigrations } from './migrations';
import type { AppDatabase } from './types';

/**
 * expo-sqlite é um módulo nativo e não executa dentro do Jest. Este fake
 * reproduz só o comportamento de PRAGMA user_version e execAsync que
 * runMigrations depende, o suficiente para testar a lógica de versionamento
 * sem precisar de um SQLite de verdade.
 */
function createFakeDatabase() {
  let userVersion = 0;
  const executedStatements: string[] = [];

  const db: AppDatabase = {
    execAsync: async (source: string) => {
      executedStatements.push(source);
      const match = /PRAGMA user_version\s*=\s*(\d+)/i.exec(source);
      if (match) {
        userVersion = Number(match[1]);
      }
    },
    getFirstAsync: async <T>() => ({ user_version: userVersion }) as T,
    getAllAsync: async () => [],
    runAsync: async () => ({ lastInsertRowId: 0, changes: 0 }),
    withTransactionAsync: async (task) => {
      await task();
    },
  };

  return { db, executedStatements, getUserVersion: () => userVersion };
}

describe('runMigrations', () => {
  it('cria as tabelas e avança a versão para 1', async () => {
    const { db, executedStatements, getUserVersion } = createFakeDatabase();

    await runMigrations(db);

    expect(executedStatements.some((sql) => sql.includes('CREATE TABLE'))).toBe(true);
    expect(executedStatements.some((sql) => sql.includes('shopping_lists'))).toBe(true);
    expect(executedStatements.some((sql) => sql.includes('list_items'))).toBe(true);
    expect(getUserVersion()).toBe(1);
  });

  it('é idempotente: rodar de novo não reaplica a migração', async () => {
    const { db, executedStatements } = createFakeDatabase();

    await runMigrations(db);
    const statementsAfterFirstRun = executedStatements.length;

    await runMigrations(db);

    expect(executedStatements.length).toBe(statementsAfterFirstRun);
  });
});

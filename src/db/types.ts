import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Fatia de SQLiteDatabase usada pela camada src/db. Mantém todo o módulo
 * testável com um banco falso em memória, sem depender do módulo nativo do
 * expo-sqlite (que não roda dentro do Jest).
 */
export type AppDatabase = Pick<
  SQLiteDatabase,
  'execAsync' | 'getFirstAsync' | 'getAllAsync' | 'runAsync' | 'withTransactionAsync'
>;

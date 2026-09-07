import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import type { ReactNode } from 'react';

import { runMigrations } from './migrations';

export const DATABASE_NAME = 'carrinho.db';

export { useSQLiteContext };

interface AppDatabaseProviderProps {
  children: ReactNode;
}

/**
 * useSuspense fica desligado (padrão) para não exigir um Suspense boundary
 * ainda — uma tela de erro amigável fica para a T-63 (auditoria de estados
 * de carregamento/erro). Por ora só evitamos o comportamento padrão de
 * relançar o erro, que derrubaria a árvore de render.
 */
export function AppDatabaseProvider({ children }: AppDatabaseProviderProps) {
  return (
    <SQLiteProvider
      databaseName={DATABASE_NAME}
      onInit={runMigrations}
      onError={(error) => console.error('Falha ao inicializar o banco de dados', error)}
    >
      {children}
    </SQLiteProvider>
  );
}

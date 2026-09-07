import { File } from 'expo-file-system';

/**
 * Apaga a foto associada a um item excluído (RF-56). Idempotente: não faz
 * nada se não houver foto ou se o arquivo já não existir mais.
 */
export function deletePhotoIfExists(photoUri: string | null): void {
  if (!photoUri) {
    return;
  }
  const file = new File(photoUri);
  if (file.exists) {
    file.delete();
  }
}

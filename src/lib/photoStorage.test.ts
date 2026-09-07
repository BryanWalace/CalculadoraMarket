import { File } from 'expo-file-system';

import { deletePhotoIfExists } from './photoStorage';

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
}));

describe('deletePhotoIfExists', () => {
  it('não faz nada quando não há foto (uri null)', () => {
    deletePhotoIfExists(null);

    expect(File).not.toHaveBeenCalled();
  });

  it('apaga o arquivo quando ele existe', () => {
    const mockDelete = jest.fn();
    (File as unknown as jest.Mock).mockReturnValue({ exists: true, delete: mockDelete });

    deletePhotoIfExists('file:///photo.jpg');

    expect(File).toHaveBeenCalledWith('file:///photo.jpg');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('é idempotente: não tenta apagar um arquivo que já não existe', () => {
    const mockDelete = jest.fn();
    (File as unknown as jest.Mock).mockReturnValue({ exists: false, delete: mockDelete });

    deletePhotoIfExists('file:///photo.jpg');

    expect(mockDelete).not.toHaveBeenCalled();
  });
});

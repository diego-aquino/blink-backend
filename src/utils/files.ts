import filesystem from 'fs';

export async function pathExists(path: string) {
  try {
    await filesystem.promises.access(path);
    return true;
  } catch {
    return false;
  }
}

import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

const PHOTO_MAX_WIDTH = 1280;
const PHOTO_JPEG_QUALITY = 0.65;

export const ensureDir = async (dirUri: string) => {
  const info = await FileSystem.getInfoAsync(dirUri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
};

const genPhotoFileName = () =>
  `${Date.now()}_${Math.random().toString(16).slice(2)}.jpg`;

export async function saveOptimizedPhoto(srcUri: string, photosDir: string) {
  await ensureDir(photosDir);

  try {
    const context = ImageManipulator.ImageManipulator.manipulate(srcUri);
    context.resize({ width: PHOTO_MAX_WIDTH });
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({
      compress: PHOTO_JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const dest = `${photosDir}${genPhotoFileName()}`;
    await FileSystem.copyAsync({ from: result.uri, to: dest });

    try {
      await FileSystem.deleteAsync(result.uri, { idempotent: true });
    } catch {}

    return dest;
  } catch (e) {
    console.warn("Failed to optimize photo, copying original instead", e);
    const dest = `${photosDir}${genPhotoFileName()}`;
    await FileSystem.copyAsync({ from: srcUri, to: dest });
    return dest;
  }
}

export async function saveOptimizedPhotos(srcUris: string[], photosDir: string) {
  const saved: string[] = [];
  for (const uri of srcUris) {
    saved.push(await saveOptimizedPhoto(uri, photosDir));
  }
  return saved;
}

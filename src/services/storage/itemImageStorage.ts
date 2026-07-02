import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBlobUtil from 'react-native-blob-util';
import { launchImageLibrary } from 'react-native-image-picker';

/**
 * Item photos picked by the user are copied into the app's private storage
 * (DocumentDir/item-images) and mapped to the item number in AsyncStorage.
 * They never leave the device — product cards read them before falling back
 * to the server image_url.
 */

const STORAGE_KEY = 'pos.item_images.v1';

let cache: Record<string, string> = {};
let hydrated = false;
let hydrating: Promise<void> | null = null;

const listeners = new Set<() => void>();

const notify = () => listeners.forEach(l => l());

export function subscribeItemImages(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Stable key for an item across branches — item number first, id fallback. */
export function itemImageKey(item: {
  item_number?: string | null;
  id?: number | null;
}): string {
  const num = item.item_number?.trim().toLowerCase();
  return num || `id:${item.id ?? ''}`;
}

export async function hydrateItemImages(): Promise<void> {
  if (hydrated) {
    return;
  }
  if (!hydrating) {
    hydrating = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        cache = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      } catch {
        cache = {};
      }
      hydrated = true;
      notify();
    })();
  }
  await hydrating;
}

/** Sync read — call after hydrateItemImages (the hook handles this). */
export function getItemImagePath(key: string): string | null {
  return cache[key] ?? null;
}

export async function getStoredItemImage(key: string): Promise<string | null> {
  await hydrateItemImages();
  return getItemImagePath(key);
}

export function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

const imagesDir = () => `${RNBlobUtil.fs.dirs.DocumentDir}/item-images`;

const stripFileScheme = (uri: string) => uri.replace(/^file:\/\//, '');

const safeFileName = (key: string) =>
  key.replace(/[^a-z0-9_-]/gi, '_') || 'item';

async function persist(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

async function deleteFileQuietly(path: string): Promise<void> {
  try {
    const plain = stripFileScheme(path);
    if (await RNBlobUtil.fs.exists(plain)) {
      await RNBlobUtil.fs.unlink(plain);
    }
  } catch {
    // stale mapping is fine — the map entry is what matters
  }
}

/** Copy a picked photo into app storage and remember it for this item. */
export async function saveItemImage(
  key: string,
  sourceUri: string,
): Promise<string> {
  await hydrateItemImages();

  const dir = imagesDir();
  if (!(await RNBlobUtil.fs.isDir(dir))) {
    await RNBlobUtil.fs.mkdir(dir);
  }

  const source = stripFileScheme(sourceUri);
  if (source.startsWith(dir)) {
    // Already ours (unchanged photo re-saved)
    return source;
  }

  const extMatch = /\.(jpe?g|png|webp)$/i.exec(source);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const dest = `${dir}/${safeFileName(key)}-${Date.now()}.${ext}`;

  await RNBlobUtil.fs.cp(source, dest);

  const previous = cache[key];
  cache = { ...cache, [key]: dest };
  await persist();
  if (previous && previous !== dest) {
    await deleteFileQuietly(previous);
  }
  notify();
  return dest;
}

export async function removeItemImage(key: string): Promise<void> {
  await hydrateItemImages();
  const existing = cache[key];
  if (!existing) {
    return;
  }
  const { [key]: _removed, ...rest } = cache;
  cache = rest;
  await persist();
  await deleteFileQuietly(existing);
  notify();
}

async function requestGalleryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const permission =
    Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
  const granted = await PermissionsAndroid.request(permission, {
    title: 'Photo access',
    message: 'Allow access to choose an item photo from your gallery.',
    buttonPositive: 'Allow',
    buttonNegative: 'Cancel',
  });
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/** Open the gallery and return the picked photo URI (null if cancelled). */
export async function pickItemPhotoFromGallery(): Promise<string | null> {
  const allowed = await requestGalleryPermission();
  if (!allowed) {
    throw new Error(
      'Photo permission denied. Allow gallery access in Android settings.',
    );
  }

  const response = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    quality: 0.8,
    maxWidth: 800,
    maxHeight: 800,
  });

  if (response.didCancel || response.errorCode) {
    return null;
  }
  return response.assets?.[0]?.uri ?? null;
}

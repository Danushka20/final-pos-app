import { useEffect, useMemo, useReducer } from 'react';
import {
  getItemImagePath,
  hydrateItemImages,
  itemImageKey,
  subscribeItemImages,
  toFileUri,
} from '@/services/storage/itemImageStorage';
import { resolveItemImageUrl } from '@/utils/resolveItemImageUrl';

/**
 * Image for an item: photo saved on this phone first,
 * server image_url as fallback.
 */
export function useItemImage(item: {
  id?: number | null;
  item_number?: string | null;
  image_url?: string | null;
}): string | null {
  const [, forceRender] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const unsubscribe = subscribeItemImages(forceRender);
    void hydrateItemImages();
    return unsubscribe;
  }, []);

  return useMemo(() => {
    const local = getItemImagePath(itemImageKey(item));
    if (local) {
      return toFileUri(local);
    }
    return resolveItemImageUrl(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.item_number, item.image_url]);
}

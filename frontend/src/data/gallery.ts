import type { GalleryItem } from '../types';

export type GalleryDisplayItem = Pick<
  GalleryItem,
  '_id' | 'title' | 'image' | 'category' | 'description'
>;

export function mergeGalleryItems(items: GalleryItem[] = []): GalleryDisplayItem[] {
  return items.map(({ _id, title, image, category, description }) => ({
    _id,
    title,
    image,
    category,
    description,
  }));
}

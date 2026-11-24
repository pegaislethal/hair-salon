import type { GalleryItem } from '../types';

export type GalleryDisplayItem = Pick<
  GalleryItem,
  '_id' | 'title' | 'image' | 'category' | 'description'
>;

export const localGalleryItems: GalleryDisplayItem[] = [
  {
    _id: 'iris-textured-hair-transformation',
    title: 'Textured Hair Transformation',
    image: '/gallery/textured-hair-transformation.webp',
    category: 'Men',
    description: 'A textured haircut finished at Iris Salon.',
  },
];

export function mergeGalleryItems(items: GalleryItem[] = []): GalleryDisplayItem[] {
  const localImages = new Set(localGalleryItems.map((item) => item.image));
  const databaseItems = items
    .filter((item) => !localImages.has(item.image))
    .map(({ _id, title, image, category, description }) => ({
      _id,
      title,
      image,
      category,
      description,
    }));

  return [...localGalleryItems, ...databaseItems];
}

import { createContext, useContext, useState, useEffect } from 'react';
import Dexie, { DexieError } from 'dexie';

interface FoodItem {
  id: string;
  name: string;
  image?: string | null; // Store as data URL string instead of Blob
  category: string | string[];
  description?: string;
  order?: number;
}

interface FoodContextType {
  foodItems: FoodItem[];
  addFoodItem: (item: Omit<FoodItem, 'id'>) => Promise<void>;
  updateFoodItem: (id: string, item: Partial<FoodItem>) => Promise<void>;
  deleteFoodItem: (id: string) => Promise<void>;
  storageWarning: string | null;
}

const FoodContext = createContext<FoodContextType | undefined>(undefined);

// Initialize IndexedDB with Dexie
const db = new Dexie('FoodMenuDB');
db.version(4).stores({
  foodItems: 'id, name, *category, description, order', // No image indexing
}).upgrade(tx => {
  // Migration from version 3: Clean up invalid image data
  return tx.table('foodItems').toCollection().modify((item) => {
    // Remove any remaining Blobs (will be handled in loadFoodItems)
    if (item.image instanceof Blob) {
      item.image = null; // Mark for conversion in loadFoodItems
      console.log(`Marked Blob for conversion: ${item.name}`);
    } else if (typeof item.image === 'string' && !item.image.startsWith('data:') && item.image !== '/placeholder.svg') {
      // Legacy URLs that are not data URLs or placeholders
      item.image = null;
      console.log(`Cleaned invalid image URL for: ${item.name}`);
    }
  });
});

export const useFoodContext = () => {
  const context = useContext(FoodContext);
  if (context === undefined) {
    throw new Error('useFoodContext must be used within a FoodProvider');
  }
  return context;
};

export const FoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [storageWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if the app is in standalone mode (PWA installed)
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches;

  // Request persistent storage and check storage quota
  useEffect(() => {
    const manageStorage = async () => {
      try {
        if (!isStandalone()) {
          if (navigator.storage && navigator.storage.persisted) {
            const isPersisted = await navigator.storage.persisted();
            console.log(`Is storage persistent? ${isPersisted}`);
            if (!isPersisted && navigator.storage.persist) {
              const granted = await navigator.storage.persist();
              console.log(`Persistent storage request result: ${granted}`);
              if (!granted) {
                console.warn('Persistent storage not granted; data may be evicted.');
              }
            }
          } else {
            console.warn('Persistent storage API not supported in this browser.');
          }
        }

        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          console.log(`Storage Quota: ${estimate.quota} bytes available, ${estimate.usage} bytes used`);
          if (estimate.quota && estimate.usage && estimate.usage / estimate.quota > 0.9) {
            console.warn('Storage is near capacity; this may cause data loss.');
          }
        }
      } catch (error) {
        console.error('Error managing storage:', error);
      }
    };
    manageStorage();
  }, []);

  // Convert Blob to data URL
  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      reader.readAsDataURL(blob);
    });
  };

  // Load food items from IndexedDB on mount
  useEffect(() => {
    const loadFoodItems = async () => {
      try {
        setIsLoading(true);
        await db.open();
        console.log('Database opened successfully');
        
        const items = await db.table('foodItems').toArray();
        console.log(`Loaded ${items.length} items from IndexedDB`);

        if (items.length === 0) {
          // Initialize with default items
          const defaultItems: FoodItem[] = [
            {
              id: '1',
              name: 'Dosa',
              category: ['Breakfast'],
              image: null,
              description: 'Crispy South Indian pancake served with coconut chutney and sambar',
              order: 1,
            },
            {
              id: '2',
              name: 'Rice',
              category: ['Lunch'],
              image: null,
              description: 'Steamed basmati rice, perfect with curries and dal',
              order: 2,
            },
            {
              id: '3',
              name: 'Sambar',
              category: ['Lunch'],
              image: null,
              description: 'Traditional South Indian lentil curry with vegetables',
              order: 3,
            },
            {
              id: '4',
              name: 'Chapati',
              category: ['Dinner'],
              image: null,
              description: 'Soft whole wheat flatbread, freshly made',
              order: 4,
            },
            {
              id: '5',
              name: 'Tea',
              category: ['Snacks'],
              image: null,
              description: 'Hot Indian spiced tea with milk and sugar',
              order: 5,
            },
          ];
          await db.table('foodItems').bulkPut(defaultItems);
          console.log('Initialized default items in IndexedDB');
          setFoodItems(defaultItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
        } else {
          // Process loaded items: Convert Blobs to data URLs and fix invalid images
          const processedItems: FoodItem[] = [];
          const updatePromises: Promise<any>[] = [];

          console.log('Processing images for display...');
          
          for (const item of items) {
            let processedItem = { ...item };
            
            // Handle image processing
            if (item.image instanceof Blob) {
              console.log(`Converting Blob to data URL for: ${item.name}`);
              const convertPromise = blobToDataUrl(item.image)
                .then((dataUrl) => {
                  processedItem.image = dataUrl;
                  // Update database immediately
                  return db.table('foodItems').update(item.id, { image: dataUrl });
                })
                .catch((error) => {
                  console.error(`Error converting image for ${item.name}:`, error);
                  processedItem.image = null;
                  return db.table('foodItems').update(item.id, { image: null });
                });
              updatePromises.push(convertPromise);
            } else if (typeof item.image === 'string') {
              // Validate data URL or placeholder
              if (item.image.startsWith('data:image/') || item.image === '/placeholder.svg') {
                processedItem.image = item.image;
              } else {
                console.log(`Invalid image format for ${item.name}, setting to null`);
                processedItem.image = null;
                updatePromises.push(db.table('foodItems').update(item.id, { image: null }));
              }
            } else {
              processedItem.image = null;
            }
            
            processedItems.push(processedItem);
          }

          // Wait for all database updates to complete
          if (updatePromises.length > 0) {
            console.log(`Updating ${updatePromises.length} images in database...`);
            await Promise.all(updatePromises);
          }

          const sortedItems = processedItems.sort((a, b) => (a.order || 0) - (b.order || 0));
          console.log('Food items processed and sorted:', sortedItems.map(item => ({ name: item.name, hasImage: !!item.image })));
          
          setFoodItems(sortedItems);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading food items from IndexedDB:', error);
        setIsLoading(false);
        // Fallback to default items if loading fails
        const defaultItems: FoodItem[] = [
          {
            id: '1',
            name: 'Dosa',
            category: ['Breakfast'],
            image: null,
            description: 'Crispy South Indian pancake served with coconut chutney and sambar',
            order: 1,
          },
          {
            id: '2',
            name: 'Rice',
            category: ['Lunch'],
            image: null,
            description: 'Steamed basmati rice, perfect with curries and dal',
            order: 2,
          },
        ];
        setFoodItems(defaultItems);
      }
    };

    loadFoodItems();
  }, []);

  const addFoodItem = async (item: Omit<FoodItem, 'id'>) => {
    try {
      let imageDataUrl: string | null = null;
      
      // Convert File/Blob to data URL if provided
      if (item.image instanceof File || item.image instanceof Blob) {
        try {
          imageDataUrl = await blobToDataUrl(item.image);
          console.log(`Converted uploaded image to data URL for: ${item.name} (Size: ${(item.image.size / 1024).toFixed(1)}KB)`);
        } catch (error) {
          console.error('Error converting uploaded image:', error);
          imageDataUrl = null;
          console.warn(`Failed to convert image for ${item.name}, using no image`);
        }
      } else if (typeof item.image === 'string' && item.image.startsWith('data:image/')) {
        // Already a data URL
        imageDataUrl = item.image;
      }
      
      const newItem: FoodItem = {
        ...item,
        id: Date.now().toString(),
        image: imageDataUrl,
        description: item.description || `Delicious ${item.name} from our kitchen`,
        order: item.order || Date.now(),
      };
      
      console.log(`Saving food item: ${newItem.name} with ${imageDataUrl ? 'image' : 'no image'}`);
      
      await db.table('foodItems').put(newItem);
      console.log(`Added food item to database: ${newItem.name}`);
      
      // Add to state with proper sorting
      setFoodItems((prev) => {
        const updated = [...prev, newItem].sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log(`Updated state with ${updated.length} items`);
        return updated;
      });
    } catch (error: any) {
      console.error('Error adding food item to IndexedDB:', error);
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage limit exceeded. Please clear some menu items.');
      } else {
        throw new Error('Failed to add food item. Please try again.');
      }
    }
  };

  const updateFoodItem = async (id: string, updatedItem: Partial<FoodItem>) => {
    try {
      const existingItem = await db.table('foodItems').get(id);
      if (!existingItem) {
        throw new Error('Food item not found');
      }

      let imageDataUrl: string | null = existingItem.image;
      
      // Handle new image upload
      if (updatedItem.image instanceof File || updatedItem.image instanceof Blob) {
        try {
          imageDataUrl = await blobToDataUrl(updatedItem.image);
          console.log(`Updated image to data URL for: ${updatedItem.name || existingItem.name}`);
        } catch (error) {
          console.error('Error converting updated image:', error);
          imageDataUrl = null;
        }
      } else if (updatedItem.image === null || updatedItem.image === undefined) {
        imageDataUrl = null;
      } else if (typeof updatedItem.image === 'string' && updatedItem.image.startsWith('data:image/')) {
        imageDataUrl = updatedItem.image;
      }

      const updated: FoodItem = {
        ...existingItem,
        ...updatedItem,
        image: imageDataUrl,
        description: updatedItem.description || existingItem.description || `Delicious ${updatedItem.name || existingItem.name} from our kitchen`,
        order: updatedItem.order !== undefined ? updatedItem.order : existingItem.order,
      };

      console.log(`Updating food item: ${updated.name} with ${imageDataUrl ? 'image' : 'no image'}`);
      
      await db.table('foodItems').put(updated);
      console.log(`Updated food item in database: ${updated.name}`);
      
      setFoodItems((prev) => {
        const updatedList = prev
          .map((item) => (item.id === id ? updated : item))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log(`Updated state for item: ${updated.name}`);
        return updatedList;
      });
    } catch (error: any) {
      console.error('Error updating food item in IndexedDB:', error);
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage limit exceeded. Please clear some menu items.');
      } else {
        throw new Error('Failed to update food item. Please try again.');
      }
    }
  };

  const deleteFoodItem = async (id: string) => {
    try {
      await db.table('foodItems').delete(id);
      console.log(`Deleted food item with id: ${id}`);
      setFoodItems((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        console.log(`Removed item, ${updated.length} items remaining`);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting food item from IndexedDB:', error);
      throw new Error('Failed to delete food item. Please try again.');
    }
  };

  const value = {
    foodItems,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    storageWarning,
    isLoading, // Add loading state for debugging
  };

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
};
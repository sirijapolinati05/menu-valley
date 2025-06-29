
import React, { createContext, useContext, useState, useEffect } from 'react';

interface FoodItem {
  id: string;
  name: string;
  image?: string;
  category: string;
  description?: string;
}

interface FoodContextType {
  foodItems: FoodItem[];
  addFoodItem: (item: Omit<FoodItem, 'id'>) => void;
  updateFoodItem: (id: string, item: Partial<FoodItem>) => void;
  deleteFoodItem: (id: string) => void;
}

const FoodContext = createContext<FoodContextType | undefined>(undefined);

export const useFoodContext = () => {
  const context = useContext(FoodContext);
  if (context === undefined) {
    throw new Error('useFoodContext must be used within a FoodProvider');
  }
  return context;
};

export const FoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { 
      id: '1', 
      name: 'Dosa', 
      category: 'Breakfast', 
      image: '/placeholder.svg',
      description: 'Crispy South Indian pancake served with coconut chutney and sambar'
    },
    { 
      id: '2', 
      name: 'Rice', 
      category: 'Lunch', 
      image: '/placeholder.svg',
      description: 'Steamed basmati rice, perfect with curries and dal'
    },
    { 
      id: '3', 
      name: 'Sambar', 
      category: 'Lunch', 
      image: '/placeholder.svg',
      description: 'Traditional South Indian lentil curry with vegetables'
    },
    { 
      id: '4', 
      name: 'Chapati', 
      category: 'Dinner', 
      image: '/placeholder.svg',
      description: 'Soft whole wheat flatbread, freshly made'
    },
    { 
      id: '5', 
      name: 'Tea', 
      category: 'Snacks', 
      image: '/placeholder.svg',
      description: 'Hot Indian spiced tea with milk and sugar'
    },
  ]);

  // Load food items from localStorage on component mount
  useEffect(() => {
    const savedFoodItems = localStorage.getItem('hostel_food_items');
    if (savedFoodItems) {
      setFoodItems(JSON.parse(savedFoodItems));
    }
  }, []);

  // Save food items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hostel_food_items', JSON.stringify(foodItems));
  }, [foodItems]);

  const addFoodItem = (item: Omit<FoodItem, 'id'>) => {
    const newItem: FoodItem = {
      ...item,
      id: Date.now().toString(),
      image: item.image || '/placeholder.svg',
      description: item.description || `Delicious ${item.name} from our kitchen`
    };
    setFoodItems(prev => [...prev, newItem]);
  };

  const updateFoodItem = (id: string, updatedItem: Partial<FoodItem>) => {
    setFoodItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updatedItem } : item
    ));
  };

  const deleteFoodItem = (id: string) => {
    setFoodItems(prev => prev.filter(item => item.id !== id));
  };

  const value = {
    foodItems,
    addFoodItem,
    updateFoodItem,
    deleteFoodItem
  };

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
};

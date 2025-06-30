
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useFoodContext } from '@/contexts/FoodContext';

interface FoodItem {
  id: string;
  name: string;
  category: string | string[];
  image?: string;
}

interface DayMenu {
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
}

const TodaysFoodMenu = () => {
  const { foodItems } = useFoodContext();
  const [todaysMenu, setTodaysMenu] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch today's menu from localStorage on mount
  useEffect(() => {
    const today = new Date().toDateString();
    const savedMenus = localStorage.getItem('weekly_menus');
    let menuItems: FoodItem[] = [];

    if (savedMenus) {
      const weeklyMenus: Record<string, DayMenu> = JSON.parse(savedMenus);
      const todayMenu = weeklyMenus[today] || {
        breakfast: foodItems
          .filter((item: FoodItem) =>
            Array.isArray(item.category)
              ? item.category.map(c => c.toLowerCase()).includes('breakfast')
              : item.category.toLowerCase() === 'breakfast'
          )
          .slice(0, 1)
          .map((item: FoodItem) => item.name),
        lunch: foodItems
          .filter((item: FoodItem) =>
            Array.isArray(item.category)
              ? item.category.map(c => c.toLowerCase()).includes('lunch')
              : item.category.toLowerCase() === 'lunch'
          )
          .slice(0, 1)
          .map((item: FoodItem) => item.name),
        snacks: foodItems
          .filter((item: FoodItem) =>
            Array.isArray(item.category)
              ? item.category.map(c => c.toLowerCase()).includes('snacks')
              : item.category.toLowerCase() === 'snacks'
          )
          .slice(0, 1)
          .map((item: FoodItem) => item.name),
        dinner: foodItems
          .filter((item: FoodItem) =>
            Array.isArray(item.category)
              ? item.category.map(c => c.toLowerCase()).includes('dinner')
              : item.category.toLowerCase() === 'dinner'
          )
          .slice(0, 1)
          .map((item: FoodItem) => item.name)
      };

      // Convert menu items to FoodItem format
      menuItems = [
        ...todayMenu.breakfast.map(name => ({
          ...foodItems.find((item: FoodItem) => item.name === name) || { name, category: 'Breakfast' },
          id: `breakfast-${name}`,
          category: 'Breakfast'
        })),
        ...todayMenu.lunch.map(name => ({
          ...foodItems.find((item: FoodItem) => item.name === name) || { name, category: 'Lunch' },
          id: `lunch-${name}`,
          category: 'Lunch'
        })),
        ...todayMenu.snacks.map(name => ({
          ...foodItems.find((item: FoodItem) => item.name === name) || { name, category: 'Snacks' },
          id: `snacks-${name}`,
          category: 'Snacks'
        })),
        ...todayMenu.dinner.map(name => ({
          ...foodItems.find((item: FoodItem) => item.name === name) || { name, category: 'Dinner' },
          id: `dinner-${name}`,
          category: 'Dinner'
        }))
      ];
    }

    setTodaysMenu(menuItems);
  }, [foodItems]);

  const filteredItems = todaysMenu.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Breakfast': return 'bg-yellow-100 text-yellow-800';
      case 'Lunch': return 'bg-green-100 text-green-800';
      case 'Snacks': return 'bg-purple-100 text-purple-800';
      case 'Dinner': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-orange-700">Today's Food Menu</h2>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search today's menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Menu Categories */}
      <div className="space-y-8">
        {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((category) => {
          const categoryItems = filteredItems.filter(item => item.category === category);

          return (
            <div key={category} className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                {category}
                <Badge className={getCategoryColor(category)}>
                  {categoryItems.length} items
                </Badge>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-500 text-sm">
                          No Image
                        </div>
                      )}
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                        </div>
                        <Badge className={getCategoryColor(item.category as string)}>
                          {item.category}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {categoryItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No items planned for {category} today</p>
                  <Button variant="outline" className="mt-2">
                    Add {category} Items
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TodaysFoodMenu;

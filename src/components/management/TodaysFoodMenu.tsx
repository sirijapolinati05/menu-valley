
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface TodaysFoodItem {
  id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
  votes: number;
  image?: string;
}

const TodaysFoodMenu = () => {
  const [todaysMenu, setTodaysMenu] = useState<TodaysFoodItem[]>([
    { id: '1', name: 'Dosa', category: 'Breakfast', votes: 45, image: '/placeholder.svg' },
    { id: '2', name: 'Rice', category: 'Lunch', votes: 67, image: '/placeholder.svg' },
    { id: '3', name: 'Sambar', category: 'Lunch', votes: 52, image: '/placeholder.svg' },
    { id: '4', name: 'Tea', category: 'Snacks', votes: 78, image: '/placeholder.svg' },
    { id: '5', name: 'Chapati', category: 'Dinner', votes: 34, image: '/placeholder.svg' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');

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
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription className="text-sm text-green-600">
                            {item.votes} votes received
                          </CardDescription>
                        </div>
                        <Badge className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((item.votes / 100) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        {item.votes}/100 students voted
                      </p>
                    </CardContent>
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


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useFoodContext } from '@/contexts/FoodContext';

const StudentFoodMenu = () => {
  const { foodItems } = useFoodContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = foodItems.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = Array.isArray(item.category) 
      ? item.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      : item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || categoryMatch;
  });

  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800';
      case 'lunch': return 'bg-green-100 text-green-800';
      case 'snacks': return 'bg-purple-100 text-purple-800';
      case 'dinner': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCategoryBadges = (category: string | string[]) => {
    if (Array.isArray(category)) {
      return category.map((cat, index) => (
        <Badge key={index} className={`${getCategoryBadgeColor(cat)} mr-1`}>
          {cat}
        </Badge>
      ));
    }
    return <Badge className={getCategoryBadgeColor(category)}>{category}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-green-700">Food Menu</h2>
        <div className="text-sm text-gray-600">
          Browse all available food items
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search food items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Food Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              ) : (
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-500 text-sm">
                  No Image Available
                </div>
              )}
              <div className="space-y-2">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <div className="flex flex-wrap gap-1">
                  {renderCategoryBadges(item.category)}
                </div>
                {item.description && (
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500">
                Available in hostel menu
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No food items found</p>
          <p className="text-sm mt-2">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default StudentFoodMenu;

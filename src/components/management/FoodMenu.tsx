
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface FoodItem {
  id: string;
  name: string;
  image?: string;
  category: string;
}

const FoodMenu = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { id: '1', name: 'Dosa', category: 'Breakfast', image: '/placeholder.svg' },
    { id: '2', name: 'Rice', category: 'Lunch', image: '/placeholder.svg' },
    { id: '3', name: 'Sambar', category: 'Lunch', image: '/placeholder.svg' },
    { id: '4', name: 'Chapati', category: 'Dinner', image: '/placeholder.svg' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredItems = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFood = () => {
    if (newFoodName && newFoodCategory) {
      const newItem: FoodItem = {
        id: Date.now().toString(),
        name: newFoodName,
        category: newFoodCategory,
        image: '/placeholder.svg'
      };
      setFoodItems([...foodItems, newItem]);
      setNewFoodName('');
      setNewFoodCategory('');
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-orange-700">Food Menu Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">Add New Food Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Food Item</DialogTitle>
              <DialogDescription>
                Add a new food item to the menu with category and image.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="food-name">Food Name</Label>
                <Input
                  id="food-name"
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  placeholder="Enter food name"
                />
              </div>
              <div>
                <Label htmlFor="food-category">Category</Label>
                <Input
                  id="food-category"
                  value={newFoodCategory}
                  onChange={(e) => setNewFoodCategory(e.target.value)}
                  placeholder="Breakfast, Lunch, Snacks, Dinner"
                />
              </div>
              <div>
                <Label htmlFor="food-image">Upload Image</Label>
                <Input
                  id="food-image"
                  type="file"
                  accept="image/*"
                />
              </div>
              <Button onClick={handleAddFood} className="w-full">
                Add Food Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-32 object-cover rounded-lg mb-2"
              />
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription className="text-sm text-orange-600">
                {item.category}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Edit Item
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FoodMenu;


import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFoodContext } from '@/contexts/FoodContext';

interface FoodItem {
  id: string;
  name: string;
  category: string | string[];
  image?: string;
  description?: string;
}

interface DayMenu {
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
}

interface VoteSelection {
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
}

const StudentTodaysMenu = () => {
  const { foodItems } = useFoodContext();
  const [todaysMenu, setTodaysMenu] = useState<DayMenu>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: []
  });
  const [todaysVote, setTodaysVote] = useState<VoteSelection | null>(null);
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<VoteSelection>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: []
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Load menu and vote from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const savedMenus = localStorage.getItem('weekly_menus');
    if (savedMenus) {
      const menus = JSON.parse(savedMenus);
      setTodaysMenu(menus[today] || {
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
      });
    }

    const savedVotes = localStorage.getItem('weekly_votes');
    if (savedVotes) {
      const votes = JSON.parse(savedVotes);
      setTodaysVote(votes[today] || null);
    }
  }, [foodItems]);

  // Separate food items by category for voting dialog
  const breakfastItems = foodItems.filter((item: FoodItem) =>
    Array.isArray(item.category)
      ? item.category.map(c => c.toLowerCase()).includes('breakfast')
      : item.category.toLowerCase() === 'breakfast'
  );
  const lunchItems = foodItems.filter((item: FoodItem) =>
    Array.isArray(item.category)
      ? item.category.map(c => c.toLowerCase()).includes('lunch')
      : item.category.toLowerCase() === 'lunch'
  );
  const snackItems = foodItems.filter((item: FoodItem) =>
    Array.isArray(item.category)
      ? item.category.map(c => c.toLowerCase()).includes('snacks')
      : item.category.toLowerCase() === 'snacks'
  );
  const dinnerItems = foodItems.filter((item: FoodItem) =>
    Array.isArray(item.category)
      ? item.category.map(c => c.toLowerCase()).includes('dinner')
      : item.category.toLowerCase() === 'dinner'
  );

  // Helper function to get image for a food item by name
  const getFoodItemImage = (name: string, categoryItems: FoodItem[]): string | undefined => {
    const item = categoryItems.find((item) => item.name === name);
    return item?.image;
  };

  const handleVote = () => {
    const today = new Date().toDateString();
    if (todaysVote) {
      toast({
        title: "You have already casted your vote",
        description: `You have already voted for ${today}. You can only vote once per day.`,
        variant: "destructive"
      });
      return;
    }
    setIsVoteDialogOpen(true);
  };

  const handleItemSelect = (category: keyof VoteSelection, itemName: string, checked: boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [category]: checked
        ? [...prev[category], itemName]
        : prev[category].filter(name => name !== itemName)
    }));
  };

  const handleSubmitVote = () => {
    if (
      selectedItems.breakfast.length === 0 &&
      selectedItems.lunch.length === 0 &&
      selectedItems.snacks.length === 0 &&
      selectedItems.dinner.length === 0
    ) {
      toast({
        title: "No items selected",
        description: "Please select at least one food item to vote.",
        variant: "destructive"
      });
      return;
    }

    const today = new Date().toDateString();
    const savedVotes = localStorage.getItem('weekly_votes');
    const updatedVotes = savedVotes ? JSON.parse(savedVotes) : {};
    updatedVotes[today] = selectedItems;

    setTodaysVote(selectedItems);
    localStorage.setItem('weekly_votes', JSON.stringify(updatedVotes));
    setIsVoteDialogOpen(false);
    setSelectedItems({ breakfast: [], lunch: [], snacks: [], dinner: [] });
    toast({
      title: "Vote submitted successfully!",
      description: `You voted for items on ${today}.`,
    });
  };

  const filteredMenu = {
    breakfast: todaysMenu.breakfast.filter(name =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    lunch: todaysMenu.lunch.filter(name =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    snacks: todaysMenu.snacks.filter(name =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    dinner: todaysMenu.dinner.filter(name =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-green-700">Today's Menu</h2>
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

      {todaysVote && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ You have already voted for today's menu. Thank you for your participation!
        </div>
      )}

      {/* Vote Button */}
      {!todaysVote && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Cast Your Vote</CardTitle>
            <CardDescription>
              Select the food items you'd like to have today. You can vote only once per day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleVote}
              className="bg-green-600 hover:bg-green-700"
            >
              Vote for Interest
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Menu Categories */}
      <div className="space-y-8">
        {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((category) => {
          const categoryItems = filteredMenu[category.toLowerCase() as keyof DayMenu];
          const categoryItemsData = {
            Breakfast: breakfastItems,
            Lunch: lunchItems,
            Snacks: snackItems,
            Dinner: dinnerItems
          }[category];

          return (
            <div key={category} className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                {category}
                <Badge className={
                  category === 'Breakfast' ? 'bg-yellow-100 text-yellow-800' :
                  category === 'Lunch' ? 'bg-green-100 text-green-800' :
                  category === 'Snacks' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {categoryItems.length} items
                </Badge>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map((item, idx) => (
                  <Card key={idx} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      {getFoodItemImage(item, categoryItemsData) ? (
                        <img
                          src={getFoodItemImage(item, categoryItemsData)}
                          alt={item}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center text-gray-500 text-sm">
                          No Image
                        </div>
                      )}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item}</CardTitle>
                          <CardDescription className="text-sm">
                            {categoryItemsData.find(i => i.name === item)?.description || 'No description available'}
                          </CardDescription>
                        </div>
                        <Badge className={
                          category === 'Breakfast' ? 'bg-yellow-100 text-yellow-800' :
                          category === 'Lunch' ? 'bg-green-100 text-green-800' :
                          category === 'Snacks' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {category}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {categoryItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No items found for {category}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vote Dialog */}
      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vote for Today's Menu</DialogTitle>
            <DialogDescription>Select the food items you are interested in for today.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {['breakfast', 'lunch', 'snacks', 'dinner'].map(category => {
              const categoryItems = {
                breakfast: breakfastItems,
                lunch: lunchItems,
                snacks: snackItems,
                dinner: dinnerItems
              }[category as keyof DayMenu];
              const selectedCategoryItems = selectedItems[category as keyof VoteSelection];

              return (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700 capitalize">{category}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {categoryItems.map((item: FoodItem) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedCategoryItems.includes(item.name)}
                          onCheckedChange={(checked) =>
                            handleItemSelect(category as keyof VoteSelection, item.name, checked as boolean)
                          }
                        />
                        <span>{item.name}</span>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                            No Image
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <Button
              onClick={handleSubmitVote}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={
                selectedItems.breakfast.length === 0 &&
                selectedItems.lunch.length === 0 &&
                selectedItems.snacks.length === 0 &&
                selectedItems.dinner.length === 0
              }
            >
              Submit Vote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentTodaysMenu;

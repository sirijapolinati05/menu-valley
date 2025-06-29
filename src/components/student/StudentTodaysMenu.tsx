
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

interface TodaysFoodItem {
  id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
  image?: string;
  description: string;
}

const StudentTodaysMenu = () => {
  const [todaysMenu] = useState<TodaysFoodItem[]>([
    { 
      id: '1', 
      name: 'Dosa', 
      category: 'Breakfast', 
      image: '/placeholder.svg',
      description: 'Crispy dosa with coconut chutney'
    },
    { 
      id: '2', 
      name: 'Coffee', 
      category: 'Breakfast', 
      image: '/placeholder.svg',
      description: 'Hot filter coffee'
    },
    { 
      id: '3', 
      name: 'Rice', 
      category: 'Lunch', 
      image: '/placeholder.svg',
      description: 'Steamed basmati rice'
    },
    { 
      id: '4', 
      name: 'Sambar', 
      category: 'Lunch', 
      image: '/placeholder.svg',
      description: 'Lentil curry with vegetables'
    },
    { 
      id: '5', 
      name: 'Tea', 
      category: 'Snacks', 
      image: '/placeholder.svg',
      description: 'Evening tea with biscuits'
    },
    { 
      id: '6', 
      name: 'Chapati', 
      category: 'Dinner', 
      image: '/placeholder.svg',
      description: 'Fresh whole wheat chapati'
    },
    { 
      id: '7', 
      name: 'Dal', 
      category: 'Dinner', 
      image: '/placeholder.svg',
      description: 'Yellow lentil curry'
    },
  ]);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hasVoted, setHasVoted] = useState(false);

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(itemId);
    } else {
      newSelection.delete(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleSubmitVote = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one food item to vote.",
        variant: "destructive"
      });
      return;
    }

    setHasVoted(true);
    toast({
      title: "Vote submitted successfully!",
      description: `You voted for ${selectedItems.size} items today.`,
    });
  };

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

      {hasVoted && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ You have already voted for today's menu. Thank you for your participation!
        </div>
      )}

      {/* Vote Section */}
      {!hasVoted && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Cast Your Vote</CardTitle>
            <CardDescription>
              Select the food items you'd like to have today. You can vote only once per day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {selectedItems.size} items selected
              </span>
              <Button 
                onClick={handleSubmitVote}
                className="bg-green-600 hover:bg-green-700"
                disabled={selectedItems.size === 0}
              >
                Submit Vote
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Categories */}
      <div className="space-y-8">
        {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map((category) => {
          const categoryItems = todaysMenu.filter(item => item.category === category);
          
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
                  <Card 
                    key={item.id} 
                    className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
                      selectedItems.has(item.id) ? 'ring-2 ring-green-500 bg-green-50' : ''
                    } ${hasVoted ? 'opacity-60' : ''}`}
                  >
                    <CardHeader className="pb-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {item.description}
                          </CardDescription>
                        </div>
                        {!hasVoted && (
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={(checked) => 
                              handleItemSelect(item.id, checked as boolean)
                            }
                            className="ml-2"
                          />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentTodaysMenu;

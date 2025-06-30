
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFoodContext } from '@/contexts/FoodContext';
import Select from 'react-select';

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

interface VoteSelection {
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
}

const StudentWeeklyCalendar = () => {
  const { foodItems } = useFoodContext();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [weeklyVotes, setWeeklyVotes] = useState<Record<string, VoteSelection>>({});
  const [weeklyMenus, setWeeklyMenus] = useState<Record<string, DayMenu>>({});
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false);
  const [votingDay, setVotingDay] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<VoteSelection>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: []
  });
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Initialize weeklyMenus and weeklyVotes from localStorage on mount
  useEffect(() => {
    try {
      const savedMenus = localStorage.getItem('weekly_menus');
      if (savedMenus) {
        const parsedMenus = JSON.parse(savedMenus);
        if (parsedMenus && typeof parsedMenus === 'object') {
          setWeeklyMenus(parsedMenus);
        }
      }
      const savedVotes = localStorage.getItem('weekly_votes');
      if (savedVotes) {
        const parsedVotes = JSON.parse(savedVotes);
        if (parsedVotes && typeof parsedVotes === 'object') {
          setWeeklyVotes(parsedVotes);
        }
      }
      const savedLastUpdate = localStorage.getItem('last_calendar_update');
      if (savedLastUpdate) {
        setLastUpdate(savedLastUpdate);
      }
    } catch (error) {
      console.error('Error parsing data from localStorage:', error);
    }
  }, []);

  // Update localStorage whenever weeklyMenus or weeklyVotes change
  useEffect(() => {
    try {
      localStorage.setItem('weekly_menus', JSON.stringify(weeklyMenus));
      localStorage.setItem('weekly_votes', JSON.stringify(weeklyVotes));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }, [weeklyMenus, weeklyVotes]);

  // Handle daily updates (remove past days, add new day)
  useEffect(() => {
    const checkUpdate = () => {
      const now = new Date();
      const today = now.toDateString();
      const lastUpdateDate = lastUpdate ? new Date(lastUpdate).toDateString() : null;

      if (now.getHours() >= 0 && lastUpdateDate !== today) {
        const newMenus = { ...weeklyMenus };
        const newVotes = { ...weeklyVotes };

        // Remove past days
        Object.keys(newMenus).forEach(dateKey => {
          const menuDate = new Date(dateKey);
          if (menuDate < new Date(today)) {
            delete newMenus[dateKey];
            delete newVotes[dateKey];
          }
        });

        // Add new day (7th day from today)
        const newDay = new Date(now);
        newDay.setDate(newDay.getDate() + 6);
        const newDayKey = newDay.toDateString();
        if (!newMenus[newDayKey]) {
          newMenus[newDayKey] = {
            breakfast: [],
            lunch: [],
            snacks: [],
            dinner: []
          };
        }

        setWeeklyMenus(newMenus);
        setWeeklyVotes(newVotes);
        localStorage.setItem('weekly_menus', JSON.stringify(newMenus));
        localStorage.setItem('weekly_votes', JSON.stringify(newVotes));
        localStorage.setItem('last_calendar_update', now.toISOString());
        setLastUpdate(now.toISOString());
        setSelectedWeek(new Date(today));
      }
    };

    checkUpdate();
    const interval = setInterval(checkUpdate, 60 * 1000);
    return () => clearInterval(interval);
  }, [weeklyMenus, weeklyVotes, lastUpdate]);

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

  const breakfastOptions = breakfastItems.map((item: FoodItem) => ({ value: item.name, label: item.name }));
  const lunchOptions = lunchItems.map((item: FoodItem) => ({ value: item.name, label: item.name }));
  const snackOptions = snackItems.map((item: FoodItem) => ({ value: item.name, label: item.name }));
  const dinnerOptions = dinnerItems.map((item: FoodItem) => ({ value: item.name, label: item.name }));

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      borderColor: '#e2e8f0',
      borderRadius: '0.375rem',
      padding: '0.25rem'
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#f4f4f5'
    })
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startDate);
      weekDate.setDate(startDate.getDate() + i);
      week.push(new Date(weekDate));
    }
    return week;
  };

  const getDayMenu = (date: Date): DayMenu => {
    const dateKey = date.toDateString();
    return weeklyMenus[dateKey] || {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: []
    };
  };

  const getFoodItemImage = (name: string, categoryItems: FoodItem[]): string | undefined => {
    const item = categoryItems.find((item) => item.name === name);
    return item?.image;
  };

  const handleVoteForDay = (dateKey: string) => {
    if (weeklyVotes[dateKey]) {
      toast({
        title: "You have already cast your vote",
        description: `You have already voted for ${dateKey}. You can only vote once per day.`,
        variant: "destructive"
      });
      return;
    }
    setVotingDay(dateKey);
    setSelectedItems({
      breakfast: weeklyVotes[dateKey]?.breakfast || [],
      lunch: weeklyVotes[dateKey]?.lunch || [],
      snacks: weeklyVotes[dateKey]?.snacks || [],
      dinner: weeklyVotes[dateKey]?.dinner || []
    });
    setIsVoteDialogOpen(true);
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

    const updatedVotes = {
      ...weeklyVotes,
      [votingDay]: selectedItems
    };

    setWeeklyVotes(updatedVotes);
    localStorage.setItem('weekly_votes', JSON.stringify(updatedVotes));
    setIsVoteDialogOpen(false);
    setVotingDay('');
    setSelectedItems({ breakfast: [], lunch: [], snacks: [], dinner: [] });
    toast({
      title: "Vote submitted successfully!",
      description: `You voted for items on ${votingDay}.`,
    });
  };

  const weekDates = getWeekDates(selectedWeek);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-green-700">Weekly Menu Calendar</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-600" />
          <span className="text-gray-600">
            Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-green-800 mb-2">Weekly Voting</h3>
        <p className="text-sm text-green-700">
          Vote for your preferred meals to help hostel management plan quantities and reduce food waste.
        </p>
      </div>

      <div className="space-y-4">
        {weekDates.map((date, index) => {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          const dateKey = date.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          const hasVoted = !!weeklyVotes[dateKey];
          const dayMenu = getDayMenu(date);
          const isEmpty = Object.values(dayMenu).every(meal => meal.length === 0);

          return (
            <Card 
              key={index} 
              className={`${isToday ? 'ring-2 ring-green-500' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className={`text-xl ${isToday ? 'text-green-700' : ''}`}>
                      {dayName}
                    </CardTitle>
                    <CardDescription>
                      {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {isToday && <span className="ml-2 text-green-600 font-medium">(Today)</span>}
                    </CardDescription>
                  </div>
                  <div>
                    {hasVoted ? (
                      <Badge className="bg-green-100 text-green-800">
                        ✓ Voted
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleVoteForDay(dateKey)}
                      >
                        Vote for Interest
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEmpty ? (
                  <div className="text-center py-8 text-gray-500">
                    There is no food planned yet for this day
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Breakfast</h4>
                      <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                        {dayMenu.breakfast.length > 0 ? (
                          dayMenu.breakfast.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-2">
                              {getFoodItemImage(item, breakfastItems) ? (
                                <img
                                  src={getFoodItemImage(item, breakfastItems)}
                                  alt={item}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                  No Image
                                </div>
                              )}
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          'No items selected'
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Lunch</h4>
                      <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                        {dayMenu.lunch.length > 0 ? (
                          dayMenu.lunch.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-2">
                              {getFoodItemImage(item, lunchItems) ? (
                                <img
                                  src={getFoodItemImage(item, lunchItems)}
                                  alt={item}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                  No Image
                                </div>
                              )}
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          'No items selected'
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Snacks</h4>
                      <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                        {dayMenu.snacks.length > 0 ? (
                          dayMenu.snacks.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-2">
                              {getFoodItemImage(item, snackItems) ? (
                                <img
                                  src={getFoodItemImage(item, snackItems)}
                                  alt={item}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                  No Image
                                </div>
                              )}
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          'No items selected'
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Dinner</h4>
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        {dayMenu.dinner.length > 0 ? (
                          dayMenu.dinner.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 mb-2">
                              {getFoodItemImage(item, dinnerItems) ? (
                                <img
                                  src={getFoodItemImage(item, dinnerItems)}
                                  alt={item}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                  No Image
                                </div>
                              )}
                              <span>{item}</span>
                            </div>
                          ))
                        ) : (
                          'No items selected'
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vote for {votingDay}</DialogTitle>
            <DialogDescription>Select the food items you are interested in for this day.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="breakfast">Breakfast</Label>
              <Select
                isMulti
                options={breakfastOptions}
                value={breakfastOptions.filter(option => selectedItems.breakfast.includes(option.value))}
                onChange={(selected) => setSelectedItems(prev => ({
                  ...prev,
                  breakfast: selected ? selected.map(item => item.value) : []
                }))}
                placeholder="Select breakfast items"
                styles={customStyles}
              />
            </div>
            <div>
              <Label htmlFor="lunch">Lunch</Label>
              <Select
                isMulti
                options={lunchOptions}
                value={lunchOptions.filter(option => selectedItems.lunch.includes(option.value))}
                onChange={(selected) => setSelectedItems(prev => ({
                  ...prev,
                  lunch: selected ? selected.map(item => item.value) : []
                }))}
                placeholder="Select lunch items"
                styles={customStyles}
              />
            </div>
            <div>
              <Label htmlFor="snacks">Snacks</Label>
              <Select
                isMulti
                options={snackOptions}
                value={snackOptions.filter(option => selectedItems.snacks.includes(option.value))}
                onChange={(selected) => setSelectedItems(prev => ({
                  ...prev,
                  snacks: selected ? selected.map(item => item.value) : []
                }))}
                placeholder="Select snack items"
                styles={customStyles}
              />
            </div>
            <div>
              <Label htmlFor="dinner">Dinner</Label>
              <Select
                isMulti
                options={dinnerOptions}
                value={dinnerOptions.filter(option => selectedItems.dinner.includes(option.value))}
                onChange={(selected) => setSelectedItems(prev => ({
                  ...prev,
                  dinner: selected ? selected.map(item => item.value) : []
                }))}
                placeholder="Select dinner items"
                styles={customStyles}
              />
            </div>
            <Button 
              onClick={handleSubmitVote}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Submit Vote
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentWeeklyCalendar;

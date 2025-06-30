
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { useFoodContext } from '@/contexts/FoodContext';
import Select from 'react-select';

interface WeeklyCalendarProps {}

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

const WeeklyCalendar = ({}: WeeklyCalendarProps) => {
  const { foodItems } = useFoodContext();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<string>('');
  const [weeklyMenus, setWeeklyMenus] = useState<Record<string, DayMenu>>({});
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Initialize weeklyMenus from localStorage on mount
  useEffect(() => {
    console.log('Loading weekly menus from localStorage...');
    try {
      const savedMenus = localStorage.getItem('weekly_menus');
      console.log('Saved menus from localStorage:', savedMenus);
      
      if (savedMenus) {
        const parsedMenus = JSON.parse(savedMenus);
        console.log('Parsed menus:', parsedMenus);
        
        if (parsedMenus && typeof parsedMenus === 'object') {
          setWeeklyMenus(parsedMenus);
          console.log('Set weekly menus state:', parsedMenus);
        }
      }
      
      const savedLastUpdate = localStorage.getItem('last_calendar_update');
      if (savedLastUpdate) {
        setLastUpdate(savedLastUpdate);
      }
    } catch (error) {
      console.error('Error parsing weekly_menus from localStorage:', error);
    }
  }, []);

  // Update localStorage whenever weeklyMenus changes
  useEffect(() => {
    console.log('Saving weekly menus to localStorage:', weeklyMenus);
    try {
      localStorage.setItem('weekly_menus', JSON.stringify(weeklyMenus));
      console.log('Successfully saved to localStorage');
    } catch (error) {
      console.error('Error saving weekly_menus to localStorage:', error);
    }
  }, [weeklyMenus]);

  // Handle daily updates (remove past days, add new day)
  useEffect(() => {
    const checkUpdate = () => {
      const now = new Date();
      const today = now.toDateString();
      const lastUpdateDate = lastUpdate ? new Date(lastUpdate).toDateString() : null;

      console.log('Checking daily update:', { today, lastUpdateDate });

      if (now.getHours() >= 0 && lastUpdateDate !== today) {
        console.log('Performing daily update...');
        
        const newMenus = { ...weeklyMenus };
        
        // Remove past days
        Object.keys(newMenus).forEach(dateKey => {
          const menuDate = new Date(dateKey);
          if (menuDate < new Date(today)) {
            console.log('Removing past day:', dateKey);
            delete newMenus[dateKey];
          }
        });

        // Add new day (7th day from today)
        const newDay = new Date(now);
        newDay.setDate(newDay.getDate() + 6);
        const newDayKey = newDay.toDateString();
        
        if (!newMenus[newDayKey]) {
          console.log('Adding new day:', newDayKey);
          newMenus[newDayKey] = {
            breakfast: [],
            lunch: [],
            snacks: [],
            dinner: []
          };
        }

        setWeeklyMenus(newMenus);
        localStorage.setItem('weekly_menus', JSON.stringify(newMenus));
        localStorage.setItem('last_calendar_update', now.toISOString());
        setLastUpdate(now.toISOString());
        setSelectedWeek(new Date(today));
        
        console.log('Daily update completed');
      }
    };

    checkUpdate();
    const interval = setInterval(checkUpdate, 60 * 1000);
    return () => clearInterval(interval);
  }, [weeklyMenus, lastUpdate]);

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

  const [editMenu, setEditMenu] = useState<DayMenu>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: []
  });

  const getWeekDates = (date: Date) => {
    const week = [];
    const startDate = new Date(date);
    
    // Start from today
    startDate.setHours(0, 0, 0, 0);
    
    // Generate 7 days starting from today
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startDate);
      weekDate.setDate(startDate.getDate() + i);
      week.push(new Date(weekDate));
    }
    return week;
  };

  const handleEditMenu = (date: Date) => {
    const dateKey = date.toDateString();
    console.log('Opening edit menu for:', dateKey);
    
    setEditingDay(dateKey);
    const existingMenu = weeklyMenus[dateKey] || {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: []
    };
    
    console.log('Existing menu for', dateKey, ':', existingMenu);
    setEditMenu(existingMenu);
    setIsEditDialogOpen(true);
  };

  const handleSaveMenu = () => {
    console.log('Saving menu for:', editingDay);
    console.log('Menu data:', editMenu);
    
    const updatedMenus = {
      ...weeklyMenus,
      [editingDay]: { ...editMenu }
    };

    console.log('Updated menus object:', updatedMenus);
    
    setWeeklyMenus(updatedMenus);
    
    // Force save to localStorage immediately
    localStorage.setItem('weekly_menus', JSON.stringify(updatedMenus));
    console.log('Menu saved to localStorage');
    
    setIsEditDialogOpen(false);
    setEditingDay('');
    setEditMenu({
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: []
    });
  };

  const getDayMenu = (date: Date): DayMenu => {
    const dateKey = date.toDateString();
    const menu = weeklyMenus[dateKey] || {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: []
    };
    
    console.log('Getting menu for', dateKey, ':', menu);
    return menu;
  };

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

  const getFoodItemImage = (name: string, categoryItems: FoodItem[]): string | undefined => {
    const item = categoryItems.find((item) => item.name === name);
    return item?.image;
  };

  const weekDates = getWeekDates(selectedWeek);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-orange-700">Weekly Food Calendar</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-600" />
          <span className="text-gray-600">
            Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {weekDates.map((date, index) => {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          const isToday = date.toDateString() === new Date().toDateString();
          const dayMenu = getDayMenu(date);
          const isEmpty = Object.values(dayMenu).every(meal => meal.length === 0);

          return (
            <Card key={index} className={`${isToday ? 'ring-2 ring-orange-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className={`text-xl ${isToday ? 'text-orange-700' : ''}`}>
                      {dayName}
                    </CardTitle>
                    <CardDescription>
                      {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {isToday && <span className="ml-2 text-orange-600 font-medium">(Today)</span>}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMenu(date)}
                  >
                    Edit Menu
                  </Button>
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
                          dayMenu.breakfast.map((item: string, idx: number) => (
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
                          dayMenu.lunch.map((item: string, idx: number) => (
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
                          dayMenu.snacks.map((item: string, idx: number) => (
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
                          dayMenu.dinner.map((item: string, idx: number) => (
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Day Menu</DialogTitle>
            <DialogDescription>Select multiple food items for each meal time.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="breakfast">Breakfast</Label>
              <Select
                isMulti
                options={breakfastOptions}
                value={breakfastOptions.filter(option => editMenu.breakfast.includes(option.value))}
                onChange={(selected) => setEditMenu(prev => ({
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
                value={lunchOptions.filter(option => editMenu.lunch.includes(option.value))}
                onChange={(selected) => setEditMenu(prev => ({
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
                value={snackOptions.filter(option => editMenu.snacks.includes(option.value))}
                onChange={(selected) => setEditMenu(prev => ({
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
                value={dinnerOptions.filter(option => editMenu.dinner.includes(option.value))}
                onChange={(selected) => setEditMenu(prev => ({
                  ...prev,
                  dinner: selected ? selected.map(item => item.value) : []
                }))}
                placeholder="Select dinner items"
                styles={customStyles}
              />
            </div>
            <Button onClick={handleSaveMenu} className="w-full">
              Save Menu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeeklyCalendar;

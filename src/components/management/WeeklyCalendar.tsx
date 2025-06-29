
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { useFoodContext } from '@/contexts/FoodContext';

interface WeeklyCalendarProps {}

interface DayMenu {
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
}

const WeeklyCalendar = ({}: WeeklyCalendarProps) => {
  const { foodItems } = useFoodContext();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<string>('');
  const [weeklyMenus, setWeeklyMenus] = useState<Record<string, DayMenu>>({});

  // Load weekly menus from localStorage on component mount
  useEffect(() => {
    const savedMenus = localStorage.getItem('weekly_menus');
    if (savedMenus) {
      setWeeklyMenus(JSON.parse(savedMenus));
    }
  }, []);

  // Separate food items by category
  const breakfastItems = foodItems.filter(item => item.category.toLowerCase() === 'breakfast');
  const lunchItems = foodItems.filter(item => item.category.toLowerCase() === 'lunch');
  const snackItems = foodItems.filter(item => item.category.toLowerCase() === 'snacks');
  const dinnerItems = foodItems.filter(item => item.category.toLowerCase() === 'dinner');

  const [editMenu, setEditMenu] = useState<DayMenu>({
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: ''
  });

  const getWeekDates = (date: Date) => {
    const week = [];
    const startDate = new Date(date);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day;
    
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startDate.setDate(diff + i));
      week.push(new Date(weekDate));
    }
    return week;
  };

  const weekDates = getWeekDates(selectedWeek);

  const handleEditMenu = (date: Date) => {
    const dateKey = date.toDateString();
    setEditingDay(dateKey);
    
    // Load existing menu or set defaults
    const existingMenu = weeklyMenus[dateKey] || {
      breakfast: breakfastItems[0]?.name || 'Dosa',
      lunch: lunchItems[0]?.name || 'Rice',
      snacks: snackItems[0]?.name || 'Tea',
      dinner: dinnerItems[0]?.name || 'Chapati'
    };
    
    setEditMenu(existingMenu);
    setIsEditDialogOpen(true);
  };

  const handleSaveMenu = () => {
    const updatedMenus = {
      ...weeklyMenus,
      [editingDay]: editMenu
    };
    
    setWeeklyMenus(updatedMenus);
    localStorage.setItem('weekly_menus', JSON.stringify(updatedMenus));
    
    setIsEditDialogOpen(false);
    setEditingDay('');
  };

  const getDayMenu = (date: Date): DayMenu => {
    const dateKey = date.toDateString();
    return weeklyMenus[dateKey] || {
      breakfast: 'Dosa, Coffee',
      lunch: 'Rice, Sambar, Vegetables',
      snacks: 'Tea, Biscuits',
      dinner: 'Chapati, Dal, Curry'
    };
  };

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Breakfast</h4>
                    <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                      {dayMenu.breakfast}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Lunch</h4>
                    <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                      {dayMenu.lunch}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Snacks</h4>
                    <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
                      {dayMenu.snacks}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Dinner</h4>
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      {dayMenu.dinner}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Menu Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Day Menu</DialogTitle>
            <DialogDescription>
              Select food items for each meal time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="breakfast">Breakfast</Label>
              <Select value={editMenu.breakfast} onValueChange={(value) => setEditMenu(prev => ({ ...prev, breakfast: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select breakfast item" />
                </SelectTrigger>
                <SelectContent>
                  {breakfastItems.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="Dosa, Coffee">Dosa, Coffee</SelectItem>
                  <SelectItem value="Idli, Sambar">Idli, Sambar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lunch">Lunch</Label>
              <Select value={editMenu.lunch} onValueChange={(value) => setEditMenu(prev => ({ ...prev, lunch: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lunch item" />
                </SelectTrigger>
                <SelectContent>
                  {lunchItems.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="Rice, Sambar, Vegetables">Rice, Sambar, Vegetables</SelectItem>
                  <SelectItem value="Rice, Dal, Curry">Rice, Dal, Curry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="snacks">Snacks</Label>
              <Select value={editMenu.snacks} onValueChange={(value) => setEditMenu(prev => ({ ...prev, snacks: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select snacks item" />
                </SelectTrigger>
                <SelectContent>
                  {snackItems.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="Tea, Biscuits">Tea, Biscuits</SelectItem>
                  <SelectItem value="Tea, Samosa">Tea, Samosa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dinner">Dinner</Label>
              <Select value={editMenu.dinner} onValueChange={(value) => setEditMenu(prev => ({ ...prev, dinner: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dinner item" />
                </SelectTrigger>
                <SelectContent>
                  {dinnerItems.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="Chapati, Dal, Curry">Chapati, Dal, Curry</SelectItem>
                  <SelectItem value="Chapati, Rajma, Rice">Chapati, Rajma, Rice</SelectItem>
                </SelectContent>
              </Select>
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

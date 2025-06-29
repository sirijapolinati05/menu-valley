
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface WeeklyCalendarProps {}

const WeeklyCalendar = ({}: WeeklyCalendarProps) => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());

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

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <Card key={index} className={`${isToday ? 'ring-2 ring-orange-500' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${isToday ? 'text-orange-700' : ''}`}>
                  {dayName}
                </CardTitle>
                <CardDescription>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {isToday && <span className="ml-2 text-orange-600 font-medium">(Today)</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Breakfast</h4>
                  <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                    Dosa, Coffee
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Lunch</h4>
                  <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                    Rice, Sambar, Vegetables
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Snacks</h4>
                  <div className="text-sm text-gray-600 bg-purple-50 p-2 rounded">
                    Tea, Biscuits
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Dinner</h4>
                  <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    Chapati, Dal, Curry
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                >
                  Edit Menu
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendar;

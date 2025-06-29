
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface DayMenu {
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
}

const StudentWeeklyCalendar = () => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [weeklyVotes, setWeeklyVotes] = useState<Record<string, boolean>>({});
  const [weeklyMenus, setWeeklyMenus] = useState<Record<string, DayMenu>>({});

  // Load weekly menus from localStorage (shared with management)
  useEffect(() => {
    const savedMenus = localStorage.getItem('weekly_menus');
    if (savedMenus) {
      setWeeklyMenus(JSON.parse(savedMenus));
    }
  }, []);

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

  const handleVoteForDay = (dateKey: string) => {
    setWeeklyVotes(prev => ({
      ...prev,
      [dateKey]: true
    }));
  };

  const getDayMenu = (date: Date): DayMenu => {
    const dateKey = date.toDateString();
    return weeklyMenus[dateKey] || {
      breakfast: 'Idli, Sambar, Chutney',
      lunch: 'Rice, Dal, Vegetable Curry',
      snacks: 'Tea, Samosa',
      dinner: 'Chapati, Rajma, Rice'
    };
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Weekly Voting</h3>
        <p className="text-sm text-blue-700">
          You can vote for your interest in upcoming meals. This helps the hostel management plan better quantities and reduce food waste.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          const dateKey = date.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date() && !isToday;
          const hasVoted = weeklyVotes[dateKey];
          const dayMenu = getDayMenu(date);
          
          return (
            <Card 
              key={index} 
              className={`${isToday ? 'ring-2 ring-green-500' : ''} ${isPast ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${isToday ? 'text-green-700' : ''}`}>
                  {dayName}
                </CardTitle>
                <CardDescription>
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {isToday && <span className="ml-2 text-green-600 font-medium">(Today)</span>}
                  {isPast && <span className="ml-2 text-gray-500">(Past)</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Breakfast</h4>
                  <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                    {dayMenu.breakfast}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Lunch</h4>
                  <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                    {dayMenu.lunch}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Snacks</h4>
                  <div className="text-sm text-gray-600 bg-purple-50 p-2 rounded">
                    {dayMenu.snacks}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Dinner</h4>
                  <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    {dayMenu.dinner}
                  </div>
                </div>
                
                <div className="pt-2">
                  {hasVoted ? (
                    <Badge className="w-full bg-green-100 text-green-800 justify-center">
                      ✓ Voted
                    </Badge>
                  ) : isPast ? (
                    <Badge className="w-full bg-gray-100 text-gray-500 justify-center">
                      Past Day
                    </Badge>
                  ) : isToday ? (
                    <Badge className="w-full bg-blue-100 text-blue-800 justify-center">
                      Vote in Today's Menu
                    </Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleVoteForDay(dateKey)}
                    >
                      Vote for Interest
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StudentWeeklyCalendar;

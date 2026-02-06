import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useFoodContext } from '@/contexts/FoodContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { db } from '@/integrations/firebase/client';
import { collection, onSnapshot, FirestoreError, getCountFromServer, query, where } from 'firebase/firestore';
import { toast } from '@/components/ui/use-toast';

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
  others: string[];
}

interface VoteSelection {
  breakfast: Array<{ item: string; count: number }>;
  lunch: Array<{ item: string; count: number }>;
  snacks: Array<{ item: string; count: number }>;
  dinner: Array<{ item: string; count: number }>;
  others: Array<{ item: string; count: number }>;
}

interface ComplaintSelection {
  breakfast: Array<{ item: string; count: number }>;
  lunch: Array<{ item: string; count: number }>;
  snacks: Array<{ item: string; count: number }>;
  dinner: Array<{ item: string; count: number }>;
  others: Array<{ item: string; count: number }>;
}

const DEFAULT_OTHERS_OPTIONS = [
  "I didn’t come to the hostel mess for breakfast today.",
  "I didn’t come to the hostel mess for lunch today.",
  "I didn’t come to the hostel mess for snacks today.",
  "I didn’t come to the hostel mess for dinner today.",
  "I was on an outing, so I didn’t come to eat at the hostel mess today."
];

const TodaysFoodMenu = () => {
  const { foodItems } = useFoodContext();
  const [todaysMenu, setTodaysMenu] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [weeklyVotes, setWeeklyVotes] = useState<Record<string, VoteSelection>>({});
  const [weeklyComplaints, setWeeklyComplaints] = useState<Record<string, ComplaintSelection>>({});
  const [error, setError] = useState<string | null>(null);
  const [totalStudents, setTotalStudents] = useState<number>(0);

  const categoryColors: { [key: string]: { base: string; hover: string } } = {
    Breakfast: { base: 'bg-blue-100 text-blue-800', hover: 'hover:bg-red-200 hover:text-red-900' },
    Lunch: { base: 'bg-green-100 text-gray-800', hover: 'hover:bg-orange-200 hover:text-orange-900' },
    Snacks: { base: 'bg-yellow-100 text-yellow-800', hover: 'hover:bg-purple-200 hover:text-purple-900' },
    Dinner: { base: 'bg-purple-100 text-purple-800', hover: 'hover:bg-green-200 hover:text-green-900' },
    Others: { base: 'bg-gray-100 text-gray-800', hover: 'hover:bg-gray-200 hover:text-gray-900' }
  };

  // Fetch total students from Firestore
  useEffect(() => {
    const fetchTotalStudents = async () => {
      try {
        const studentsRef = collection(db, 'students');
        const snapshot = await getCountFromServer(studentsRef);
        setTotalStudents(snapshot.data().count);
        console.log('Fetched total students:', snapshot.data().count);
      } catch (error) {
        const firestoreError = error as FirestoreError;
        console.error('Error fetching total students:', firestoreError.message);
        setError('Failed to load student count. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load student count.',
          variant: 'destructive',
        });
      }
    };
    fetchTotalStudents();
  }, []);

  // Fetch today's menu, votes, and complaints from Firestore
  useEffect(() => {
    const today = new Date().toDateString();
    const savedMenus = localStorage.getItem('weekly_menus');
    let menuItems: FoodItem[] = [];

    // Load menus from localStorage
    if (savedMenus && savedMenus !== 'undefined' && savedMenus !== 'null') {
      try {
        const weeklyMenus: Record<string, DayMenu> = JSON.parse(savedMenus);
        const todayMenu = weeklyMenus[today] || {
          breakfast: [],
          lunch: [],
          snacks: [],
          dinner: [],
          others: DEFAULT_OTHERS_OPTIONS
        };

        menuItems = [
          ...todayMenu.breakfast.map(name => ({
            ...foodItems.find((item: FoodItem) => item.name.toLowerCase().trim() === name.toLowerCase().trim()) || {
              name,
              category: 'Breakfast',
              image: undefined,
              description: undefined
            },
            id: `breakfast-${name.toLowerCase().trim()}`,
            category: 'Breakfast'
          })),
          ...todayMenu.lunch.map(name => ({
            ...foodItems.find((item: FoodItem) => item.name.toLowerCase().trim() === name.toLowerCase().trim()) || {
              name,
              category: 'Lunch',
              image: undefined,
              description: undefined
            },
            id: `lunch-${name.toLowerCase().trim()}`,
            category: 'Lunch'
          })),
          ...todayMenu.snacks.map(name => ({
            ...foodItems.find((item: FoodItem) => item.name.toLowerCase().trim() === name.toLowerCase().trim()) || {
              name,
              category: 'Snacks',
              image: undefined,
              description: undefined
            },
            id: `snacks-${name.toLowerCase().trim()}`,
            category: 'Snacks'
          })),
          ...todayMenu.dinner.map(name => ({
            ...foodItems.find((item: FoodItem) => item.name.toLowerCase().trim() === name.toLowerCase().trim()) || {
              name,
              category: 'Dinner',
              image: undefined,
              description: undefined
            },
            id: `dinner-${name.toLowerCase().trim()}`,
            category: 'Dinner'
          })),
          ...todayMenu.others.map(name => ({
            name,
            id: `others-${name.toLowerCase().trim()}`,
            category: 'Others',
            image: undefined,
            description: undefined
          }))
        ];
      } catch (error) {
        console.error('Error parsing weekly_menus from localStorage:', error);
        setError('Failed to load menu data. Please try again.');
      }
    } else {
      console.warn('No valid weekly_menus in localStorage');
    }
    setTodaysMenu(menuItems);

    // Fetch votes from Firestore
    const votesRef = collection(db, `weekly_menus/${today}/votes`);
    const unsubscribeVotes = onSnapshot(
      votesRef,
      (snapshot) => {
        const voteCounts: Record<string, Record<string, number>> = {
          breakfast: {},
          lunch: {},
          snacks: {},
          dinner: {},
          others: {}
        };
        snapshot.forEach(doc => {
          const data = doc.data();
          const category = data.category?.toLowerCase();
          const itemName = data.itemName?.toLowerCase().trim();
          if (category && itemName) {
            voteCounts[category][itemName] = (voteCounts[category][itemName] || 0) + 1;
          }
        });
        setWeeklyVotes({
          [today]: {
            breakfast: Object.entries(voteCounts.breakfast).map(([item, count]) => ({ item, count })),
            lunch: Object.entries(voteCounts.lunch).map(([item, count]) => ({ item, count })),
            snacks: Object.entries(voteCounts.snacks).map(([item, count]) => ({ item, count })),
            dinner: Object.entries(voteCounts.dinner).map(([item, count]) => ({ item, count })),
            others: Object.entries(voteCounts.others).map(([item, count]) => ({ item, count }))
          }
        });
        console.log('Loaded votes for today:', voteCounts);
      },
      (error: FirestoreError) => {
        console.error('Error fetching votes from Firestore:', error.message);
        setError('Failed to load votes. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load votes.',
          variant: 'destructive',
        });
      }
    );

    // Fetch complaints from Firestore
    const complaintsRef = collection(db, 'complaints');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const complaintsQuery = query(
      complaintsRef,
      where('date', '>=', todayStart.toISOString().split('T')[0]),
      where('date', '<=', todayEnd.toISOString())
    );
    const unsubscribeComplaints = onSnapshot(
      complaintsQuery,
      (snapshot) => {
        const complaintCounts: Record<string, Record<string, number>> = {
          breakfast: {},
          lunch: {},
          snacks: {},
          dinner: {},
          others: {}
        };
        snapshot.forEach(doc => {
          const data = doc.data();
          const category = data.category?.toLowerCase();
          const foodItem = data.foodItem?.toLowerCase().trim();
          if (category && foodItem) {
            complaintCounts[category][foodItem] = (complaintCounts[category][foodItem] || 0) + 1;
          }
        });
        setWeeklyComplaints({
          [today]: {
            breakfast: Object.entries(complaintCounts.breakfast).map(([item, count]) => ({ item, count })),
            lunch: Object.entries(complaintCounts.lunch).map(([item, count]) => ({ item, count })),
            snacks: Object.entries(complaintCounts.snacks).map(([item, count]) => ({ item, count })),
            dinner: Object.entries(complaintCounts.dinner).map(([item, count]) => ({ item, count })),
            others: Object.entries(complaintCounts.others).map(([item, count]) => ({ item, count }))
          }
        });
        console.log('Loaded complaints for today:', complaintCounts);
      },
      (error: FirestoreError) => {
        console.error('Error fetching complaints from Firestore:', error.message);
        setError('Failed to load complaints. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load complaints.',
          variant: 'destructive',
        });
      }
    );

    return () => {
      unsubscribeVotes();
      unsubscribeComplaints();
    };
  }, [foodItems]);

  const getVoteCount = (dateKey: string, category: string, itemName: string): number => {
    if (!weeklyVotes[dateKey] || !weeklyVotes[dateKey][category.toLowerCase() as keyof VoteSelection]) {
      console.log(`No votes for ${dateKey}/${category}`);
      return 0;
    }
    const normalizedItemName = itemName.toLowerCase().trim();
    const vote = weeklyVotes[dateKey][category.toLowerCase() as keyof VoteSelection].find(
      (v: { item: string; count: number }) => v.item.toLowerCase().trim() === normalizedItemName
    );
    const voteCount = vote ? vote.count : 0;
    console.log(`Vote count for ${category}/${itemName} (normalized: ${normalizedItemName}): ${voteCount}`);
    return voteCount;
  };

  const getComplaintCount = (dateKey: string, category: string, itemName: string): number => {
    if (!weeklyComplaints[dateKey] || !weeklyComplaints[dateKey][category.toLowerCase() as keyof ComplaintSelection]) {
      console.log(`No complaints for ${dateKey}/${category}`);
      return 0;
    }
    const normalizedItemName = itemName.toLowerCase().trim();
    const complaint = weeklyComplaints[dateKey][category.toLowerCase() as keyof ComplaintSelection].find(
      (c: { item: string; count: number }) => c.item.toLowerCase().trim() === normalizedItemName
    );
    const complaintCount = complaint ? complaint.count : 0;
    console.log(`Complaint count for ${category}/${itemName} (normalized: ${normalizedItemName}): ${complaintCount}`);
    return complaintCount;
  };

  const filteredItems = todaysMenu.filter(item =>
    item.name.toLowerCase().trim().includes(searchTerm.toLowerCase().trim())
  );

  const renderCategoryBadges = (category: string | string[]) => {
    if (Array.isArray(category)) {
      return category.map((cat, index) => (
        <span
          key={index}
          className={`inline-block category-button ${categoryColors[cat]?.base || 'bg-gray-100 text-gray-800'} ${categoryColors[cat]?.hover || 'hover:bg-gray-200 hover:text-gray-900'}`}
        >
          {cat}
        </span>
      ));
    }
    return (
      <span
        className={`inline-block category-button ${categoryColors[category]?.base || 'bg-gray-100 text-gray-800'} ${categoryColors[category]?.hover || 'hover:bg-gray-200 hover:text-gray-900'}`}
      >
        {category}
      </span>
    );
  };

  const handleSubmitItems = () => {
    if (!selectedCategory || selectedItems.length === 0) return;

    const today = new Date().toDateString();
    const savedMenus = localStorage.getItem('weekly_menus');
    let weeklyMenus: Record<string, DayMenu> = savedMenus && savedMenus !== 'undefined' && savedMenus !== 'null'
      ? JSON.parse(savedMenus)
      : {};

    if (!weeklyMenus[today]) {
      weeklyMenus[today] = { breakfast: [], lunch: [], snacks: [], dinner: [], others: DEFAULT_OTHERS_OPTIONS };
    }

    const categoryKey = selectedCategory.toLowerCase() as keyof DayMenu;
    const newItems = selectedItems.filter(item => !weeklyMenus[today][categoryKey].includes(item));
    weeklyMenus[today][categoryKey] = [...weeklyMenus[today][categoryKey], ...newItems];
    localStorage.setItem('weekly_menus', JSON.stringify(weeklyMenus));

    const newMenuItems = newItems.map(name => {
      const isOthersCategory = selectedCategory === 'Others';
      const foodItem = isOthersCategory
        ? { name, category: 'Others', image: undefined, description: undefined }
        : foodItems.find((item: FoodItem) => item.name.toLowerCase().trim() === name.toLowerCase().trim()) || {
            name,
            category: selectedCategory,
            image: undefined,
            description: undefined
          };
      return {
        ...foodItem,
        id: `${selectedCategory.toLowerCase()}-${name.toLowerCase().trim()}`,
        category: selectedCategory
      };
    });

    setTodaysMenu(prev => [...prev, ...newMenuItems]);
    setSelectedItems([]);
    setIsModalOpen(false);
    toast({
      title: 'Success',
      description: `Added ${newItems.length} item(s) to ${selectedCategory} menu.`,
    });
  };

  const availableItemsForCategory = (category: string) => {
    if (category === 'Others') {
      return DEFAULT_OTHERS_OPTIONS.map(option => ({
        id: `others-${option.toLowerCase().trim()}`,
        name: option,
        category: 'Others',
        image: undefined,
        description: undefined
      }));
    }
    return foodItems
      .filter((item: FoodItem) =>
        Array.isArray(item.category)
          ? item.category.map(c => c.toLowerCase()).includes(category.toLowerCase())
          : item.category.toLowerCase() === category.toLowerCase()
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleCheckboxChange = (itemName: string) => {
    setSelectedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const handleCardClick = (item: FoodItem) => {
    console.log(`Clicked on ${item.name} in ${item.category}`);
  };

  return (
    <div className="space-y-6 px-2">
      <style>
        {`
          @keyframes bulge {
            0% {
              transform: scale(1);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35), inset 0 -3px 5px rgba(0, 0, 0, 0.25), inset 0 3px 5px rgba(255, 255, 255, 0.5);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
            }
          }
          .food-card:hover {
            animation: bulge 1.5s infinite ease-in-out;
          }
          .category-button {
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.2);
            padding: 0.1rem 0.4rem;
            font-size: 0.65rem;
            line-height: 1.2;
            border-radius: 0.375rem;
            white-space: nowrap;
          }
          .category-button:hover {
            transform: scale(1.1);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -1px 2px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }
          @media (max-width: 640px) {
            .category-button {
              padding: 0.05rem 0.3rem;
              font-size: 0.55rem;
              line-height: 1.1;
              border-radius: 0.25rem;
            }
            .category-button:hover {
              transform: scale(1.05);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.2);
            }
          }
          .complaint-badge:hover {
            background-color: #9333ea !important;
            color: #ffffff !important;
            transform: scale(1.1);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -1px 2px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }
          .action-button {
            transition: all 0.3s ease;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3);
            padding: 0.2rem 0.4rem;
            font-size: 0.65rem;
            line-height: 1;
            height: 1.75rem;
          }
          .action-button:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 3px rgba(0, 0, 0, 0.15), inset 0 2px 3px rgba(255, 255, 255, 0.4);
          }
          .others-button {
            transition: all 0.3s ease;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            background: linear-gradient(to bottom, #f3f4f6, #d1d5db);
            transform: translateY(0);
          }
          .others-button:hover {
            transform: scale(1.08) translateY(-4px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), inset 0 -3px 6px rgba(0, 0, 0, 0.25), inset 0 3px 6px rgba(255, 255, 255, 0.5);
            background: linear-gradient(to bottom, #e5e7eb, #cbd5e1);
          }
          .others-button:active {
            transform: scale(0.98) translateY(2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -1px 2px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.3);
            background: linear-gradient(to bottom, #d1d5db, #b3b7c2);
          }
          .food-image-container {
            position: relative;
            width: 100%;
            padding-top: 56.25%; /* 16:9 aspect ratio */
            overflow: hidden;
            border-radius: 0.5rem;
          }
          .food-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .search-bar {
            box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 -4px 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
            background-color: #ffffff !important;
            color: #000000 !important;
          }
        `}
      </style>
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-lg md:text-xl font-bold text-orange-700 whitespace-nowrap">
          Today's Food Menu
        </h2>
        <div className="text-xs sm:text-sm text-gray-600">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {error && (
        <div className="text-center mb-6 text-red-600">
          {error}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search today's menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 search-bar"
        />
      </div>

      <div className="space-y-8">
        {['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Others'].map((category) => {
          const categoryItems = filteredItems.filter(item => item.category === category);

          return (
            <div key={category} className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                {category}
                {category !== 'Others' && (
                  <span
                    className={`inline-block category-button ${categoryColors[category]?.base || 'bg-gray-100 text-gray-800'} ${categoryColors[category]?.hover || 'hover:bg-gray-200 hover:text-gray-900'}`}
                  >
                    {categoryItems.length} items
                  </span>
                )}
              </h3>

              {category === 'Others' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {categoryItems.length > 0 ? (
                    categoryItems.map((item) => (
                      <button
                        key={item.id}
                        className="others-button p-4 bg-gray-100 text-gray-800 rounded-lg flex flex-col items-start gap-2 w-full text-left transition-all duration-300"
                        onClick={() => handleCardClick(item)}
                      >
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="inline-block category-button bg-yellow-600 text-white hover:bg-sky-700 hover:text-white">
                          Votes: {getVoteCount(new Date().toDateString(), item.category as string, item.name)}/{totalStudents}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100 w-full max-w-[600px] transition-all duration-200 cursor-pointer transform food-card col-span-2 sm:col-span-4"
                      style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
                    >
                      <span className="text-xs text-gray-600">No items selected</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {categoryItems.map((item) => (
                    <Card
                      key={item.id}
                      className="transition-all duration-300 cursor-pointer transform food-card"
                      style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
                      onClick={() => handleCardClick(item)}
                    >
                      <CardHeader className="pb-3">
                        {item.image ? (
                          <div className="food-image-container">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="food-image"
                            />
                          </div>
                        ) : (
                          <div
                            className="food-image-container bg-gray-200 flex items-center justify-center text-gray-500 text-sm"
                          >
                            No Image Available
                          </div>
                        )}
                        <CardTitle className="text-lg mt-2">{item.name}</CardTitle>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {renderCategoryBadges(item.category)}
                        </div>
                        {item.description && (
                          <CardDescription className="text-xs text-gray-600 mt-1">
                            {item.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="px-4 py-2 flex gap-2">
                        <span className="inline-block category-button bg-yellow-600 text-white hover:bg-sky-700 hover:text-white">
                          Votes: {getVoteCount(new Date().toDateString(), item.category as string, item.name)}/{totalStudents}
                        </span>
                        <span className="inline-block category-button complaint-badge bg-red-600 text-white">
                          Complaints: {getComplaintCount(new Date().toDateString(), item.category as string, item.name)}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="text-center py-8 text-gray-500">
                {categoryItems.length === 0 && <p>No items planned for {category} today</p>}
                {categoryItems.length === 0 && (
                  <Dialog open={isModalOpen && selectedCategory === category} onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (open) {
                      setSelectedCategory(category);
                      setSelectedItems([]);
                    } else {
                      setSelectedCategory(null);
                      setSelectedItems([]);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="action-button border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100"
                        style={{ boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)' }}
                      >
                        Add {category} Items
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add {category} Items</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-96 overflow-y-auto">
                        {availableItemsForCategory(category).length > 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            {availableItemsForCategory(category).map((item: FoodItem) => (
                              <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={item.id}
                                  checked={selectedItems.includes(item.name)}
                                  onCheckedChange={() => handleCheckboxChange(item.name)}
                                  className="h-4 w-4 text-orange-500 focus:ring-2 focus:ring-orange-300"
                                />
                                <Label htmlFor={item.id} className="text-sm">{item.name}</Label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No {category} items available</p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsModalOpen(false)}
                          className="action-button border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100"
                          style={{ boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)' }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitItems}
                          disabled={selectedItems.length === 0}
                          className="action-button bg-orange-500 text-white font-bold border-orange-600 hover:bg-orange-600 hover:text-white"
                          style={{ boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)' }}
                        >
                          Submit
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TodaysFoodMenu;
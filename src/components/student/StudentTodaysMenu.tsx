import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Search, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFoodContext } from '@/contexts/FoodContext';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, query, where, getCountFromServer, onSnapshot, FirestoreError } from 'firebase/firestore';

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
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
  others: string[];
}

const DEFAULT_OTHERS_OPTIONS = [
  "I didn’t come to the hostel mess for breakfast today.",
  "I didn’t come to the hostel mess for lunch today.",
  "I didn’t come to the hostel mess for snacks today.",
  "I didn’t come to the hostel mess for dinner today",
  "I was on an outing, so I didn’t come to eat at the hostel mess today."
];

const StudentTodaysMenu = () => {
  const { foodItems } = useFoodContext();
  const { user, loading: authLoading } = useAuth();
  const [todaysMenu, setTodaysMenu] = useState<DayMenu>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: [],
    others: DEFAULT_OTHERS_OPTIONS
  });
  const [todaysVote, setTodaysVote] = useState<VoteSelection>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: [],
    others: []
  });
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<VoteSelection>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: [],
    others: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toDateString();

  const categoryColors: { [key: string]: { base: string; hover: string } } = {
    Breakfast: { base: 'bg-blue-100 text-blue-800', hover: 'hover:bg-red-200 hover:text-red-900' },
    Lunch: { base: 'bg-green-100 text-green-800', hover: 'hover:bg-orange-200 hover:text-orange-900' },
    Snacks: { base: 'bg-yellow-100 text-yellow-800', hover: 'hover:bg-purple-200 hover:text-purple-900' },
    Dinner: { base: 'bg-purple-100 text-purple-800', hover: 'hover:bg-green-200 hover:text-green-900' },
    Others: { base: 'bg-gray-100 text-gray-800', hover: 'hover:bg-gray-200 hover:text-gray-900' }
  };

  useEffect(() => {
    if (authLoading || !user || user.displayName !== 'student') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const savedMenus = localStorage.getItem('weekly_menus');
      if (savedMenus && savedMenus !== 'undefined' && savedMenus !== 'null') {
        const menus = JSON.parse(savedMenus);
        const todayMenu = menus[today];
        if (todayMenu) {
          setTodaysMenu({
            ...todayMenu,
            others: DEFAULT_OTHERS_OPTIONS
          });
        } else {
          setTodaysMenu({
            breakfast: [],
            lunch: [],
            snacks: [],
            dinner: [],
            others: DEFAULT_OTHERS_OPTIONS
          });
        }
      }
    } catch (error) {
      console.error('Error loading menu from localStorage:', error);
      setError('Failed to load menu data.');
    }

    const votesRef = collection(db, `weekly_menus/${today}/votes`);
    const q = query(votesRef, where('studentId', '==', user.email));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const voteData: VoteSelection = {
          breakfast: [],
          lunch: [],
          snacks: [],
          dinner: [],
          others: []
        };

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.category && data.itemName) {
            voteData[data.category as keyof VoteSelection].push(data.itemName);
          }
        });

        setTodaysVote(voteData);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        console.error(`Error fetching votes for ${today}:`, error.message);
        setError('Failed to load votes.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user]);

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

  const getFoodItemDetails = (name: string, categoryItems: FoodItem[]): FoodItem | undefined => {
    return categoryItems.find((item) => item.name === name);
  };

  const handleVote = () => {
    if (!user || !user.email) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to vote.",
        variant: "destructive"
      });
      return;
    }

    setSelectedItems(todaysVote);
    setIsVoteDialogOpen(true);
  };

  const handleItemSelect = (category: keyof VoteSelection, itemName: string, checked: boolean) => {
    setSelectedItems(prev => {
      const isFifthOption = itemName === DEFAULT_OTHERS_OPTIONS[4];
      const othersIndex = DEFAULT_OTHERS_OPTIONS.indexOf(itemName);

      if (category === 'others') {
        if (isFifthOption) {
          if (checked) {
            return {
              breakfast: [],
              lunch: [],
              snacks: [],
              dinner: [],
              others: [itemName]
            };
          } else {
            return {
              ...prev,
              others: prev.others.filter(name => name !== itemName)
            };
          }
        } else {
          if (checked) {
            const categoryToClear = ['breakfast', 'lunch', 'snacks', 'dinner'][othersIndex];
            return {
              ...prev,
              [categoryToClear]: [],
              others: [...prev.others.filter(opt => opt !== DEFAULT_OTHERS_OPTIONS[4]), itemName]
            };
          } else {
            return {
              ...prev,
              others: prev.others.filter(name => name !== itemName)
            };
          }
        }
      } else {
        if (checked) {
          const correspondingOthersOption = [
            DEFAULT_OTHERS_OPTIONS[0],
            DEFAULT_OTHERS_OPTIONS[1],
            DEFAULT_OTHERS_OPTIONS[2],
            DEFAULT_OTHERS_OPTIONS[3]
          ][['breakfast', 'lunch', 'snacks', 'dinner'].indexOf(category)];
          const updatedCategory = [...prev[category], itemName];
          return {
            ...prev,
            [category]: updatedCategory,
            others: prev.others.filter(opt => opt !== DEFAULT_OTHERS_OPTIONS[4] && opt !== correspondingOthersOption)
          };
        } else {
          const updatedCategory = prev[category].filter(name => name !== itemName);
          return {
            ...prev,
            [category]: updatedCategory
          };
        }
      }
    });
  };

  const handleSubmitVote = async () => {
    if (!user || !user.email) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to vote.",
        variant: "destructive"
      });
      return;
    }

    if (
      selectedItems.breakfast.length === 0 &&
      selectedItems.lunch.length === 0 &&
      selectedItems.snacks.length === 0 &&
      selectedItems.dinner.length === 0 &&
      selectedItems.others.length === 0
    ) {
      toast({
        title: "No items selected",
        description: "Please select at least one food item or other option to vote.",
        variant: "destructive"
      });
      return;
    }

    try {
      const votesRef = collection(db, `weekly_menus/${today}/votes`);

      for (const category of ['breakfast', 'lunch', 'snacks', 'dinner', 'others'] as const) {
        const q = query(
          votesRef,
          where('studentId', '==', user.email),
          where('category', '==', category)
        );
        const snapshot = await getCountFromServer(q);
        if (snapshot.data().count > 0) {
          toast({
            title: "Vote already exists",
            description: `You have already voted for ${category} on ${today}.`,
            variant: "destructive"
          });
          return;
        }
      }

      for (const category of ['breakfast', 'lunch', 'snacks', 'dinner', 'others'] as const) {
        for (const itemName of selectedItems[category]) {
          await addDoc(votesRef, {
            studentId: user.email,
            category,
            itemName,
            timestamp: new Date()
          });
        }
      }

      setTodaysVote({ ...selectedItems });
      setIsVoteDialogOpen(false);
      setSelectedItems({ breakfast: [], lunch: [], snacks: [], dinner: [], others: [] });
      toast({
        title: "Vote submitted successfully!",
        description: `You voted for items on ${today}.`,
      });
    } catch (error) {
      console.error('Error saving votes to Firebase:', error);
      toast({
        title: "Error saving votes",
        description: "Failed to save your votes. Please try again.",
        variant: "destructive"
      });
    }
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
    ),
    others: todaysMenu.others.filter(name =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  };

  const hasAnyMenuPlanned = todaysMenu.breakfast.length > 0 ||
                           todaysMenu.lunch.length > 0 ||
                           todaysMenu.snacks.length > 0 ||
                           todaysMenu.dinner.length > 0;

  const hasFoodVotes = todaysVote && (
    todaysVote.breakfast.length > 0 ||
    todaysVote.lunch.length > 0 ||
    todaysVote.snacks.length > 0 ||
    todaysVote.dinner.length > 0
  );

  const renderCategoryBadges = (category: string) => {
    return (
      <span
        className={`inline-block category-button ${categoryColors[category]?.base || 'bg-gray-100 text-gray-800'} ${categoryColors[category]?.hover || 'hover:bg-gray-200 hover:text-gray-900'}`}
      >
        {category}
      </span>
    );
  };

  if (authLoading || isLoading) {
    return <div className="text-center py-8 text-gray-600">Loading today's menu...</div>;
  }

  if (!user || user.displayName !== 'student') {
    return (
      <div className="text-center py-8 text-red-600">
        {user ? 'Access restricted to students only.' : 'Please log in as a student to view the menu.'}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

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
            .todays-heading {
              font-size: 18px;
              font-weight: 700;
              color: #15803d;
            }
          }
          @media (min-width: 641px) {
            .todays-heading {
              font-size: 20px;
              font-weight: 700;
              color: #15803d;
            }
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
            padding-top: 56.25%;
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
        <h2 className="todays-heading whitespace-nowrap">
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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search today's menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 search-bar"
        />
      </div>

      {!hasAnyMenuPlanned && (
        <Card
          className="bg-yellow-50 border-yellow-200 mx-auto max-w-md transition-all duration-200 cursor-pointer transform food-card"
          style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
        >
          <CardHeader>
            <CardTitle className="text-yellow-700 flex items-center gap-2">
              ⚠️ No Menu Planned Yet
            </CardTitle>
            <CardDescription className="text-center text-xs text-gray-600">
              The management team hasn't planned today's menu yet. Please check back later.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {(todaysVote.breakfast.length > 0 ||
        todaysVote.lunch.length > 0 ||
        todaysVote.snacks.length > 0 ||
        todaysVote.dinner.length > 0 ||
        todaysVote.others.length > 0) && hasAnyMenuPlanned && (
        <Card
          className="bg-green-100 border-green-400 mx-auto max-w-md transition-all duration-200 cursor-pointer transform food-card"
          style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
        >
          <CardHeader>
            <CardTitle className="text-green-700 text-center flex items-center justify-center gap-2">
              ✅ You have already voted
            </CardTitle>
            <CardDescription className="text-center text-xs text-gray-600">
              Thank you for your participation in today's menu voting!
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!(todaysVote.breakfast.length > 0 ||
        todaysVote.lunch.length > 0 ||
        todaysVote.snacks.length > 0 ||
        todaysVote.dinner.length > 0 ||
        todaysVote.others.length > 0) && hasAnyMenuPlanned && (
        <Card
          className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mx-auto max-w-md transition-all duration-200 cursor-pointer transform food-card"
          style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-green-700 text-center">Cast Your Vote</CardTitle>
            <CardDescription className="text-center text-xs text-gray-600">
              Select the food items you'd like to have today. You can vote only once per day.
            </CardDescription>
            <div className="flex justify-center mt-4">
              <Button
                onClick={handleVote}
                className="bg-green-600 hover:bg-green-700 action-button"
                style={{ boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)' }}
              >
                Vote for Interest
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {hasAnyMenuPlanned && (
        <div className="space-y-8">
          {['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Others'].map((category) => {
            const categoryItems = category === 'Others'
              ? filteredMenu.others
              : filteredMenu[category.toLowerCase() as keyof DayMenu];
            const categoryItemsData = {
              Breakfast: breakfastItems,
              Lunch: lunchItems,
              Snacks: snackItems,
              Dinner: dinnerItems,
              Others: []
            }[category];

            if (categoryItems.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  {category}
                  <span
                    className={`inline-block category-button ${categoryColors[category]?.base || 'bg-gray-100 text-gray-800'} ${categoryColors[category]?.hover || 'hover:bg-gray-200 hover:text-gray-900'}`}
                  >
                    {categoryItems.length} {category === 'Others' ? 'options' : 'items'}
                  </span>
                </h3>

                {category === 'Others' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {categoryItems.length > 0 ? (
                      categoryItems.map((item) => (
                        <button
                          key={item}
                          className={`others-button p-4 bg-gray-50 text-gray-800 rounded-lg flex flex-col items-start gap-2 w-full text-left transition-all duration-300 ${todaysVote?.others.includes(item) ? 'border-green-500 bg-green-100' : 'border-gray-100'}`}
                        >
                          <span className={`text-sm font-medium ${todaysVote?.others.includes(item) ? 'text-green-600' : 'text-gray-800'}`}>
                            {item}
                          </span>
                          {todaysVote?.others.includes(item) && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div
                        className="p-3 bg-gray-50 rounded-lg border border-gray-100 w-full max-w-[600px] transition-all duration-200 cursor-pointer transform food-card col-span-2 sm:col-span-4"
                        style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
                      >
                        <span className="text-xs text-gray-600">No others options match the search</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {categoryItems.map((item, idx) => {
                      const itemDetails = getFoodItemDetails(item, categoryItemsData);
                      return (
                        <Card
                          key={idx}
                          className={`transition-all duration-200 cursor-pointer transform food-card ${todaysVote?.[category.toLowerCase() as keyof VoteSelection]?.includes(item) ? 'border-green-500 bg-green-100' : 'border-gray-200'}`}
                          style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
                        >
                          <CardHeader className="pb-3">
                            <div className="food-image-container">
                              {itemDetails?.image ? (
                                <img
                                  src={itemDetails.image}
                                  alt={item}
                                  className="food-image"
                                />
                              ) : (
                                <div className="food-image-container bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                                  No Image Available
                                </div>
                              )}
                              {todaysVote?.[category.toLowerCase() as keyof VoteSelection]?.includes(item) && (
                                <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-500 bg-white rounded-full p-0.5" />
                              )}
                            </div>
                            <CardTitle className={`text-lg mt-2 ${todaysVote?.[category.toLowerCase() as keyof VoteSelection]?.includes(item) ? 'text-green-600' : 'text-gray-800'}`}>
                              {item}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {renderCategoryBadges(category)}
                            </div>
                            {itemDetails?.description && (
                              <CardDescription className="text-xs text-gray-600 mt-1">
                                {itemDetails.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasAnyMenuPlanned && (
        <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vote for Today's Menu</DialogTitle>
              <DialogDesc>Select the food items you are interested in for today or indicate if you won't be eating at the hostel mess.</DialogDesc>
            </DialogHeader>
            <div className="space-y-4">
              {['breakfast', 'lunch', 'snacks', 'dinner'].map(category => {
                const categoryMenuItems = todaysMenu[category as keyof DayMenu];
                const categoryItems = {
                  breakfast: breakfastItems,
                  lunch: lunchItems,
                  snacks: snackItems,
                  dinner: dinnerItems
                }[category as keyof DayMenu];
                const selectedCategoryItems = selectedItems[category as keyof VoteSelection];
                const correspondingOthersOption = [
                  DEFAULT_OTHERS_OPTIONS[0],
                  DEFAULT_OTHERS_OPTIONS[1],
                  DEFAULT_OTHERS_OPTIONS[2],
                  DEFAULT_OTHERS_OPTIONS[3]
                ][['breakfast', 'lunch', 'snacks', 'dinner'].indexOf(category)];
                const isDisabled = selectedItems.others.includes(DEFAULT_OTHERS_OPTIONS[4]) ||
                                 selectedItems.others.includes(correspondingOthersOption);

                if (categoryMenuItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 capitalize">{category}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {categoryMenuItems.map((menuItemName) => {
                        const item = categoryItems.find(i => i.name === menuItemName);
                        if (!item) return null;

                        return (
                          <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
                            <Checkbox
                              checked={selectedCategoryItems.includes(item.name)}
                              onCheckedChange={(checked) =>
                                handleItemSelect(category as keyof VoteSelection, item.name, checked as boolean)
                              }
                              disabled={isDisabled}
                              className="h-4 w-4 text-orange-500 focus:ring-2 focus:ring-orange-300"
                            />
                            <span className="text-sm text-gray-600">{item.name}</span>
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
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700 capitalize">Others</h4>
                <div className="grid grid-cols-1 gap-2">
                  {todaysMenu.others.map((option, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
                      <Checkbox
                        checked={selectedItems.others.includes(option)}
                        onCheckedChange={(checked) => 
                          handleItemSelect('others', option, checked as boolean)
                        }
                        disabled={option !== DEFAULT_OTHERS_OPTIONS[4] && selectedItems.others.includes(DEFAULT_OTHERS_OPTIONS[4])}
                        className="h-4 w-4 text-orange-500 focus:ring-2 focus:ring-orange-300"
                      />
                      <span className="text-sm text-gray-600">{option}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleSubmitVote}
                className="w-full bg-orange-500 hover:bg-orange-600 action-button"
                style={{ boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)' }}
                disabled={
                  selectedItems.breakfast.length === 0 &&
                  selectedItems.lunch.length === 0 &&
                  selectedItems.snacks.length === 0 &&
                  selectedItems.dinner.length === 0 &&
                  selectedItems.others.length === 0
                }
              >
                Submit Vote
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StudentTodaysMenu;
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFoodContext } from '@/contexts/FoodContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, query, where, getDocs, deleteDoc, onSnapshot, FirestoreError, getDoc, doc, setDoc } from 'firebase/firestore';

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
  "I didn’t come to the hostel mess for dinner today.",
  "I was on an outing, so I didn’t come to eat at the hostel mess today."
];

const MOBILE_BREAKPOINT = 768;

const StudentWeeklyCalendar = () => {
  const { foodItems } = useFoodContext();
  const { user, loading: authLoading } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [weeklyVotes, setWeeklyVotes] = useState<Record<string, VoteSelection>>({});
  const [weeklyMenus, setWeeklyMenus] = useState<Record<string, DayMenu>>({});
  const [isVoteDialogOpen, setIsVoteDialogOpen] = useState(false);
  const [votingDay, setVotingDay] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<VoteSelection>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: [],
    others: []
  });
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVotesLoading, setIsVotesLoading] = useState(true);
  const [showOnlyOthers, setShowOnlyOthers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidMenuData = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    return Object.entries(data).every(([dateKey, menu]: [string, any]) => {
      try {
        const date = new Date(dateKey);
        if (isNaN(date.getTime())) return false;
        return (
          menu &&
          typeof menu === 'object' &&
          Array.isArray(menu.breakfast) &&
          Array.isArray(menu.lunch) &&
          Array.isArray(menu.snacks) &&
          Array.isArray(menu.dinner) &&
          Array.isArray(menu.others)
        );
      } catch {
        return false;
      }
    });
  };

  const initializeData = () => {
    setIsLoading(true);
    try {
      const savedMenus = localStorage.getItem('weekly_menus');
      if (savedMenus && savedMenus !== 'undefined' && savedMenus !== 'null') {
        const parsedMenus = JSON.parse(savedMenus);
        if (isValidMenuData(parsedMenus)) {
          // Ensure 'others' is initialized for each day
          const updatedMenus = Object.keys(parsedMenus).reduce((acc, dateKey) => {
            acc[dateKey] = {
              ...parsedMenus[dateKey],
              others: parsedMenus[dateKey].others?.length ? parsedMenus[dateKey].others : [...DEFAULT_OTHERS_OPTIONS]
            };
            return acc;
          }, {} as Record<string, DayMenu>);
          setWeeklyMenus(updatedMenus);
          console.log('StudentWeeklyCalendar: Loaded valid menus from localStorage:', updatedMenus);
        } else {
          setWeeklyMenus({});
          console.warn('StudentWeeklyCalendar: Invalid menu data in localStorage, initializing empty menus');
        }
      } else {
        setWeeklyMenus({});
        console.log('StudentWeeklyCalendar: No menus in localStorage, initializing empty');
      }

      const savedLastUpdate = localStorage.getItem('last_calendar_update');
      if (savedLastUpdate && savedLastUpdate !== 'null') {
        setLastUpdate(savedLastUpdate);
        console.log('StudentWeeklyCalendar: Loaded last update from localStorage:', savedLastUpdate);
      }
    } catch (error) {
      console.error('StudentWeeklyCalendar: Error initializing data from localStorage:', error);
      setWeeklyMenus({});
      setError('Failed to load menu data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVotes = async (weekDates: Date[], userEmail: string, retries = 3, delay = 1000) => {
    setIsVotesLoading(true);
    const normalizedEmail = userEmail.toLowerCase();
    console.log(`StudentWeeklyCalendar: Fetching votes for user: ${normalizedEmail}`);

    const fetchInitialVotes = async (attempt: number) => {
      console.log(`StudentWeeklyCalendar: Initial fetch attempt ${attempt} for ${normalizedEmail}`);
      try {
        for (const date of weekDates) {
          const dateKey = date.toDateString();
          const votesRef = collection(db, `weekly_menus/${dateKey}/votes`);
          const q = query(votesRef, where('studentId', '==', normalizedEmail));
          const snapshot = await getDocs(q);
          const voteData: VoteSelection = {
            breakfast: [],
            lunch: [],
            snacks: [],
            dinner: [],
            others: []
          };

          console.log(`StudentWeeklyCalendar: Initial fetch for ${dateKey}, docs: ${snapshot.size}`);
          snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`StudentWeeklyCalendar: Vote doc: ID=${doc.id}, Data=`, data);
            if (data.category && data.itemName) {
              voteData[data.category as keyof VoteSelection].push(data.itemName);
            }
          });

          if (
            voteData.breakfast.length > 0 ||
            voteData.lunch.length > 0 ||
            voteData.snacks.length > 0 ||
            voteData.dinner.length > 0 ||
            voteData.others.length > 0
          ) {
            setWeeklyVotes(prev => ({
              ...prev,
              [dateKey]: voteData
            }));
            console.log(`StudentWeeklyCalendar: Initial votes set for ${dateKey}:`, voteData);
          } else {
            setWeeklyVotes(prev => {
              const newVotes = { ...prev };
              delete newVotes[dateKey];
              return newVotes;
            });
            console.log(`StudentWeeklyCalendar: No votes for ${dateKey}, removed from state`);
          }
        }
        setIsVotesLoading(false);
      } catch (error) {
        console.error(`StudentWeeklyCalendar: Initial fetch failed (attempt ${attempt}):`, error);
        if (attempt < retries) {
          console.log(`StudentWeeklyCalendar: Retrying initial fetch in ${delay}ms...`);
          setTimeout(() => fetchInitialVotes(attempt + 1), delay);
        } else {
          setError('Failed to load votes after multiple attempts. Please try again.');
          setIsVotesLoading(false);
        }
      }
    };

    const unsubscribeFunctions: Array<() => void> = [];
    weekDates.forEach(date => {
      const dateKey = date.toDateString();
      const votesRef = collection(db, `weekly_menus/${dateKey}/votes`);
      const q = query(votesRef, where('studentId', '==', normalizedEmail));
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

          console.log(`StudentWeeklyCalendar: Snapshot for ${dateKey}, user: ${normalizedEmail}, docs: ${snapshot.size}`);
          snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`StudentWeeklyCalendar: Vote doc: ID=${doc.id}, Data=`, data);
            if (data.category && data.itemName) {
              voteData[data.category as keyof VoteSelection].push(data.itemName);
            }
          });

          setWeeklyVotes(prev => {
            const newVotes = { ...prev };
            if (
              voteData.breakfast.length > 0 ||
              voteData.lunch.length > 0 ||
              voteData.snacks.length > 0 ||
              voteData.dinner.length > 0 ||
              voteData.others.length > 0
            ) {
              newVotes[dateKey] = voteData;
              console.log(`StudentWeeklyCalendar: Updated votes for ${dateKey}:`, voteData);
            } else {
              delete newVotes[dateKey];
              console.log(`StudentWeeklyCalendar: No votes for ${dateKey}, removed from state`);
            }
            return newVotes;
          });
          setIsVotesLoading(false);
        },
        (error: FirestoreError) => {
          console.error(`StudentWeeklyCalendar: Snapshot error for ${dateKey}:`, error.message);
          setError('Failed to load votes in real-time. Falling back to one-time fetch.');
          fetchInitialVotes(1);
        }
      );
      unsubscribeFunctions.push(unsubscribe);
    });

    await fetchInitialVotes(1);

    return () => {
      console.log('StudentWeeklyCalendar: Cleaning up Firestore listeners');
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  };

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      setIsVotesLoading(true);
      console.log('StudentWeeklyCalendar: Auth loading, waiting...');
      return;
    }

    if (!user || user.displayName !== 'student') {
      setIsLoading(false);
      setIsVotesLoading(false);
      console.log('StudentWeeklyCalendar: No user or not a student, skipping vote fetch');
      return;
    }

    initializeData();
    let unsubscribe: (() => void) | undefined;

    const setupVotes = async () => {
      if (user.email) {
        console.log('StudentWeeklyCalendar: Setting up vote listeners for user:', user.email.toLowerCase());
        const weekDates = getWeekDates(selectedWeek);
        unsubscribe = await fetchVotes(weekDates, user.email);
      } else {
        console.error('StudentWeeklyCalendar: No user email, cannot fetch votes');
        setError('User email not found. Please try logging in again.');
        setIsVotesLoading(false);
      }
    };

    setupVotes();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedWeek, user, authLoading]);

  useEffect(() => {
    if (isLoading || authLoading || !user || user.displayName !== 'student') return;

    const checkUpdate = () => {
      const now = new Date();
      const today = now.toDateString();
      const lastUpdateDate = lastUpdate ? new Date(lastUpdate).toDateString() : null;

      if (now.getHours() >= 0 && lastUpdateDate !== today) {
        const newVotes = { ...weeklyVotes };

        Object.keys(newVotes).forEach(dateKey => {
          const voteDate = new Date(dateKey);
          const todayDate = new Date(today);
          if (voteDate < todayDate) {
            delete newVotes[dateKey];
            console.log(`StudentWeeklyCalendar: Removed past votes for ${dateKey}`);
          }
        });

        setWeeklyVotes(newVotes);
        localStorage.setItem('last_calendar_update', now.toISOString());
        setLastUpdate(now.toISOString());
        setSelectedWeek(new Date(today));
        console.log('StudentWeeklyCalendar: Daily update completed');
      }
    };

    checkUpdate();
    const interval = setInterval(checkUpdate, 60 * 1000);
    return () => clearInterval(interval);
  }, [weeklyVotes, lastUpdate, isLoading, user, authLoading]);

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
      dinner: [],
      others: [...DEFAULT_OTHERS_OPTIONS] // Always include DEFAULT_OTHERS_OPTIONS
    };
  };

  const getFoodItemImage = (name: string, categoryItems: FoodItem[]): string | undefined => {
    const item = categoryItems.find((item) => item.name === name);
    return item?.image;
  };

  const handleVoteForDay = (dateKey: string) => {
    setVotingDay(dateKey);
    setSelectedItems({
      breakfast: weeklyVotes[dateKey]?.breakfast || [],
      lunch: weeklyVotes[dateKey]?.lunch || [],
      snacks: weeklyVotes[dateKey]?.snacks || [],
      dinner: weeklyVotes[dateKey]?.dinner || [],
      others: weeklyVotes[dateKey]?.others || []
    });
    const dayMenu = getDayMenu(new Date(dateKey));
    const hasNoFoodItems = ['breakfast', 'lunch', 'snacks', 'dinner'].every(
      category => dayMenu[category as keyof DayMenu].length === 0
    );
    setShowOnlyOthers(hasNoFoodItems);
    setIsVoteDialogOpen(true);
    console.log(`StudentWeeklyCalendar: Opened vote dialog for ${dateKey}, initial selections:`, selectedItems);
  };

  const handleItemSelect = (category: keyof VoteSelection, itemName: string, checked: boolean) => {
    setSelectedItems(prev => {
      const isFifthOption = itemName === DEFAULT_OTHERS_OPTIONS[4];
      const othersIndex = DEFAULT_OTHERS_OPTIONS.indexOf(itemName);

      if (category === 'others') {
        if (isFifthOption) {
          if (checked) {
            console.log(`StudentWeeklyCalendar: Selected outing option, clearing other selections`);
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
            console.log(`StudentWeeklyCalendar: Selected absence for ${categoryToClear}, clearing ${categoryToClear} votes`);
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
          console.log(`StudentWeeklyCalendar: Added vote for ${category}: ${itemName}`);
          return {
            ...prev,
            [category]: updatedCategory,
            others: prev.others.filter(opt => opt !== DEFAULT_OTHERS_OPTIONS[4] && opt !== correspondingOthersOption)
          };
        } else {
          const updatedCategory = prev[category].filter(name => name !== itemName);
          console.log(`StudentWeeklyCalendar: Removed vote for ${category}: ${itemName}`);
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
      console.error('StudentWeeklyCalendar: No user or email, cannot submit vote');
      return;
    }

    try {
      const normalizedEmail = user.email.toLowerCase();
      const studentRef = doc(db, 'students', normalizedEmail);
      const studentDoc = await getDoc(studentRef);
      if (!studentDoc.exists()) {
        await setDoc(studentRef, { email: normalizedEmail });
        console.log(`StudentWeeklyCalendar: Created student document for ${normalizedEmail}`);
      }

      const votesRef = collection(db, `weekly_menus/${votingDay}/votes`);
      const q = query(votesRef, where('studentId', '==', normalizedEmail));
      const existingVotesSnapshot = await getDocs(q);

      console.log(`StudentWeeklyCalendar: Existing votes for ${votingDay}, user: ${normalizedEmail}`, existingVotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const deletePromises = existingVotesSnapshot.docs.map(doc => {
        console.log(`StudentWeeklyCalendar: Deleting existing vote: ID=${doc.id}, Data=`, doc.data());
        return deleteDoc(doc.ref);
      });
      await Promise.all(deletePromises);
      console.log(`StudentWeeklyCalendar: Deleted ${deletePromises.length} existing votes for ${votingDay}`);

      const addPromises: Promise<any>[] = [];
      for (const category of ['breakfast', 'lunch', 'snacks', 'dinner', 'others'] as const) {
        for (const itemName of selectedItems[category]) {
          addPromises.push(
            addDoc(votesRef, {
              studentId: normalizedEmail,
              category,
              itemName,
              timestamp: new Date()
            }).then(docRef => {
              console.log(`StudentWeeklyCalendar: Added vote: ${category} - ${itemName}, Doc ID: ${docRef.id}`);
            })
          );
        }
      }
      await Promise.all(addPromises);

      if (
        selectedItems.breakfast.length === 0 &&
        selectedItems.lunch.length === 0 &&
        selectedItems.snacks.length === 0 &&
        selectedItems.dinner.length === 0 &&
        selectedItems.others.length === 0
      ) {
        setWeeklyVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[votingDay];
          console.log(`StudentWeeklyCalendar: Removed votes for ${votingDay} from state (no selections)`);
          return newVotes;
        });
      } else {
        setWeeklyVotes(prev => ({
          ...prev,
          [votingDay]: { ...selectedItems }
        }));
        console.log(`StudentWeeklyCalendar: Updated votes for ${votingDay} in state:`, selectedItems);
      }

      setIsVoteDialogOpen(false);
      setVotingDay('');
      setSelectedItems({ breakfast: [], lunch: [], snacks: [], dinner: [], others: [] });
      setShowOnlyOthers(false);
      toast({
        title: "Vote submitted successfully!",
        description: `You updated your vote for ${votingDay}.`,
      });
    } catch (error) {
      console.error('StudentWeeklyCalendar: Error saving votes to Firebase:', error);
      toast({
        title: "Error saving votes",
        description: "Failed to save your votes. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getFilteredItems = (category: keyof DayMenu, dateKey: string) => {
    const dayMenu = getDayMenu(new Date(dateKey));
    if (category === 'others') {
      // Always return DEFAULT_OTHERS_OPTIONS for the 'others' category
      return DEFAULT_OTHERS_OPTIONS.map(option => ({
        id: option,
        name: option,
        category: 'others'
      }));
    }
    const categoryItems = foodItems.filter((item: FoodItem) =>
      Array.isArray(item.category)
        ? item.category.map(c => c.toLowerCase()).includes(category)
        : item.category.toLowerCase() === category
    );
    return categoryItems.filter((item: FoodItem) => dayMenu[category].includes(item.name));
  };

  const isItemVoted = (dateKey: string, category: keyof VoteSelection, itemName: string) => {
    return weeklyVotes[dateKey]?.[category]?.includes(itemName) || false;
  };

  const hasVoted = (dateKey: string) => {
    const votes = weeklyVotes[dateKey];
    return votes && (
      votes.breakfast.length > 0 ||
      votes.lunch.length > 0 ||
      votes.snacks.length > 0 ||
      votes.dinner.length > 0 ||
      votes.others.length > 0
    );
  };

  if (authLoading || isLoading || isVotesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-gray-600">Loading weekly menu and votes...</div>
        </div>
      </div>
    );
  }

  if (!user || user.displayName !== 'student') {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-red-600">
            {user ? 'Access restricted to students only.' : 'Please log in as a student to view the menu.'}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(selectedWeek);

  return (
    <div className="space-y-6 px-2">
      <style>
        {`
          @keyframes bulge {
            0% {
              transform: scale(1) translateY(0);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
            }
            50% {
              transform: scale(1.05) translateY(-2px);
              box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35), inset 0 -3px 5px rgba(0, 0, 0, 0.25), inset 0 3px 5px rgba(255, 255, 255, 0.5);
            }
            100% {
              transform: scale(1) translateY(0);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
            }
          }
          .food-card:hover {
            animation: bulge 0.3s ease-in-out;
          }
          .tick-wrapper {
            filter: none !important;
            color: #16a34a;
          }
          @media (max-width: ${MOBILE_BREAKPOINT}px) {
            .mobile-content {
              padding-bottom: 80px;
              min-height: calc(100vh - 80px);
              width: 100%;
              box-sizing: border-box;
            }
            .calendar-container {
              width: 100%;
              margin-left: 0.5rem;
              margin-right: 0.5rem;
            }
            .calendar-heading {
              font-size: 18px;
              font-weight: 700;
              color: #15803d;
            }
            .daily-card {
              width: 100%;
              max-width: 95vw;
              padding: 0.5rem 0;
              margin: 0.5rem auto;
              background-image: linear-gradient(to bottom, #ffffff, #f5f5f5);
              border-radius: 0.5rem;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
              transform: translateZ(10px);
              transition: all 0.3s ease;
            }
            .daily-card.today-card {
              position: relative;
              border: none !important;
              box-shadow: 0 4px 8px rgba(248, 113, 113, 0.3), 0 6px 12px rgba(248, 113, 113, 0.25), inset 0 0 0 4px #f87171, inset 0 2px 4px rgba(0, 0, 0, 0.15);
            }
            .daily-card:hover {
              transform: translateZ(15px) scale(1.02);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
              background-image: linear-gradient(to bottom, #f5f5f5, #e0e0e0);
            }
            .daily-card.today-card:hover {
              box-shadow: 0 8px 16px rgba(248, 113, 113, 0.35), 0 10px 20px rgba(248, 113, 113, 0.3), inset 0 0 0 4px #f87171, inset 0 2px 4px rgba(0, 0, 0, 0.15);
            }
            .others-options {
              display: grid;
              grid-template-columns: 1fr;
              gap: 0.25rem;
              width: 100%;
            }
            .others-options > div {
              width: 100%;
              padding: 0.125rem 0;
            }
            .meal-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.5rem;
              padding: 0;
            }
            .meal-item {
              width: 100%;
              padding: 0.125rem 0;
              margin-bottom: 0.125rem;
              background-image: linear-gradient(to bottom, var(--meal-bg-from), var(--meal-bg-to));
              border-radius: 0.25rem;
              box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
            }
            .meal-item.breakfast {
              --meal-bg-from: #fefcbf;
              --meal-bg-to: #fef08a;
            }
            .meal-item.lunch {
              --meal-bg-from: #d1fae5;
              --meal-bg-to: #a7f3d0;
            }
            .meal-item.snacks {
              --meal-bg-from: #ede9fe;
              --meal-bg-to: #ddd6fe;
            }
            .meal-item.dinner {
              --meal-bg-from: #bfdbfe;
              --meal-bg-to: #93c5fd;
            }
            .others-item {
              background-image: linear-gradient(to bottom, #F5F5DC, #E8E8C9);
              border-radius: 0.25rem;
              box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
              padding: 0.125rem 0;
            }
            .vote-count {
              background-image: linear-gradient(to bottom, #fed7aa, #fdba74);
              border-radius: 0.125rem;
              box-shadow: 0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 0.5px 1px -1px rgba(0, 0, 0, 0.06);
              padding: 0.1rem 0.2rem;
              font-size: 0.5rem;
              font-weight: 700;
              color: #1f2937;
              display: inline-flex;
              align-items: center;
              margin-left: 0.2rem;
            }
            .vote-button {
              background-image: linear-gradient(to bottom, #fed7aa, #fdba74);
              color: #ea580c;
              border-radius: 0.25rem;
              box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
              font-size: 0.6rem;
              padding: 0.1rem 0.25rem;
            }
            .edit-button {
              background-image: linear-gradient(to bottom, #fed7aa, #fdba74);
              color: #000000;
              font-weight: 700;
              border-radius: 0.25rem;
              box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
              font-size: 0.6rem;
              padding: 0.075rem 0.2rem;
              height: 1.5rem;
              min-height: 1.5rem;
              line-height: 1;
            }
            .meal-item-text {
              font-size: 0.6rem;
            }
            .others-item-text {
              font-size: 0.6rem;
            }
            .flex.flex-col.gap-3 {
              gap: 0.15rem;
            }
            .category-card {
              background-image: linear-gradient(to bottom, #ffffff, #f5f5f5);
              border-radius: 0.5rem;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
              transform: translateZ(10px);
              transition: all 0.3s ease;
              padding: 0.5rem;
            }
            .category-card:hover {
              transform: translateZ(15px) scale(1.02);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
              background-image: linear-gradient(to bottom, #f5f5f5, #e0e0e0);
            }
            .checkbox-container {
              background-color: #e5e7eb;
              border-radius: 0.25rem;
              box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
              padding: 0.5rem;
              transition: all 0.3s ease;
 five);
            }
            .checkbox-container:hover {
              background-color: #d1d5db;
              box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -3px 6px rgba(0, 0, 0, 0.15);
            }
          }
          @media (min-width: ${MOBILE_BREAKPOINT + 1}px) {
            .calendar-container {
              width: 100%;
              max-width: 1600px;
              margin-left: auto;
              margin-right: auto;
            }
            .calendar-heading {
              font-size: 20px;
              font-weight: 700;
              color: #15803d;
            }
            .daily-card {
              width: 100%;
              max-width: 1600px;
              padding: 1.5rem;
              margin: 1rem auto;
              background-image: linear-gradient(to bottom, #ffffff, #f5f5f5);
              border-radius: 0.75rem;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 12px 24px rgba(0, 0, 0, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
              transform: translateZ(20px);
              transition: all 0.3s ease;
            }
            .daily-card.today-card {
              position: relative;
              border: none !important;
              box-shadow: 0 8px 16px rgba(248, 113, 113, 0.3), 0 12px 24px rgba(248, 113, 113, 0.25), inset 0 0 0 6px #f87171, inset 0 2px 4px rgba(0, 0, 0, 0.15);
            }
            .daily-card:hover {
              transform: translateZ(30px) scale(1.03);
              box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25), 0 16px 32px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
              background-image: linear-gradient(to bottom, #f5f5f5, #e0e0e0);
            }
            .daily-card.today-card:hover {
              box-shadow: 0 12px 24px rgba(248, 113, 113, 0.35), 0 16px 32px rgba(248, 113, 113, 0.3), inset 0 0 0 6px #f87171, inset 0 2px 4px rgba(0, 0, 0, 0.15);
            }
            .others-options {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 0.25rem;
              width: 100%;
            }
            .others-options > div {
              width: 100%;
              padding: 0.5rem;
            }
            .meal-grid {
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 0.5rem;
              padding: 0 1.5rem;
            }
            .meal-item {
              padding: 0.5rem;
              width: 100%;
              max-width: 80%;
              min-width: 250px;
              margin-bottom: 0.5rem;
              margin-left: auto;
              margin-right: auto;
              background-image: linear-gradient(to bottom, var(--meal-bg-from), var(--meal-bg-to));
              border-radius: 0.5rem;
              box-shadow: 0 6px 10px -2px rgba(0, 0, 0, 0.1), 0 3px 5px -1px rgba(0, 0, 0, 0.05);
              transition: all 0.3s;
            }
            .meal-item:hover {
              background-image: linear-gradient(to bottom, var(--meal-bg-hover-from), var(--meal-bg-hover-to));
              box-shadow: 0 15px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 8px -3px rgba(0, 0, 0, 0.04);
              transform: translateY(-0.3rem) translateZ(3rem) skewY(1deg);
            }
            .meal-item.breakfast {
              --meal-bg-from: #fefcbf;
              --meal-bg-to: #fef08a;
              --meal-bg-hover-from: #fef08a;
              --meal-bg-hover-to: #fef9c3;
            }
            .meal-item.lunch {
              --meal-bg-from: #d1fae5;
              --meal-bg-to: #a7f3d0;
              --meal-bg-hover-from: #a7f3d0;
              --meal-bg-hover-to: #6ee7b7;
            }
            .meal-item.snacks {
              --meal-bg-from: #ede9fe;
              --meal-bg-to: #ddd6fe;
              --meal-bg-hover-from: #ddd6fe;
              --meal-bg-hover-to: #c4b5fd;
            }
            .meal-item.dinner {
              --meal-bg-from: #bfdbfe;
              --meal-bg-to: #93c5fd;
              --meal-bg-hover-from: #93c5fd;
              --meal-bg-hover-to: #60a5fa;
            }
            .others-item {
              background-image: linear-gradient(to bottom, #F5F5DC, #E8E8C9);
              border-radius: 0.5rem;
              box-shadow: 0 6px 10px -2px rgba(0, 0, 0, 0.1), 0 3px 5px -1px rgba(0, 0, 0, 0.05);
              transition: all 0.3s;
              padding: 0.5rem;
            }
            .others-item:hover {
              background-image: linear-gradient(to bottom, #E8E8C9, #DBDBC4);
              box-shadow: 0 15px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 8px -3px rgba(0, 0, 0, 0.04);
              transform: translateY(-0.3rem) translateZ(3rem) skewY(1deg);
            }
            .vote-count {
              background-image: linear-gradient(to bottom, #fed7aa, #fdba74);
              border-radius: 0.25rem;
              box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
              padding: 0.125rem 0.25rem;
              font-size: 0.625rem;
              font-weight: 700;
              color: #1f2937;
              display: inline-flex;
              align-items: center;
              margin-left: 0.25rem;
              transition: all 0.3s;
            }
            .vote-count:hover {
              background-image: linear-gradient(to bottom, #fdba74, #fb923c);
              box-shadow: 0 8px 12px -3px rgba(0, 0, 0, 0.1), 0 3px 5px -1px rgba(0, 0, 0, 0.05);
              transform: translateY(-0.2rem) translateZ(1.5rem);
            }
            .vote-button {
              background-image: linear-gradient(to bottom, #fed7aa, #fdba74);
              color: #ea580c;
              border-radius: 0.5rem;
              box-shadow: 0 6px 10px -2px rgba(0, 0, 0, 0.1), 0 3px 5px -1px rgba(0, 0, 0, 0.05);
              font-size: 0.75rem;
              padding: 0.25rem 0.5rem;
              transition: all 0.3s;
            }
            .vote-button:hover {
              background-image: linear-gradient(to bottom, #fdba74, #fb923c);
              transform: scale(1.1) translateY(-0.3rem) translateZ(3rem) skewY(1deg);
              box-shadow: 0 15px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 8px -3px rgba(0, 0, 0, 0.04);
            }
            .edit-button {
              background-image: linear-gradient(to bottom, #fed7aa, #fdba74);
              color: #000000;
              font-weight: 700;
              border-radius: 0.5rem;
              box-shadow: 0 6px 10px -2px rgba(0, 0, 0, 0.1), 0 3px 5px -1px rgba(0, 0, 0, 0.05);
              font-size: 0.75rem;
              padding: 0.25rem 0.5rem;
              transition: all 0.3s;
            }
            .edit-button:hover {
              background-image: linear-gradient(to bottom, #fdba74, #fb923c);
              transform: scale(1.1) translateY(-0.3rem) translateZ(3rem) skewY(1deg);
              box-shadow: 0 15px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 8px -3px rgba(0, 0, 0, 0.04);
            }
            .flex.flex-col.gap-3 {
              gap: 0.1rem;
            }
            .meal-item-text {
              font-size: 0.75rem;
            }
            .others-item-text {
              font-size: 0.75rem;
            }
            .category-card {
              background-image: linear-gradient(to bottom, #ffffff, #f5f5f5);
              border-radius: 0.75rem;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 12px 24px rgba(0, 0, 0, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
              transform: translateZ(20px);
              transition: all 0.3s ease;
              padding: 1rem;
            }
            .category-card:hover {
              transform: translateZ(30px) scale(1.03);
              box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25), 0 16px 32px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
              background-image: linear-gradient(to bottom, #f5f5f5, #e0e0e0);
            }
            .checkbox-container {
              background-color: #e5e7eb;
              border-radius: 0.5rem;
              box-shadow: inset 0 4px 6px rgba(0, 0, 0, 0.15), inset 0 -4px 6px rgba(0, 0, 0, 0.15);
              padding: 0.75rem;
              transition: all 0.3s ease;
            }
            .checkbox-container:hover {
              background-color: #d1d5db;
              box-shadow: inset 0 6px 8px rgba(0, 0, 0, 0.2), inset 0 -6px 8px rgba(0, 0, 0, 0.2);
            }
          }
        `}
      </style>
      <div className="calendar-container">
        <div className="flex justify-between items-center px-4">
          <h2 className="calendar-heading">Weekly Food Calendar</h2>
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
            const dateKey = date.toDateString();
            const dayMenu = getDayMenu(date);
            const isEmpty = Object.values(dayMenu).every(meal => meal.length === 0 && meal !== dayMenu.others);

            return (
              <Card key={index} className={`daily-card ${isToday ? 'today-card' : ''} ${hasVoted(dateKey) ? '!bg-gray-100' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center px-4">
                    <div>
                      <CardTitle className={`text-xl ${isToday ? 'text-orange-700' : ''}`}>
                        {dayName}
                      </CardTitle>
                      <CardDescription>
                        {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {isToday && <span className="ml-2 text-orange-600 font-medium">(Today)</span>}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      {hasVoted(dateKey) && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-800 hover:text-white flex items-center gap-1 transition-colors duration-200">
                          <CheckCircle className="h-4 w-4" />
                          Voted
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVoteForDay(dateKey)}
                        className="edit-button"
                      >
                        {hasVoted(dateKey) ? 'Edit Vote' : 'Vote'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEmpty ? (
                    <div className="text-center py-8 text-gray-500">
                      There is no food planned yet for this day
                    </div>
                  ) : (
                    <>
                      <div className="meal-grid grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-extrabold text-sm text-gray-700 px-4">Breakfast</h4>
                          <div className="flex flex-col gap-3 overflow-visible">
                            {dayMenu.breakfast.length > 0 ? (
                              [...dayMenu.breakfast]
                                .sort((a, b) => a.localeCompare(b))
                                .map((item: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`meal-item breakfast flex flex-col items-start gap-2`}
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      {getFoodItemImage(item, getFilteredItems('breakfast', dateKey)) ? (
                                        <img
                                          src={getFoodItemImage(item, getFilteredItems('breakfast', dateKey))}
                                          alt={item}
                                          className={`w-8 h-8 object-cover rounded ${isItemVoted(dateKey, 'breakfast', item) ? 'filter grayscale' : ''}`}
                                        />
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                          No Image
                                        </div>
                                      )}
                                      <span className="flex-1 meal-item-text">{item}</span>
                                      {isItemVoted(dateKey, 'breakfast', item) && (
                                        <div className="tick-wrapper">
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="meal-item breakfast text-sm text-gray-600 p-3">
                                No items selected
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-extrabold text-sm text-gray-700 px-4">Lunch</h4>
                          <div className="flex flex-col gap-3 overflow-visible">
                            {dayMenu.lunch.length > 0 ? (
                              [...dayMenu.lunch]
                                .sort((a, b) => a.localeCompare(b))
                                .map((item: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`meal-item lunch flex flex-col items-start gap-2`}
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      {getFoodItemImage(item, getFilteredItems('lunch', dateKey)) ? (
                                        <img
                                          src={getFoodItemImage(item, getFilteredItems('lunch', dateKey))}
                                          alt={item}
                                          className={`w-8 h-8 object-cover rounded ${isItemVoted(dateKey, 'lunch', item) ? 'filter grayscale' : ''}`}
                                        />
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                          No Image
                                        </div>
                                      )}
                                      <span className="flex-1 meal-item-text">{item}</span>
                                      {isItemVoted(dateKey, 'lunch', item) && (
                                        <div className="tick-wrapper">
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="meal-item lunch text-sm text-gray-600 p-3">
                                No items selected
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-extrabold text-sm text-gray-700 px-4">Snacks</h4>
                          <div className="flex flex-col gap-3 overflow-visible">
                            {dayMenu.snacks.length > 0 ? (
                              [...dayMenu.snacks]
                                .sort((a, b) => a.localeCompare(b))
                                .map((item: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`meal-item snacks flex flex-col items-start gap-2`}
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      {getFoodItemImage(item, getFilteredItems('snacks', dateKey)) ? (
                                        <img
                                          src={getFoodItemImage(item, getFilteredItems('snacks', dateKey))}
                                          alt={item}
                                          className={`w-8 h-8 object-cover rounded ${isItemVoted(dateKey, 'snacks', item) ? 'filter grayscale' : ''}`}
                                        />
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                          No Image
                                        </div>
                                      )}
                                      <span className="flex-1 meal-item-text">{item}</span>
                                      {isItemVoted(dateKey, 'snacks', item) && (
                                        <div className="tick-wrapper">
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="meal-item snacks text-sm text-gray-600 p-3">
                                No items selected
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-extrabold text-sm text-gray-700 px-4">Dinner</h4>
                          <div className="flex flex-col gap-3 overflow-visible">
                            {dayMenu.dinner.length > 0 ? (
                              [...dayMenu.dinner]
                                .sort((a, b) => a.localeCompare(b))
                                .map((item: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`meal-item dinner flex flex-col items-start gap-2`}
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      {getFoodItemImage(item, getFilteredItems('dinner', dateKey)) ? (
                                        <img
                                          src={getFoodItemImage(item, getFilteredItems('dinner', dateKey))}
                                          alt={item}
                                          className={`w-8 h-8 object-cover rounded ${isItemVoted(dateKey, 'dinner', item) ? 'filter grayscale' : ''}`}
                                        />
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                          No Image
                                        </div>
                                      )}
                                      <span className="flex-1 meal-item-text">{item}</span>
                                      {isItemVoted(dateKey, 'dinner', item) && (
                                        <div className="tick-wrapper">
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="meal-item dinner text-sm text-gray-600 p-3">
                                No items selected
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <h4 className="font-extrabold text-sm text-gray-700 px-4">Others</h4>
                        <div className="flex flex-col gap-3">
                          {dayMenu.others.length > 0 ? (
                            <div className="others-options">
                              {dayMenu.others
                                .sort((a, b) => a.localeCompare(b))
                                .map((item: string, index: number) => (
                                  <div
                                    key={index}
                                    className="others-item"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      <span className="flex-1 others-item-text">{item}</span>
                                      {isItemVoted(dateKey, 'others', item) && (
                                        <div className="tick-wrapper">
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="others-item text-sm text-gray-600">
                              No items available
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={isVoteDialogOpen} onOpenChange={setIsVoteDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vote for {votingDay}</DialogTitle>
            <DialogDescription>Select the food items you want to vote for.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {!showOnlyOthers && (
              <>
                <div className="category-card">
                  <h4 className="font-semibold text-gray-700">Breakfast</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 checkbox-container">
                    {getFilteredItems('breakfast', votingDay).map((item: FoodItem) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`breakfast-${item.id}`}
                          checked={selectedItems.breakfast.includes(item.name)}
                          onCheckedChange={(checked) => handleItemSelect('breakfast', item.name, checked as boolean)}
                        />
                        <label
                          htmlFor={`breakfast-${item.id}`}
                          className="text-sm text-gray-600 cursor-pointer truncate"
                        >
                          {item.name}
                        </label>
                      </div>
                    ))}
                    {getFilteredItems('breakfast', votingDay).length === 0 && (
                      <div className="col-span-2 text-sm text-gray-500">No breakfast items available</div>
                    )}
                  </div>
                </div>
                <div className="category-card">
                  <h4 className="font-semibold text-gray-700">Lunch</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 checkbox-container">
                    {getFilteredItems('lunch', votingDay).map((item: FoodItem) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lunch-${item.id}`}
                          checked={selectedItems.lunch.includes(item.name)}
                          onCheckedChange={(checked) => handleItemSelect('lunch', item.name, checked as boolean)}
                        />
                        <label
                          htmlFor={`lunch-${item.id}`}
                          className="text-sm text-gray-600 cursor-pointer truncate"
                        >
                          {item.name}
                        </label>
                      </div>
                    ))}
                    {getFilteredItems('lunch', votingDay).length === 0 && (
                      <div className="col-span-2 text-sm text-gray-500">No lunch items available</div>
                    )}
                  </div>
                </div>
                <div className="category-card">
                  <h4 className="font-semibold text-gray-700">Snacks</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 checkbox-container">
                    {getFilteredItems('snacks', votingDay).map((item: FoodItem) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`snacks-${item.id}`}
                          checked={selectedItems.snacks.includes(item.name)}
                          onCheckedChange={(checked) => handleItemSelect('snacks', item.name, checked as boolean)}
                        />
                        <label
                          htmlFor={`snacks-${item.id}`}
                          className="text-sm text-gray-600 cursor-pointer truncate"
                        >
                          {item.name}
                        </label>
                      </div>
                    ))}
                    {getFilteredItems('snacks', votingDay).length === 0 && (
                      <div className="col-span-2 text-sm text-gray-500">No snack items available</div>
                    )}
                  </div>
                </div>
                <div className="category-card">
                  <h4 className="font-semibold text-gray-700">Dinner</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4 checkbox-container">
                    {getFilteredItems('dinner', votingDay).map((item: FoodItem) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dinner-${item.id}`}
                          checked={selectedItems.dinner.includes(item.name)}
                          onCheckedChange={(checked) => handleItemSelect('dinner', item.name, checked as boolean)}
                        />
                        <label
                          htmlFor={`dinner-${item.id}`}
                          className="text-sm text-gray-600 cursor-pointer truncate"
                        >
                          {item.name}
                        </label>
                      </div>
                    ))}
                    {getFilteredItems('dinner', votingDay).length === 0 && (
                      <div className="col-span-2 text-sm text-gray-500">No dinner items available</div>
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="category-card">
              <h4 className="font-semibold text-gray-700">Others</h4>
              <div className="mt-2 grid grid-cols-1 gap-4 checkbox-container">
                {getFilteredItems('others', votingDay).map((item: FoodItem, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`others-${index}`}
                      checked={selectedItems.others.includes(item.name)}
                      onCheckedChange={(checked) => handleItemSelect('others', item.name, checked as boolean)}
                    />
                    <label
                      htmlFor={`others-${index}`}
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      {item.name}
                    </label>
                  </div>
                ))}
                {getFilteredItems('others', votingDay).length === 0 && (
                  <div className="text-sm text-gray-500">No other options available</div>
                )}
              </div>
            </div>
            <Button
              onClick={handleSubmitVote}
              className="w-full bg-gradient-to-b from-orange-100 to-orange-200 text-orange-600 hover:from-orange-300 hover:to-orange-400 hover:scale-115 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-xl transform hover:-translate-y-2 hover:translate-z-20 hover:skew-y-1"
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

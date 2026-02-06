import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useFoodContext } from '@/contexts/FoodContext';
import { db } from '@/integrations/firebase/client';
import { collection, getCountFromServer, addDoc, query, where, onSnapshot, FirestoreError, deleteDoc, getDocs, getDoc, doc } from 'firebase/firestore';

interface WeeklyCalendarProps {
  isStudentPortal?: boolean;
}

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
  breakfast: Array<{ item: string; count: number }>;
  lunch: Array<{ item: string; count: number }>;
  snacks: Array<{ item: string; count: number }>;
  dinner: Array<{ item: string; count: number }>;
  others: Array<{ item: string; count: number }>;
}

const DEFAULT_OTHERS_OPTIONS = [
  "I didn't come to the hostel mess for breakfast today.",
  "I didn't come to the hostel mess for lunch today.",
  "I didn't come to the hostel mess for snacks today.",
  "I didn't come to the hostel mess for dinner today.",
  "I was on an outing, so I didn't come to eat at the hostel mess today."
];

const MOBILE_BREAKPOINT = 768;

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ isStudentPortal = false }) => {
  const { foodItems } = useFoodContext();
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingDay, setEditingDay] = useState<string>('');
  const [weeklyMenus, setWeeklyMenus] = useState<Record<string, DayMenu>>({});
  const [weeklyVotes, setWeeklyVotes] = useState<Record<string, VoteSelection>>({});
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [userId] = useState<string>('student123');
  const [error, setError] = useState<string | null>(null);
  const [dialogTitle, setDialogTitle] = useState<string>('');

  const isLocalStorageAvailable = (): boolean => {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.error('localStorage is not available:', e);
      return false;
    }
  };

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

  const cleanupInvalidVotes = async (weekDates: Date[]) => {
    try {
      const studentsRef = collection(db, 'students');
      const studentSnapshot = await getDocs(studentsRef);
      const validStudentIds = new Set(studentSnapshot.docs.map(doc => doc.id));
      console.log('Valid student IDs in Firestore:', Array.from(validStudentIds));
      for (const date of weekDates) {
        const dateKey = date.toDateString();
        const votesRef = collection(db, `weekly_menus/${dateKey}/votes`);
        const querySnapshot = await getDocs(votesRef);
        const deletePromises: Promise<void>[] = [];
        querySnapshot.forEach(voteDoc => {
          const voteData = voteDoc.data();
          const studentId = voteData.studentId;
          if (studentId && !validStudentIds.has(studentId)) {
            console.log(`Deleting invalid vote for studentId: ${studentId}, date: ${dateKey}, vote:`, voteData);
            deletePromises.push(deleteDoc(voteDoc.ref));
          }
        });
        if (deletePromises.length > 0) {
          await Promise.all(deletePromises);
          console.log(`Cleaned up ${deletePromises.length} invalid votes for ${dateKey}`);
        } else {
          console.log(`No invalid votes found for ${dateKey}`);
        }
      }
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error('Error cleaning up invalid votes:', firestoreError.message);
      setError('Failed to clean up invalid votes. Please try again later.');
    }
  };

  useEffect(() => {
    const fetchTotalStudentsAndCleanup = async () => {
      try {
        const studentsRef = collection(db, 'students');
        const snapshot = await getCountFromServer(studentsRef);
        const studentCount = snapshot.data().count;
        setTotalStudents(studentCount);
        console.log('Total students in Firestore:', studentCount);
        const weekDates = getWeekDates(selectedWeek);
        await cleanupInvalidVotes(weekDates);
      } catch (error) {
        const firestoreError = error as FirestoreError;
        console.error('Error fetching total students or cleaning votes:', firestoreError.message);
        setError('Failed to load student count or clean votes. Please try again later.');
        setTotalStudents(0);
      }
    };
    fetchTotalStudentsAndCleanup();
  }, [selectedWeek]);

  useEffect(() => {
    const weekDates = getWeekDates(selectedWeek);
    const unsubscribeFunctions: Array<() => void> = [];
    weekDates.forEach(date => {
      const dateKey = date.toDateString();
      const votesRef = collection(db, `weekly_menus/${dateKey}/votes`);
      const unsubscribe = onSnapshot(
        votesRef,
        async (snapshot) => {
          const studentsRef = collection(db, 'students');
          const studentSnapshot = await getDocs(studentsRef);
          const validStudentIds = new Set(studentSnapshot.docs.map(doc => doc.id));
          const voteCounts: Record<string, Record<string, number>> = {
            breakfast: {},
            lunch: {},
            snacks: {},
            dinner: {},
            others: {}
          };
          snapshot.forEach(doc => {
            const data = doc.data();
            const category = data.category as string;
            const itemName = data.itemName as string;
            const studentId = data.studentId as string;
            if (category && itemName && studentId && validStudentIds.has(studentId)) {
              voteCounts[category][itemName] = (voteCounts[category][itemName] || 0) + 1;
            }
          });
          console.log(`Votes for ${dateKey}:`, voteCounts);
          setWeeklyVotes(prev => ({
            ...prev,
            [dateKey]: {
              breakfast: Object.entries(voteCounts.breakfast).map(([item, count]) => ({ item, count })),
              lunch: Object.entries(voteCounts.lunch).map(([item, count]) => ({ item, count })),
              snacks: Object.entries(voteCounts.snacks).map(([item, count]) => ({ item, count })),
              dinner: Object.entries(voteCounts.dinner).map(([item, count]) => ({ item, count })),
              others: Object.entries(voteCounts.others).map(([item, count]) => ({ item, count }))
            }
          }));
        },
        (error) => {
          console.error(`Error listening to votes for ${dateKey}:`, error);
          setError('Failed to load votes. Please try again later.');
        }
      );
      unsubscribeFunctions.push(unsubscribe);
    });
    return () => unsubscribeFunctions.forEach(unsub => unsub());
  }, [selectedWeek]);

  useEffect(() => {
    setIsLoading(true);
    if (!isLocalStorageAvailable()) {
      setWeeklyMenus({});
      setIsLoading(false);
      return;
    }
    try {
      const savedMenus = localStorage.getItem('weekly_menus');
      if (savedMenus && savedMenus !== 'undefined' && savedMenus !== 'null') {
        const parsedMenus = JSON.parse(savedMenus);
        if (isValidMenuData(parsedMenus)) {
          setWeeklyMenus(parsedMenus);
        } else {
          if (!isStudentPortal) {
            initializeEmptyMenus();
          } else {
            setWeeklyMenus({});
          }
        }
      } else {
        if (!isStudentPortal) {
          initializeEmptyMenus();
        } else {
          setWeeklyMenus({});
        }
      }
      const savedLastUpdate = localStorage.getItem('last_calendar_update');
      if (savedLastUpdate && savedLastUpdate !== 'null') {
        setLastUpdate(savedLastUpdate);
      }
    } catch (error) {
      console.error('Error parsing data from localStorage:', error);
      if (!isStudentPortal) {
        initializeEmptyMenus();
      } else {
        setWeeklyMenus({});
      }
    } finally {
      setIsLoading(false);
    }
  }, [isStudentPortal]);

  const initializeEmptyMenus = () => {
    if (isStudentPortal) {
      return;
    }
    const today = new Date();
    const initialMenus: Record<string, DayMenu> = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateKey = date.toDateString();
      initialMenus[dateKey] = {
        breakfast: [],
        lunch: [],
        snacks: [],
        dinner: [],
        others: [...DEFAULT_OTHERS_OPTIONS]
      };
    }
    const updatedMenus = { ...weeklyMenus, ...initialMenus };
    setWeeklyMenus(updatedMenus);
    if (isLocalStorageAvailable()) {
      try {
        localStorage.setItem('weekly_menus', JSON.stringify(updatedMenus));
        localStorage.setItem('last_calendar_update', today.toISOString());
        setLastUpdate(today.toISOString());
      } catch (error) {
        console.error('Error saving initial menus to localStorage:', error);
      }
    }
  };

  useEffect(() => {
    if (isLoading || Object.keys(weeklyMenus).length === 0 || isStudentPortal) {
      return;
    }
    const checkUpdate = () => {
      const now = new Date();
      const today = now.toDateString();
      const lastUpdateDate = lastUpdate ? new Date(lastUpdate).toDateString() : null;
      if (now.getHours() >= 0 && lastUpdateDate !== today) {
        const newMenus = { ...weeklyMenus };
        Object.keys(newMenus).forEach(dateKey => {
          const menuDate = new Date(dateKey);
          if (menuDate < new Date(today)) {
            delete newMenus[dateKey];
          }
        });
        const newDay = new Date(now);
        newDay.setDate(newDay.getDate() + 6);
        const newDayKey = newDay.toDateString();
        if (!newMenus[newDayKey]) {
          newMenus[newDayKey] = {
            breakfast: [],
            lunch: [],
            snacks: [],
            dinner: [],
            others: [...DEFAULT_OTHERS_OPTIONS]
          };
        }
        setWeeklyMenus(newMenus);
        if (isLocalStorageAvailable()) {
          try {
            localStorage.setItem('weekly_menus', JSON.stringify(newMenus));
            localStorage.setItem('last_calendar_update', now.toISOString());
            setLastUpdate(now.toISOString());
            setSelectedWeek(new Date(today));
          } catch (error) {
            console.error('Error saving daily update to localStorage:', error);
          }
        }
      }
    };
    checkUpdate();
    const interval = setInterval(checkUpdate, 60 * 1000);
    return () => clearInterval(interval);
  }, [weeklyMenus, lastUpdate, isLoading, isStudentPortal]);

  const breakfastItems = foodItems
    .filter((item: FoodItem) =>
      Array.isArray(item.category)
        ? item.category.map(c => c.toLowerCase()).includes('breakfast')
        : item.category.toLowerCase() === 'breakfast'
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const lunchItems = foodItems
    .filter((item: FoodItem) =>
      Array.isArray(item.category)
        ? item.category.map(c => c.toLowerCase()).includes('lunch')
        : item.category.toLowerCase() === 'lunch'
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const snackItems = foodItems
    .filter((item: FoodItem) =>
      Array.isArray(item.category)
        ? item.category.map(c => c.toLowerCase()).includes('snacks')
        : item.category.toLowerCase() === 'snacks'
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const dinnerItems = foodItems
    .filter((item: FoodItem) =>
      Array.isArray(item.category)
        ? item.category.map(c => c.toLowerCase()).includes('dinner')
        : item.category.toLowerCase() === 'dinner'
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const [editMenu, setEditMenu] = useState<DayMenu>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: [],
    others: [...DEFAULT_OTHERS_OPTIONS]
  });

  const getWeekDates = (date: Date): Date[] => {
    const week: Date[] = [];
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startDate);
      weekDate.setDate(startDate.getDate() + i);
      week.push(new Date(weekDate));
    }
    return week;
  };

  const handleEditMenu = (date: Date) => {
    if (isStudentPortal) {
      return;
    }
    const dateKey = date.toDateString();
    setEditingDay(dateKey);
    const existingMenu = weeklyMenus[dateKey] || {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
      others: [...DEFAULT_OTHERS_OPTIONS]
    };
    setEditMenu(existingMenu);
    setDialogTitle(hasMenuItems(date) ? 'Edit Menu for the Day' : 'Add Menu for the Day');
    setIsEditDialogOpen(true);
  };

  const handleSaveMenu = () => {
    if (isStudentPortal) {
      return;
    }
    const updatedMenus = {
      ...weeklyMenus,
      [editingDay]: editMenu
    };
    setWeeklyMenus(updatedMenus);
    if (isLocalStorageAvailable()) {
      try {
        localStorage.setItem('weekly_menus', JSON.stringify(updatedMenus));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
    setIsEditDialogOpen(false);
    setEditingDay('');
    setEditMenu({
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
      others: [...DEFAULT_OTHERS_OPTIONS]
    });
  };

  const handleVote = async (dateKey: string, category: keyof DayMenu, itemName: string) => {
    if (!isStudentPortal) {
      return;
    }
    try {
      const studentRef = doc(db, 'students', userId);
      const studentDoc = await getDoc(studentRef);
      if (!studentDoc.exists()) {
        setError('Your account is not active. Cannot vote.');
        return;
      }
      const votesRef = collection(db, `weekly_menus/${dateKey}/votes`);
      const q = query(
        votesRef,
        where('studentId', '==', userId),
        where('category', '==', category)
      );
      const snapshot = await getCountFromServer(q);
      if (snapshot.data().count > 0) {
        setError(`You have already voted for ${category} on ${dateKey}.`);
        return;
      }
      await addDoc(votesRef, {
        studentId: userId,
        category,
        itemName,
        timestamp: new Date()
      });
      console.log(`Vote added: studentId=${userId}, date=${dateKey}, category=${category}, item=${itemName}`);
      setError(null);
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error('Error recording vote:', firestoreError.message);
      setError('Failed to record vote. Please try again later.');
    }
  };

  const getDayMenu = (date: Date): DayMenu => {
    const dateKey = date.toDateString();
    return weeklyMenus[dateKey] || {
      breakfast: [],
      lunch: [],
      snacks: [],
      dinner: [],
      others: [...DEFAULT_OTHERS_OPTIONS]
    };
  };

  const getVoteCount = (dateKey: string, category: keyof DayMenu, itemName: string): number => {
    if (!weeklyVotes[dateKey] || !weeklyVotes[dateKey][category]) return 0;
    const vote = weeklyVotes[dateKey][category].find((v: { item: string; count: number }) => v.item === itemName);
    return vote ? vote.count : 0;
  };

  const handleCheckboxChange = (category: keyof DayMenu, itemName: string, checked: boolean) => {
    try {
      setEditMenu(prev => {
        const currentItems = prev[category];
        let updatedItems: string[];
        if (checked) {
          updatedItems = [...currentItems, itemName];
        } else {
          updatedItems = currentItems.filter(item => item !== itemName);
        }
        return { ...prev, [category]: updatedItems };
      });
    } catch (error) {
      console.error('Error updating menu:', error);
    }
  };

  const getFoodItemImage = (name: string, categoryItems: FoodItem[]): string | undefined => {
    const item = categoryItems.find((item) => item.name === name);
    return item?.image;
  };

  const hasMenuItems = (date: Date): boolean => {
    const dateKey = date.toDateString();
    const dayMenu = getDayMenu(date);
    return (
      dayMenu.breakfast.length > 0 ||
      dayMenu.lunch.length > 0 ||
      dayMenu.snacks.length > 0 ||
      dayMenu.dinner.length > 0
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-gray-600">Loading weekly menu...</div>
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
              color: #c05621;
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
              color: #c05621;
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
            <CalendarIcon className="h-5 w-5 text-orange-600" />
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
            const dateKey = date.toDateString();
            const isEmpty = Object.values(dayMenu).every(meal => meal.length === 0 && meal !== dayMenu.others);
            return (
              <Card key={index} className={`daily-card ${isToday ? 'today-card' : ''}`}>
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
                    {!isStudentPortal && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMenu(date)}
                        className="edit-button"
                      >
                        {hasMenuItems(date) ? 'Edit Menu' : 'Add Menu'}
                      </Button>
                    )}
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
                                    className="meal-item breakfast flex flex-col items-start gap-2"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      {getFoodItemImage(item, breakfastItems) ? (
                                        <img
                                          src={getFoodItemImage(item, breakfastItems)}
                                          alt={item}
                                          className="w-8 h-8 object-cover rounded"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                          No Image
                                        </div>
                                      )}
                                      <span className="flex-1 meal-item-text">{item}</span>
                                      {isStudentPortal && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleVote(dateKey, 'breakfast', item)}
                                          className="vote-button"
                                        >
                                          Vote
                                        </Button>
                                      )}
                                    </div>
                                    <span className="vote-count">
                                      Votes: {getVoteCount(dateKey, 'breakfast', item)}/{totalStudents}
                                    </span>
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
                                    className="meal-item lunch flex flex-col items-start gap-2"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      {getFoodItemImage(item, lunchItems) ? (
                                        <img
                                          src={getFoodItemImage(item, lunchItems)}
                                          alt={item}
                                          className="w-8 h-8 object-cover rounded"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                          No Image
                                        </div>
                                      )}
                                      <span className="flex-1 meal-item-text">{item}</span>
                                      {isStudentPortal && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleVote(dateKey, 'lunch', item)}
                                          className="vote-button"
                                        >
                                          Vote
                                        </Button>
                                      )}
                                    </div>
                                    <span className="vote-count">
                                      Votes: {getVoteCount(dateKey, 'lunch', item)}/{totalStudents}
                                    </span>
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
                                    className="meal-item snacks flex flex-col items-start gap-2"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      {getFoodItemImage(item, snackItems) ? (
                                        <img
                                          src={getFoodItemImage(item, snackItems)}
                                          alt={item}
                                          className="w-8 h-8 object-cover rounded"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                          No Image
                                        </div>
                                      )}
                                      <span className="flex-1 meal-item-text">{item}</span>
                                      {isStudentPortal && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleVote(dateKey, 'snacks', item)}
                                          className="vote-button"
                                        >
                                          Vote
                                        </Button>
                                      )}
                                    </div>
                                    <span className="vote-count">
                                      Votes: {getVoteCount(dateKey, 'snacks', item)}/{totalStudents}
                                    </span>
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
                                    className="meal-item dinner flex flex-col items-start gap-2"
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      {getFoodItemImage(item, dinnerItems) ? (
                                        <img
                                          src={getFoodItemImage(item, dinnerItems)}
                                          alt={item}
                                          className="w-8 h-8 object-cover rounded"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                          No Image
                                        </div>
                                      )}
                                      <span className="flex-1 meal-item-text">{item}</span>
                                      {isStudentPortal && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleVote(dateKey, 'dinner', item)}
                                          className="vote-button"
                                        >
                                          Vote
                                        </Button>
                                      )}
                                    </div>
                                    <span className="vote-count">
                                      Votes: {getVoteCount(dateKey, 'dinner', item)}/{totalStudents}
                                    </span>
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
                              {dayMenu.others.map((option, index) => (
                                <div
                                  key={index}
                                  className="others-item"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <span className="flex-1 others-item-text">{option}</span>
                                    <span className="vote-count">
                                      Votes: {getVoteCount(dateKey, 'others', option)}/{totalStudents}
                                    </span>
                                    {isStudentPortal && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleVote(dateKey, 'others', option)}
                                        className="vote-button"
                                      >
                                        Vote
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="others-item text-sm text-gray-600">
                              No items selected
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
      {!isStudentPortal && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>Select food items for each meal time using checkboxes.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="category-card">
                <Label className="text-gray-700 font-bold">Breakfast</Label>
                <div className="mt-2 grid grid-cols-2 gap-4 checkbox-container">
                  {breakfastItems.map((item: FoodItem) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`breakfast-${item.id}`}
                        checked={editMenu.breakfast.includes(item.name)}
                        onCheckedChange={(checked) => handleCheckboxChange('breakfast', item.name, checked as boolean)}
                      />
                      <label
                        htmlFor={`breakfast-${item.id}`}
                        className="text-sm text-gray-600 cursor-pointer truncate"
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                  {breakfastItems.length === 0 && (
                    <div className="col-span-2 text-sm text-gray-500">No breakfast items available</div>
                  )}
                </div>
              </div>
              <div className="category-card">
                <Label className="text-gray-700 font-bold">Lunch</Label>
                <div className="mt-2 grid grid-cols-2 gap-4 checkbox-container">
                  {lunchItems.map((item: FoodItem) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lunch-${item.id}`}
                        checked={editMenu.lunch.includes(item.name)}
                        onCheckedChange={(checked) => handleCheckboxChange('lunch', item.name, checked as boolean)}
                      />
                      <label
                        htmlFor={`lunch-${item.id}`}
                        className="text-sm text-gray-600 cursor-pointer truncate"
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                  {lunchItems.length === 0 && (
                    <div className="col-span-2 text-sm text-gray-500">No lunch items available</div>
                  )}
                </div>
              </div>
              <div className="category-card">
                <Label className="text-gray-700 font-bold">Snacks</Label>
                <div className="mt-2 grid grid-cols-2 gap-4 checkbox-container">
                  {snackItems.map((item: FoodItem) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`snacks-${item.id}`}
                        checked={editMenu.snacks.includes(item.name)}
                        onCheckedChange={(checked) => handleCheckboxChange('snacks', item.name, checked as boolean)}
                      />
                      <label
                        htmlFor={`snacks-${item.id}`}
                        className="text-sm text-gray-600 cursor-pointer truncate"
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                  {snackItems.length === 0 && (
                    <div className="col-span-2 text-sm text-gray-500">No snack items available</div>
                  )}
                </div>
              </div>
              <div className="category-card">
                <Label className="text-gray-700 font-bold">Dinner</Label>
                <div className="mt-2 grid grid-cols-2 gap-4 checkbox-container">
                  {dinnerItems.map((item: FoodItem) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dinner-${item.id}`}
                        checked={editMenu.dinner.includes(item.name)}
                        onCheckedChange={(checked) => handleCheckboxChange('dinner', item.name, checked as boolean)}
                      />
                      <label
                        htmlFor={`dinner-${item.id}`}
                        className="text-sm text-gray-600 cursor-pointer truncate"
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                  {dinnerItems.length === 0 && (
                    <div className="col-span-2 text-sm text-gray-500">No dinner items available</div>
                  )}
                </div>
              </div>
              <div className="category-card">
                <Label className="text-gray-700 font-bold">Others</Label>
                <div className="mt-2 grid grid-cols-1 gap-4 checkbox-container">
                  {DEFAULT_OTHERS_OPTIONS.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`others-${index}`}
                        checked={editMenu.others.includes(option)}
                        onCheckedChange={(checked) => handleCheckboxChange('others', option, checked as boolean)}
                      />
                      <label
                        htmlFor={`others-${index}`}
                        className="text-sm text-gray-600 cursor-pointer truncate"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleSaveMenu}
                className="w-full bg-gradient-to-b from-orange-100 to-orange-200 text-orange-600 hover:from-orange-300 hover:to-orange-400 hover:scale-115 transition-all duration-300 shadow-2xl hover:shadow-3xl rounded-xl transform hover:-translate-y-2 hover:translate-z-20 hover:skew-y-1"
              >
                Save Menu
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WeeklyCalendar;
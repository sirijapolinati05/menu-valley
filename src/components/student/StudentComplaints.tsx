import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Edit, Trash2 } from 'lucide-react';
import { useFoodContext } from '@/contexts/FoodContext';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Complaint {
  id: string;
  userId: string;
  category: string;
  foodItem: string;
  complaint: string;
  date: string;
  status: 'submitted' | 'reviewed' | 'resolved';
  reply?: string;
}

interface DayMenu {
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
  others: string[];
}

const StudentComplaints = () => {
  const { foodItems } = useFoodContext();
  const { user: authUser } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComplaint, setNewComplaint] = useState({
    category: '',
    foodItem: '',
    complaint: ''
  });
  const [showToast, setShowToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });
  const [todayMenu, setTodayMenu] = useState<DayMenu>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: [],
    others: []
  });
  const [availableFoodItems, setAvailableFoodItems] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [editComplaint, setEditComplaint] = useState({
    category: '',
    foodItem: '',
    complaint: ''
  });
  const midnightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load today's menu from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const savedMenus = localStorage.getItem('weekly_menus');

    if (savedMenus) {
      const weeklyMenus: Record<string, DayMenu> = JSON.parse(savedMenus);
      const menu = weeklyMenus[today] || {
        breakfast: [],
        lunch: [],
        snacks: [],
        dinner: [],
        others: []
      };
      setTodayMenu(menu);
    }
    setIsLoading(false);
  }, [foodItems]);

  // Real-time listener for complaints
  useEffect(() => {
    if (!authUser) {
      setComplaints([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const complaintsRef = collection(db, 'complaints');
    const userComplaintsQuery = query(
      complaintsRef,
      where('userId', '==', authUser.uid)
    );

    const unsubscribe = onSnapshot(userComplaintsQuery, async (snapshot) => {
      const todayStr = new Date().toDateString();
      const loadedComplaints: Complaint[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];

      // Clean up complaints from previous days
      const oldComplaints = loadedComplaints.filter(
        c => new Date(c.date).toDateString() !== todayStr
      );
      for (const old of oldComplaints) {
        if (old.id) {
          await deleteDoc(doc(db, 'complaints', old.id));
        }
      }

      // Update complaints with only today's data
      const updatedComplaints = loadedComplaints.filter(
        c => new Date(c.date).toDateString() === todayStr
      );
      console.log('Updating complaints from onSnapshot:', updatedComplaints);
      setComplaints(updatedComplaints);
      setIsLoading(false);
    }, (error) => {
      console.error('Failed to load complaints:', error.message);
      showToastMessage(`Failed to load complaints: ${error.message}`, 'error');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [authUser]);

  // Toast notification timeout
  useEffect(() => {
    if (showToast.show) {
      const timer = setTimeout(() => {
        setShowToast({ show: false, message: '', type: 'success' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Update available food items based on selected meal
  useEffect(() => {
    let newAvailable: string[] = [];
    if (newComplaint.category === '') {
      newAvailable = [...new Set([
        ...(todayMenu.breakfast || []),
        ...(todayMenu.lunch || []),
        ...(todayMenu.snacks || []),
        ...(todayMenu.dinner || [])
      ])];
    } else {
      const lowerMeal = newComplaint.category.toLowerCase() as keyof DayMenu;
      newAvailable = todayMenu[lowerMeal] || [];
    }
    setAvailableFoodItems(newAvailable);
  }, [newComplaint.category, todayMenu]);

  // Update available food items for edit dialog
  useEffect(() => {
    let newAvailable: string[] = [];
    if (editComplaint.category === '') {
      newAvailable = [...new Set([
        ...(todayMenu.breakfast || []),
        ...(todayMenu.lunch || []),
        ...(todayMenu.snacks || []),
        ...(todayMenu.dinner || [])
      ])];
    } else {
      const lowerMeal = editComplaint.category.toLowerCase() as keyof DayMenu;
      newAvailable = todayMenu[lowerMeal] || [];
    }
    setAvailableFoodItems(newAvailable);
  }, [editComplaint.category, todayMenu]);

  // Reset food item if it’s no longer available
  useEffect(() => {
    if (newComplaint.foodItem && !availableFoodItems.includes(newComplaint.foodItem)) {
      setNewComplaint(prev => ({ ...prev, foodItem: '' }));
    }
    if (editComplaint.foodItem && !availableFoodItems.includes(editComplaint.foodItem)) {
      setEditComplaint(prev => ({ ...prev, foodItem: '' }));
    }
  }, [availableFoodItems, newComplaint.foodItem, editComplaint.foodItem]);

  // Midnight cleanup scheduler (user-specific)
  useEffect(() => {
    const scheduleMidnight = () => {
      const now = new Date();
      const timeToMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 0
      ).getTime() - now.getTime();

      midnightTimeoutRef.current = setTimeout(async () => {
        try {
          const prevDay = new Date();
          prevDay.setDate(prevDay.getDate() - 1);
          const prevDayStr = prevDay.toDateString();

          if (authUser) {
            const complaintsRef = collection(db, 'complaints');
            const userQuery = query(complaintsRef, where('userId', '==', authUser.uid));
            const snapshot = await getDocs(userQuery);
            const complaintsToDelete = snapshot.docs.filter(
              doc => new Date((doc.data() as Complaint).date).toDateString() === prevDayStr
            );

            for (const complaintDoc of complaintsToDelete) {
              await deleteDoc(doc(db, 'complaints', complaintDoc.id));
            }

            if (complaintsToDelete.length > 0) {
              showToastMessage(`${complaintsToDelete.length} complaint(s) from previous day have been cleared.`);
            }
          }

          scheduleMidnight();
        } catch (error: any) {
          console.error('Failed to clear complaints at midnight:', error.message);
          showToastMessage(`Failed to clear complaints: ${error.message}`, 'error');
        }
      }, timeToMidnight);
    };

    scheduleMidnight();

    return () => {
      if (midnightTimeoutRef.current) {
        clearTimeout(midnightTimeoutRef.current);
      }
    };
  }, [authUser]);

  const findMealForItem = (item: string): string | null => {
    if (!item) return null;
    if (todayMenu.breakfast.includes(item)) return 'Breakfast';
    if (todayMenu.lunch.includes(item)) return 'Lunch';
    if (todayMenu.snacks.includes(item)) return 'Snacks';
    if (todayMenu.dinner.includes(item)) return 'Dinner';
    return null;
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setShowToast({ show: true, message, type });
    toast({
      title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info',
      description: message,
      variant: type === 'success' ? 'default' : type === 'error' ? 'destructive' : 'default',
    });
  };

  const handleSubmitComplaint = async () => {
    if (!authUser) {
      showToastMessage('Please log in to submit a complaint.', 'error');
      console.error('Submission failed: User not authenticated');
      return;
    }
    if (!newComplaint.category || !newComplaint.foodItem || !newComplaint.complaint) {
      showToastMessage('Please fill all fields to submit a complaint.', 'error');
      console.error('Submission failed: Missing required fields', newComplaint);
      return;
    }

    try {
      const complaintsRef = collection(db, 'complaints');
      const today = new Date().toISOString().split('T')[0];

      // Normalize foodItem to lowercase for duplicate check
      const normalizedFoodItem = newComplaint.foodItem.trim().toLowerCase();

      // Check for existing complaint
      const existingComplaintQuery = query(
        complaintsRef,
        where('userId', '==', authUser.uid),
        where('foodItem', '==', normalizedFoodItem),
        where('date', '==', today)
      );
      console.log('Checking for existing complaint:', {
        userId: authUser.uid,
        foodItem: normalizedFoodItem,
        date: today
      });

      const existingComplaintSnapshot = await getDocs(existingComplaintQuery);
      console.log('Existing complaint snapshot size:', existingComplaintSnapshot.size, 'Docs:', existingComplaintSnapshot.docs.map(doc => doc.data()));

      if (!existingComplaintSnapshot.empty) {
        showToastMessage('A complaint has already been registered for this item today.', 'error');
        console.error('Submission failed: Duplicate complaint for', normalizedFoodItem);
        return;
      }

      showToastMessage('Submitting complaint...', 'info');
      const complaint: Omit<Complaint, 'id'> = {
        userId: authUser.uid,
        category: newComplaint.category,
        foodItem: normalizedFoodItem,
        complaint: newComplaint.complaint,
        date: today,
        status: 'submitted'
      };

      console.log('Submitting complaint to Firestore:', complaint);

      const docRef = await addDoc(complaintsRef, complaint);
      console.log('Complaint submitted to Firestore with ID:', docRef.id);

      // Clear form and wait for onSnapshot to update the complaints list
      setNewComplaint({ category: '', foodItem: '', complaint: '' });
      setAvailableFoodItems([]);
      showToastMessage('Complaint submitted successfully! Your complaint has been forwarded to the management team.');
    } catch (error: any) {
      console.error('Failed to submit complaint:', error.message, error);
      showToastMessage(`Failed to submit complaint: ${error.message}`, 'error');
    }
  };

  const handleEditClick = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setEditComplaint({
      category: complaint.category,
      foodItem: complaint.foodItem,
      complaint: complaint.complaint
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateComplaint = async () => {
    if (!authUser) {
      showToastMessage('Please log in to update a complaint.', 'error');
      return;
    }
    if (!editingComplaint || !editComplaint.category || !editComplaint.foodItem || !editComplaint.complaint) {
      showToastMessage('Please fill all fields to update the complaint.', 'error');
      return;
    }

    try {
      const normalizedFoodItem = editComplaint.foodItem.trim().toLowerCase();
      const today = new Date().toISOString().split('T')[0];

      // Check if updating to a different food item that already has a complaint today
      if (normalizedFoodItem !== editingComplaint.foodItem.toLowerCase()) {
        const complaintsRef = collection(db, 'complaints');
        const existingComplaintQuery = query(
          complaintsRef,
          where('userId', '==', authUser.uid),
          where('foodItem', '==', normalizedFoodItem),
          where('date', '==', today)
        );
        const existingComplaintSnapshot = await getDocs(existingComplaintQuery);

        if (!existingComplaintSnapshot.empty) {
          showToastMessage('A complaint has already been registered for this item today.', 'error');
          console.error('Update failed: Duplicate complaint for', normalizedFoodItem);
          return;
        }
      }

      const complaintRef = doc(db, 'complaints', editingComplaint.id);
      const updatedComplaint = {
        category: editComplaint.category,
        foodItem: normalizedFoodItem,
        complaint: editComplaint.complaint,
        status: editingComplaint.status // Keep the original status
      };
      await updateDoc(complaintRef, updatedComplaint);
      setIsEditDialogOpen(false);
      setEditingComplaint(null);
      setEditComplaint({ category: '', foodItem: '', complaint: '' });
      showToastMessage('Complaint updated successfully.');
    } catch (error: any) {
      console.error('Failed to update complaint:', error.message);
      showToastMessage(`Failed to update complaint: ${error.message}`, 'error');
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    if (!authUser) {
      showToastMessage('Please log in to delete a complaint.', 'error');
      return;
    }

    if (!id) {
      showToastMessage('Invalid complaint ID.', 'error');
      return;
    }

    try {
      const complaintRef = doc(db, 'complaints', id);
      const complaintDoc = await getDocs(query(collection(db, 'complaints'), where('__name__', '==', id)));

      if (complaintDoc.empty) {
        showToastMessage('Complaint not found.', 'error');
        return;
      }

      const complaintData = complaintDoc.docs[0].data() as Complaint;
      if (complaintData.userId !== authUser.uid) {
        showToastMessage('You are not authorized to delete this complaint.', 'error');
        return;
      }

      await deleteDoc(complaintRef);
      showToastMessage('Complaint deleted successfully.');
    } catch (error: any) {
      console.error('Failed to delete complaint:', error.message);
      showToastMessage(`Failed to delete complaint: ${error.message}`, 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 recent-complaint-badge submitted-badge category-button';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800 recent-complaint-badge reviewed-badge category-button';
      case 'resolved':
        return 'bg-green-100 text-green-800 recent-complaint-badge resolved-badge category-button';
      default:
        return 'bg-gray-100 text-gray-800 recent-complaint-badge category-button';
    }
  };

  const getStatusSummaryColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 recent-complaint-badge submitted-badge category-button';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800 recent-complaint-badge reviewed-badge category-button';
      case 'resolved':
        return 'bg-green-100 text-green-800 recent-complaint-badge resolved-badge category-button';
      default:
        return 'bg-gray-100 text-gray-800 recent-complaint-badge category-button';
    }
  };

  const getStatusCounts = () => {
    const submitted = complaints.filter(c => c.status === 'submitted').length;
    const reviewed = complaints.filter(c => c.status === 'reviewed').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    return { submitted, reviewed, resolved };
  };

  const statusCounts = getStatusCounts();

  const sortedComplaints = [...complaints].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleMealChange = (value: string) => {
    setNewComplaint(prev => ({ ...prev, category: value }));
  };

  const handleFoodItemChange = (value: string) => {
    setNewComplaint(prev => {
      const category = findMealForItem(value);
      return {
        ...prev,
        foodItem: value,
        category: category ? category : prev.category,
      };
    });
  };

  const handleEditMealChange = (value: string) => {
    setEditComplaint(prev => ({ ...prev, category: value }));
  };

  const handleEditFoodItemChange = (value: string) => {
    setEditComplaint(prev => {
      const category = findMealForItem(value);
      return {
        ...prev,
        foodItem: value,
        category: category ? category : prev.category,
      };
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
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
          .prominent-card:hover {
            animation: bulge 1.5s infinite ease-in-out;
          }
          .food-card {
            min-width: 300px;
          }
          .food-card:hover {
            animation: bulge 1.5s infinite ease-in-out;
          }
          .inset-item {
            box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5);
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
          .inset-select {
            background-color: #fff;
            border-radius: 0.375rem;
            box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
          }
          .inset-select:hover {
            transform: scale(1.02);
            box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.35), inset 0 -4px 8px rgba(0, 0, 0, 0.35), inset 0 1px 3px rgba(255, 255, 255, 0.6);
          }
          .inset-textarea {
            background-color: #fff;
            border-radius: 0.375rem;
            box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
          }
          .inset-textarea:hover {
            transform: scale(1.02);
            box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.35), inset 0 -4px 8px rgba(0, 0, 0, 0.35), inset 0 1px 3px rgba(255, 255, 255, 0.6);
          }
          .action-button {
            transition: all 0.3s ease;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3);
            padding: 0.35rem 0.6rem;
            font-size: 0.8rem;
            line-height: 1.2;
            height: 2.25rem;
            border-radius: 0.375rem;
          }
          .action-button:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 3px rgba(0, 0, 0, 0.15), inset 0 2px 3px rgba(255, 255, 255, 0.4);
          }
          .submit-complaint-button {
            padding: 0.5rem 0.3rem;
            height: 2.5rem;
            font-size: 0.9rem;
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
            transition: all 0.3s ease;
          }
          .submit-complaint-button:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 20px rgba(0, 0, 0, 0.3), inset 0 -3px 5px rgba(0, 0, 0, 0.25), inset 0 3px 5px rgba(255, 255, 255, 0.5);
          }
          .submit-complaint-card .card-title {
            font-size: 1.25rem;
          }
          .management-response {
            order: 2;
            margin-bottom: 1rem;
            padding: 0.75rem;
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            border-radius: 0.375rem;
          }
          .management-response p {
            font-size: 0.875rem;
            color: #15803d;
          }
          .action-button-container {
            display: flex;
            gap: 0.5rem;
            width: 100%;
            justify-content: space-between;
            margin-top: 1rem;
            order: 2;
          }
          .main-heading {
            font-size: 18px;
          }
          .submit-complaint-card {
            padding: 0.3rem;
          }
          .submit-complaint-card .card-header {
            padding: 0.5rem 0.75rem;
          }
          .submit-complaint-card .card-content {
            padding: 0.5rem;
            space-y: 1;
          }
          .select-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0.5rem;
          }
          .food-card .card-description-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            flex-wrap: nowrap;
          }
          .food-card .card-description-container .category-button {
            font-size: 0.65rem;
            padding: 0.1rem 0.4rem;
            line-height: 1.2;
            border-radius: 0.375rem;
          }
          .status-card .new-badge {
            background-color: #000080;
            color: #ffffff;
          }
          .status-card .new-badge:hover {
            background-color: #DAA520;
            color: #000000;
          }
          .status-card .in-progress-badge {
            background-color: #A52A2A;
            color: #ffffff;
          }
          .status-card .in-progress-badge:hover {
            background-color: #20B2AA;
            color: #000000;
          }
          .status-card .completed-badge {
            background-color: #008B8B;
            color: #ffffff;
          }
          .status-card .completed-badge:hover {
            background-color: #9ACD32;
            color: #000000;
          }
          .reply-container {
            order: 2;
            margin-bottom: 1rem;
            padding: 0.75rem;
            background-color: #fefce8 !important;
            border-left: 4px solid #facc15 !important;
            border-radius: 0.375rem;
          }
          .reply-container p {
            font-size: 0.875rem;
            color: #1f2937;
          }
          @media (min-width: 640px) {
            .main-heading {
              font-size: 20px;
            }
            .management-response p {
              font-size: 0.875rem;
            }
            .reply-container p {
              font-size: 0.875rem;
            }
            .reply-container {
              padding: 0.75rem;
              background-color: #fefce8 !important;
              border-left: 4px solid #facc15 !important;
            }
            .management-response {
              padding: 0.75rem;
            }
          }
          @media (max-width: 640px) {
            .status-cards-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 0.5rem;
            }
            .status-card {
              min-width: 0;
              text-align: center;
              padding: 0.3rem;
              border: 2px solid #d1d5db;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
              transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .status-card:hover {
              transform: scale(1.05);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .status-card.submitted {
              background-color: #e0f7fa;
            }
            .status-card.reviewed {
              background-color: #f3e8ff;
            }
            .status-card.resolved {
              background-color: #ecfdf5;
            }
            .status-card .card-content {
              padding: 0.3rem;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 0.1rem;
            }
            .status-card .status-count {
              font-size: 0.875rem;
              font-weight: 700;
            }
            .status-card .status-label {
              font-size: 0.6rem;
            }
            .status-card .status-badge {
              font-size: 0.45rem;
              padding: 0.05rem 0.2rem;
              line-height: 1.1;
              border-radius: 0.25rem;
            }
            .status-card .new-badge {
              background-color: #000080;
              color: #ffffff;
            }
            .status-card .new-badge:hover {
              background-color: #DAA520;
              color: #000000;
            }
            .status-card .in-progress-badge {
              background-color: #A52A2A;
              color: #ffffff;
            }
            .status-card .in-progress-badge:hover {
              background-color: #20B2AA;
              color: #000000;
            }
            .status-card .completed-badge {
              background-color: #008B8B;
              color: #ffffff;
            }
            .status-card .completed-badge:hover {
              background-color: #9ACD32;
              color: #000000;
            }
            .category-button {
              padding: 0.05rem 0.15rem;
              font-size: 0.4rem;
              line-height: 1;
              border-radius: 0.25rem;
            }
            .category-button:hover {
              transform: scale(1.05);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.2);
            }
            .food-card {
              min-width: 150px;
            }
            .food-card .card-header {
              padding: 0.25rem 0.5rem;
            }
            .food-card .card-content {
              padding: 0.5rem;
              display: flex;
              flex-direction: column;
            }
            .food-card .card-title {
              font-size: 0.75rem;
            }
            .food-card .card-description {
              font-size: 0.5rem;
            }
            .food-card .card-description-container {
              font-size: 0.5rem;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 0.25rem;
              flex-wrap: nowrap;
            }
            .food-card .card-description-container .category-button {
              font-size: 0.4rem;
              padding: 0.05rem 0.15rem;
              line-height: 1;
              border-radius: 0.25rem;
            }
            .food-card .complaint-text {
              font-size: 0.5rem;
              margin-bottom: 0.25rem;
            }
            .food-card .action-button {
              padding: 0.05rem 0.25rem;
              font-size: 0.5rem;
              line-height: 1;
              height: 1.25rem;
            }
            .food-card .status-badge {
              margin-top: 0.25rem;
              font-size: 0.4rem;
              padding: 0.05rem 0.15rem;
              line-height: 1;
              border-radius: 0.25rem;
            }
            .inset-select {
              box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.4);
              height: 1.8rem;
              font-size: 0.65rem;
              padding: 0.2rem 0.4rem;
            }
            .inset-select:hover {
              transform: scale(1.01);
              box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5);
            }
            .inset-textarea {
              box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.4);
            }
            .inset-textarea:hover {
              transform: scale(1.01);
              box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5);
            }
            .submit-complaint-button {
              padding: 0.4rem 0.2rem;
              height: 2rem;
              font-size: 0.7rem;
            }
            .submit-complaint-card {
              padding: 0.2rem;
            }
            .submit-complaint-card .card-header {
              padding: 0.3rem 0.5rem;
            }
            .submit-complaint-card .card-content {
              padding: 0.3rem;
              space-y: 0.5;
            }
            .submit-complaint-card .card-title {
              font-size: 0.9rem;
            }
            .complaints-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .management-response p {
              font-size: 0.5rem;
            }
            .previous-complaints-heading {
              font-size: 18px;
            }
            @media (max-width: 640px) {
              .management-response p {
                font-size: 0.5rem;
              }
              .reply-container p {
                font-size: 0.5rem;
              }
              .reply-container {
                padding: 0.5rem;
                background-color: #fefce8 !important;
                border-left: 4px solid #facc15 !important;
              }
              .management-response {
                padding: 0.5rem;
              }
            }
          }
          .food-item-badge {
            background-color: #FFDAB9;
            color: #1E3A8A;
          }
          .food-item-badge:hover {
            transform: scale(1.1);
            background-color: #ADFF2F;
            color: #000000;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2), inset 0 -1px 2px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }
          .recent-complaint-badge {
            transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
          }
          .recent-complaint-badge:hover {
            background-color: #FF69B4;
            color: #000000;
          }
          .submitted-badge:hover {
            background-color: #FFD700;
            color: #000000;
          }
          .resolved-badge:hover {
            background-color: #FF7F50;
            color: #000000;
          }
        `}
      </style>

      {showToast.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          showToast.type === 'success' ? 'bg-green-500 text-white' : showToast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          {showToast.message}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-green-700 main-heading">Food Complaints System</h2>
          <div className="text-sm text-gray-600">
            {complaints.length} total complaint{complaints.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 status-cards-grid">
          <Card className="text-center p-3 sm:p-4 bg-[#e0f7fa] border-2 border-gray-300 rounded-2xl shadow-lg shadow-gray-500/50 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer status-card submitted">
            <CardContent className="card-content">
              <div className="text-xl sm:text-2xl font-bold text-cyan-600 status-count">{statusCounts.submitted}</div>
              <p className="text-xs sm:text-sm text-gray-600 status-label">Submitted</p>
              <Badge className="status-badge mt-2 sm:mt-0 new-badge bg-[#000080] text-white hover:bg-[#DAA520] hover:text-black" variant="outline">New</Badge>
            </CardContent>
          </Card>

          <Card className="text-center p-3 sm:p-4 bg-[#f3e8ff] border-2 border-gray-300 rounded-2xl shadow-lg shadow-gray-500/50 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer status-card reviewed">
            <CardContent className="card-content">
              <div className="text-xl sm:text-2xl font-bold text-purple-600 status-count">{statusCounts.reviewed}</div>
              <p className="text-xs sm:text-sm text-gray-600 status-label">Reviewed</p>
              <Badge className="status-badge mt-2 sm:mt-0 in-progress-badge bg-[#A52A2A] text-white hover:bg-[#20B2AA] hover:text-black" variant="outline">In Progress</Badge>
            </CardContent>
          </Card>

          <Card className="text-center p-3 sm:p-4 bg-[#ecfdf5] border-2 border-gray-300 rounded-2xl shadow-lg shadow-gray-500/50 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer status-card resolved">
            <CardContent className="card-content">
              <div className="text-xl sm:text-2xl font-bold text-green-600 status-count">{statusCounts.resolved}</div>
              <p className="text-xs sm:text-sm text-gray-600 status-label">Resolved</p>
              <Badge className="status-badge mt-2 sm:mt-0 completed-badge bg-[#008B8B] text-white hover:bg-[#9ACD32] hover:text-black" variant="outline">Completed</Badge>
            </CardContent>
          </Card>
        </div>

        {authUser ? (
          <Card className="transition-all duration-300 cursor-pointer rounded-lg prominent-card bg-gray-100 border border-gray-200 submit-complaint-card" style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}>
            <CardHeader className="card-header">
              <CardTitle className="card-title">Submit New Complaint</CardTitle>
              <CardDescription>
                Help us improve food quality by reporting any issues with meals
              </CardDescription>
            </CardHeader>
            <CardContent className="card-content">
              <div className="grid select-grid">
                <div className="space-y-2">
                  <Label htmlFor="category">Meal Type</Label>
                  <Select value={newComplaint.category} onValueChange={handleMealChange}>
                    <SelectTrigger className="inset-select">
                      <SelectValue placeholder="Select meal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Breakfast">Breakfast</SelectItem>
                      <SelectItem value="Lunch">Lunch</SelectItem>
                      <SelectItem value="Snacks">Snacks</SelectItem>
                      <SelectItem value="Dinner">Dinner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="food-item">Food Item</Label>
                  <Select value={newComplaint.foodItem} onValueChange={handleFoodItemChange}>
                    <SelectTrigger className="inset-select">
                      <SelectValue placeholder="Select food item" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFoodItems.length > 0 ? (
                        availableFoodItems.map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-items" disabled>No food items available for this meal</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <Label htmlFor="complaint">Complaint Details</Label>
                <Textarea
                  id="complaint"
                  placeholder="Describe the issue with the food (taste, temperature, quality, etc.)"
                  value={newComplaint.complaint}
                  onChange={(e) => setNewComplaint(prev => ({ ...prev, complaint: e.target.value }))}
                  rows={3}
                  className="inset-textarea"
                />
              </div>

              <Button
                onClick={handleSubmitComplaint}
                className="w-full bg-green-600 hover:bg-green-700 action-button submit-complaint-button mt-2"
                style={{ boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
              >
                Submit Complaint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="transition-all duration-300 cursor-pointer rounded-lg prominent-card bg-gray-100 border border-gray-200 submit-complaint-card" style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}>
            <CardContent className="text-center py-4 card-content">
              <p className="text-gray-500 text-lg">Please log in to submit a complaint.</p>
            </CardContent>
          </Card>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Complaint</DialogTitle>
              <DialogDescription>
                Update the details of your complaint.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Meal Type</Label>
                <Select value={editComplaint.category} onValueChange={handleEditMealChange}>
                  <SelectTrigger className="inset-select">
                    <SelectValue placeholder="Select meal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Breakfast">Breakfast</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Snacks">Snacks</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-food-item">Food Item</Label>
                <Select value={editComplaint.foodItem} onValueChange={handleEditFoodItemChange}>
                  <SelectTrigger className="inset-select">
                    <SelectValue placeholder="Select food item" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFoodItems.length > 0 ? (
                      availableFoodItems.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-items" disabled>No food items available for this meal</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-complaint">Complaint Details</Label>
                <Textarea
                  id="edit-complaint"
                  placeholder="Describe the issue with the food (taste, temperature, quality, etc.)"
                  value={editComplaint.complaint}
                  onChange={(e) => setEditComplaint(prev => ({ ...prev, complaint: e.target.value }))}
                  rows={4}
                  className="inset-textarea"
                />
              </div>
              <Button onClick={handleUpdateComplaint} className="w-full">
                Update Complaint
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 previous-complaints-heading">Your Previous Complaints</h3>

          <div className="min-h-[400px]">
            {isLoading ? (
              <Card
                className="h-[400px] transition-all duration-300 cursor-pointer rounded-lg food-card bg-gray-100 border border-gray-200"
                style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
              >
                <CardContent className="text-center py-8 h-full flex flex-col justify-center items-center">
                  <div className="space-y-4">
                    <div className="text-6xl text-gray-300">⏳</div>
                    <p className="text-gray-500 text-lg">Loading complaints...</p>
                  </div>
                </CardContent>
              </Card>
            ) : complaints.length === 0 ? (
              <Card
                className="h-[400px] transition-all duration-300 cursor-pointer rounded-lg food-card bg-gray-100 border border-gray-200"
                style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
              >
                <CardContent className="text-center py-8 h-full flex flex-col justify-center items-center">
                  <div className="space-y-4">
                    <div className="text-6xl text-gray-300">📝</div>
                    <p className="text-gray-500 text-lg">
                      {authUser ? 'No complaints submitted yet.' : 'Please log in to view your complaints.'}
                    </p>
                    {authUser && (
                      <p className="text-sm text-gray-400">
                        Use the form above to report any food-related issues.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 complaints-grid">
                {sortedComplaints.map((complaint) => (
                  <Card
                    key={complaint.id}
                    className="transition-all duration-300 cursor-pointer rounded-lg food-card bg-gray-100 border border-gray-200"
                    style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
                  >
                    <CardHeader className="card-header pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg card-title">
                            <span className="inline-block bg-white rounded px-2 py-1 border border-gray-200 inset-item">
                              {complaint.foodItem} - {complaint.category}
                            </span>
                          </CardTitle>
                        </div>
                      </div>
                      <CardDescription className="card-description">
                        <div className="card-description-container">
                          <span>Submitted on {new Date(complaint.date).toLocaleDateString()}</span>
                          <Badge className={getStatusColor(complaint.status)}>
                            {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                          </Badge>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="card-content px-4 py-2 flex flex-col">
                      <p className="text-gray-700 mb-4 complaint-text text-sm">{complaint.complaint}</p>

                      {complaint.reply && (
                        <div className="reply-container mb-4">
                          <p>
                            <strong>Management Response:</strong> {complaint.reply}
                          </p>
                        </div>
                      )}

                      {complaint.status === 'resolved' && !complaint.reply && (
                        <div className="management-response">
                          <p>
                            <strong>Management Response:</strong> Thank you for your feedback.
                            We have addressed this issue with our kitchen staff and implemented
                            measures to prevent similar occurrences.
                          </p>
                        </div>
                      )}

                      <div className="action-button-container">
                        {complaint.status === 'submitted' && !complaint.reply && (
                          <>
                            <Button
                              variant="outline"
                              className="flex-1 flex items-center justify-center gap-1 border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 action-button"
                              style={{ boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)' }}
                              onClick={() => handleEditClick(complaint)}
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 flex items-center justify-center gap-1 border-2 border-red-400 text-red-600 font-bold hover:bg-red-50 action-button"
                              style={{ boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)' }}
                              onClick={() => handleDeleteComplaint(complaint.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentComplaints;
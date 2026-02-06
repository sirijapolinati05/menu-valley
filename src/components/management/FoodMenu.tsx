import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Upload, Trash2, Search } from 'lucide-react';
import { useFoodContext } from '@/contexts/FoodContext';

const FoodMenu = () => {
  const { foodItems, addFoodItem, updateFoodItem, deleteFoodItem } = useFoodContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inputError, setInputError] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form states for add dialog
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCategories, setNewFoodCategories] = useState([]);
  const [newFoodDescription, setNewFoodDescription] = useState('');
  const [newFoodImage, setNewFoodImage] = useState(null);
  const [newFoodImagePreview, setNewFoodImagePreview] = useState('');

  // Form states for edit dialog
  const [editFoodName, setEditFoodName] = useState('');
  const [editFoodCategories, setEditFoodCategories] = useState([]);
  const [editFoodDescription, setEditFoodDescription] = useState('');
  const [editFoodImage, setEditFoodImage] = useState(null);
  const [editFoodImagePreview, setEditFoodImagePreview] = useState('');
  const [editImageError, setEditImageError] = useState(false);

  // Category options
  const categoryOptions = [
    { value: 'Breakfast', label: 'Breakfast' },
    { value: 'Lunch', label: 'Lunch' },
    { value: 'Snacks', label: 'Snacks' },
    { value: 'Dinner', label: 'Dinner' },
  ];

  const dropdownOptions = [
    { value: '', label: 'All Categories' },
    { value: 'Breakfast', label: 'Breakfast' },
    { value: 'Lunch', label: 'Lunch' },
    { value: 'Dinner', label: 'Dinner' },
    { value: 'Breakfast+Dinner', label: 'Breakfast+Dinner' },
  ];

  const categoryColors = {
    Breakfast: { base: 'bg-blue-100 text-blue-800', hover: 'hover:bg-red-200 hover:text-red-900' },
    Lunch: { base: 'bg-green-100 text-gray-800', hover: 'hover:bg-orange-200 hover:text-orange-900' },
    Snacks: { base: 'bg-yellow-100 text-yellow-800', hover: 'hover:bg-purple-200 hover:text-purple-900' },
    Dinner: { base: 'bg-purple-100 text-purple-800', hover: 'hover:bg-green-200 hover:text-green-900' },
  };

  // Sort and filter food items
  const sortedFoodItems = [...foodItems].sort((a, b) => (a.order || 0) - (b.order || 0));
  const filteredItems = sortedFoodItems.filter(item => {
    const matchesSearch = searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchesCategory = selectedCategory
      ? selectedCategory === 'Breakfast+Dinner'
        ? (Array.isArray(item.category)
            ? item.category.includes('Breakfast') && item.category.includes('Dinner')
            : item.category === 'Breakfast+Dinner')
        : Array.isArray(item.category)
          ? item.category.includes(selectedCategory)
          : item.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  const isFullList = !searchTerm && !selectedCategory;

  const validateSearchInput = (input) => {
    if (!input.trim()) return 'Please enter a food item to search';
    return '';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const error = validateSearchInput(searchTerm);
    setInputError(error);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add('opacity-50', 'scale-95');
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== index) {
      const newItems = [...filteredItems];
      const [moved] = newItems.splice(draggedIndex, 1);
      newItems.splice(index, 0, moved);
      setDraggedIndex(index);
      newItems.forEach((item, i) => {
        item.tempOrder = i;
      });
    }
  };

  const handleDragEnd = (e) => {
    setDraggedIndex(null);
    e.currentTarget.classList.remove('opacity-50', 'scale-95');
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex === targetIndex) return;

    const newItems = [...filteredItems];
    const [moved] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, moved);

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      if (item.order !== i) {
        await updateFoodItem(item.id, { ...item, order: i });
      }
    }
    setDraggedIndex(null);
  };

  const handleImageUpload = async (event, isEdit = false) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSizeInBytes = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSizeInBytes) {
        alert('File size exceeds 50MB. Please upload a smaller image.');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file.');
        return;
      }

      try {
        const previewUrl = URL.createObjectURL(file);
        
        if (isEdit) {
          setEditFoodImage(file);
          setEditFoodImagePreview(previewUrl);
          setEditImageError(false); // Reset error state
        } else {
          setNewFoodImage(file);
          setNewFoodImagePreview(previewUrl);
        }
      } catch (e) {
        console.error('Error creating image preview:', e);
        alert('Error processing the image file. Please try again.');
      }
    }
  };

  const handleAddFood = async () => {
    if (!newFoodName || newFoodCategories.length === 0) {
      alert('Please provide a food name and at least one category.');
      return;
    }
    setIsAdding(true);
    try {
      const description = newFoodDescription.trim() || `Delicious ${newFoodName} from our kitchen`;
      await addFoodItem({
        name: newFoodName,
        category: newFoodCategories.length === 1 ? newFoodCategories[0] : newFoodCategories.sort((a, b) => {
          if (a === 'Snacks' && b === 'Dinner') return -1;
          if (a === 'Dinner' && b === 'Snacks') return 1;
          if (a === 'Breakfast' && b === 'Snacks') return -1;
          if (a === 'Snacks' && b === 'Breakfast') return 1;
          if (a === 'Lunch' && b === 'Dinner') return -1;
          if (a === 'Dinner' && b === 'Lunch') return 1;
          return a.localeCompare(b);
        }),
        description,
        image: newFoodImage || null, // Assume addFoodItem uploads the image and returns a URL
        order: Date.now(),
      });
      
      // Clean up blob URL with proper null checking
      if (newFoodImagePreview && typeof newFoodImagePreview === 'string' && newFoodImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(newFoodImagePreview);
      }
      
      setNewFoodName('');
      setNewFoodCategories([]);
      setNewFoodDescription('');
      setNewFoodImage(null);
      setNewFoodImagePreview('');
      setIsAddDialogOpen(false);
    } catch (e) {
      console.error('Error adding food item:', e);
      alert(e.message || 'Error adding food item. Please try again.');
    } finally {
      setTimeout(() => setIsAdding(false), 300);
    }
  };

  const handleEditClick = (item) => {
    try {
      setEditingItem(item);
      setEditFoodName(item.name || '');
      setEditFoodCategories(Array.isArray(item.category) ? item.category : [item.category] || []);
      setEditFoodDescription(item.description || '');
      setEditFoodImage(null);
      setEditImageError(false);
      
      // Always set a valid string for image preview
      const imageUrl = item.image ? String(item.image) : '/placeholder.svg';
      setEditFoodImagePreview(imageUrl);
      
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Error opening edit dialog:', error);
      alert('Error opening edit dialog. Please try again.');
    }
  };

  const handleUpdateFood = async () => {
    if (!editFoodName || editFoodCategories.length === 0) {
      alert('Please provide a food name and at least one category.');
      return;
    }
    try {
      let updatedDescription = editFoodDescription.trim();
      if (!updatedDescription || updatedDescription === `Delicious ${editingItem.name} from our kitchen`) {
        updatedDescription = `Delicious ${editFoodName} from our kitchen`;
      }
      
      await updateFoodItem(editingItem.id, {
        name: editFoodName,
        category: editFoodCategories.length === 1 ? editFoodCategories[0] : editFoodCategories.sort((a, b) => {
          if (a === 'Snacks' && b === 'Dinner') return -1;
          if (a === 'Dinner' && b === 'Snacks') return 1;
          if (a === 'Breakfast' && b === 'Snacks') return -1;
          if (a === 'Snacks' && b === 'Breakfast') return 1;
          if (a === 'Lunch' && b === 'Dinner') return -1;
          if (a === 'Dinner' && b === 'Lunch') return 1;
          return a.localeCompare(b);
        }),
        description: updatedDescription,
        image: editFoodImage || editingItem.image || null,
        order: editingItem.order,
      });
      
      // Clean up blob URL with proper null checking
      if (editFoodImagePreview && typeof editFoodImagePreview === 'string' && editFoodImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(editFoodImagePreview);
      }
      
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setEditFoodName('');
      setEditFoodCategories([]);
      setEditFoodDescription('');
      setEditFoodImage(null);
      setEditFoodImagePreview('');
      setEditImageError(false);
    } catch (e) {
      console.error('Error updating food item:', e);
      alert(e.message || 'Error updating food item. Please try again.');
    }
  };

  const handleDeleteFood = async (id) => {
    try {
      await deleteFoodItem(id);
    } catch (e) {
      console.error('Error deleting food item:', e);
      alert(e.message || 'Error deleting food item. Please try again.');
    }
  };

  const handleNewCategoryChange = (category) => {
    setNewFoodCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleEditCategoryChange = (category) => {
    setEditFoodCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleImageError = (e) => {
    console.error('Image load error:', e);
    // Only set placeholder if it's not a blob URL (uploaded image)
    if (e.target.src && typeof e.target.src === 'string' && !e.target.src.startsWith('blob:')) {
      e.target.src = '/placeholder.svg';
    }
  };

  const handleEditImageError = (e) => {
    console.error('Edit image load error:', e);
    setEditImageError(true);
    // Don't override blob URLs with placeholder
    if (e.target.src && typeof e.target.src === 'string' && !e.target.src.startsWith('blob:')) {
      e.target.src = '/placeholder.svg';
    }
  };

  // Helper function to safely check if URL is blob
  const isBlobUrl = (url) => {
    return url && typeof url === 'string' && url.startsWith('blob:');
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      // Clean up with proper null checking
      if (isBlobUrl(newFoodImagePreview)) {
        URL.revokeObjectURL(newFoodImagePreview);
      }
      if (isBlobUrl(editFoodImagePreview)) {
        URL.revokeObjectURL(editFoodImagePreview);
      }
    };
  }, [newFoodImagePreview, editFoodImagePreview]);

  return (
    <div className="space-y-6 px-2">
      <style>
        {`
          @keyframes bulge {
            0% { transform: scale(1); box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4); }
            50% { transform: scale(1.05); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35), inset 0 -3px 5px rgba(0, 0, 0, 0.25), inset 0 3px 5px rgba(255, 255, 255, 0.5); }
            100% { transform: scale(1); box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4); }
          }
          .search-box:hover { animation: bulge 1.5s infinite ease-in-out; }
          .info-box:hover { animation: bulge 1.5s infinite ease-in-out; }
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
          .action-button {
            transition: all 0.2s ease;
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
          .food-card {
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
          }
          .food-card.dragging { opacity: 0.5; transform: scale(0.95); z-index: 10; }
          .food-card.drag-over { transform: translateY(10px); border: 2px dashed #ff9500; }
          .food-card:hover { animation: bulge 1.5s infinite ease-in-out; }
          .add-button {
            transition: all 0.15s ease;
            box-shadow: 
              0 8px 16px rgba(0, 0, 0, 0.25), 
              0 4px 8px rgba(0, 0, 0, 0.15), 
              inset 0 -2px 4px rgba(0, 0, 0, 0.2), 
              inset 0 2px 4px rgba(255, 255, 255, 0.4);
            transform: translateY(-2px);
            position: relative;
            z-index: 10;
          }
          .add-button:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 
              0 12px 24px rgba(0, 0, 0, 0.3), 
              0 6px 12px rgba(0, 0, 0, 0.2), 
              inset 0 -3px 6px rgba(0, 0, 0, 0.25), 
              inset 0 3px 6px rgba(255, 255, 255, 0.5);
            background-color: #f97316 !important;
            color: #ffffff !important;
          }
          .add-button:active {
            transform: translateY(0) scale(0.98);
            box-shadow: 
              0 4px 8px rgba(0, 0, 0, 0.2), 
              inset 0 -1px 2px rgba(0, 0, 0, 0.1), 
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }
          .add-dialog-button {
            transition: all 0.1s ease;
            box-shadow: 
              0 6px 12px rgba(0, 0, 0, 0.2), 
              0 3px 6px rgba(0, 0, 0, 0.1), 
              inset 0 -2px 4px rgba(0, 0, 0, 0.15), 
              inset 0 2px 4px rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
          }
          .add-dialog-button:hover {
            transform: translateY(-3px) scale(1.01);
            box-shadow: 
              0 10px 20px rgba(0, 0, 0, 0.25), 
              0 5px 10px rgba(0, 0, 0, 0.15), 
              inset 0 -3px 5px rgba(0, 0, 0, 0.2), 
              inset 0 3px 5px rgba(255, 255, 255, 0.4);
            background-color: #f97316 !important;
          }
          .add-dialog-button:active {
            transform: translateY(0) scale(0.99);
            box-shadow: 
              0 3px 6px rgba(0, 0, 0, 0.15), 
              inset 0 -1px 2px rgba(0, 0, 0, 0.1), 
              inset 0 1px 2px rgba(255, 255, 255, 0.2);
          }
          .category-select-container { position: relative; width: 100%; max-width: 200px; margin-left: auto; margin-right: auto; }
          .category-select {
            box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 -4px 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
            background-color: #ffffff !important;
            color: #000000 !important;
            width: 100%;
            text-align: center;
          }
          .category-select option {
            background-color: #ffffff !important;
            color: #000000 !important;
            text-align: center;
            padding: 0 10px;
            box-shadow: inset 0 6px 12px rgba(0, 0, 0, 0.4), inset 0 -6px 12px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .category-select option:hover { background-color: #f0f0f0 !important; color: #000000 !important; }
          .search-bar {
            box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 -4px 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .search-box { min-height: 180px; }
          .info-box { min-height: 160px; }
          .food-image-container { 
            position: relative; 
            width: 100%; 
            padding-top: 56.25%; 
            overflow: hidden; 
            border-radius: 0.5rem; 
            background-color: #f3f4f6;
          }
          .food-image { 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
            background-color: transparent;
          }
          .placeholder-image {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background-color: #f3f4f6;
            color: #9ca3af;
            font-size: 2rem;
          }
          .inset-input {
            box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -4px 8px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid #d1d5db;
            background-color: #ffffff;
            transition: all 0.3s ease;
          }
          .inset-input:hover, .inset-input:focus {
            box-shadow: inset 0 5px 10px rgba(0, 0, 0, 0.25), inset 0 -5px 10px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.15);
            transform: scale(1.02);
            border-color: #f97316;
          }
          .inset-checkbox {
            appearance: none;
            width: 1rem;
            height: 1rem;
            border: 2px solid #d1d5db;
            border-radius: 0.25rem;
            background-color: #ffffff;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            cursor: pointer;
          }
          .inset-checkbox:checked {
            background-color: #f97316;
            border-color: #f97316;
            box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.25), inset 0 -3px 5px rgba(0, 0, 0, 0.25);
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
          }
          .inset-checkbox:hover {
            box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.25), inset 0 -3px 5px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.15);
            transform: scale(1.1);
          }
          .inset-textarea {
            box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -4px 8px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid #d1d5db;
            background-color: #ffffff;
            transition: all 0.3s ease;
            resize: vertical;
          }
          .inset-textarea:hover, .inset-textarea:focus {
            box-shadow: inset 0 5px 10px rgba(0, 0, 0, 0.25), inset 0 -5px 10px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.15);
            transform: scale(1.02);
            border-color: #f97316;
          }
          .inset-file-input {
            box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -4px 8px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1);
            border: 1px solid #d1d5db;
            background-color: #ffffff;
            transition: all 0.3s ease;
            padding: 0.5rem;
            border-radius: 0.375rem;
          }
          .inset-file-input:hover, .inset-file-input:focus {
            box-shadow: inset 0 5px 10px rgba(0, 0, 0, 0.25), inset 0 -5px 10px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.15);
            transform: scale(1.02);
            border-color: #f97316;
          }
          .image-error {
            border: 2px solid #ef4444;
            background-color: #fef2f2;
          }
        `}
      </style>

      {/* Header with Add Button */}
      <div className="flex justify-start items-center">
        <h2 className="text-[20px] md:text-[22px] font-bold text-orange-700 whitespace-nowrap">
          Hostel Menu
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="ml-auto bg-orange-500 text-white font-bold border-orange-600 hover:bg-orange-600 hover:text-white transition-all duration-150 transform add-button"
              style={{ boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
            >
              Add New Food Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Food Item</DialogTitle>
              <DialogDescription>
                Add a new food item to the menu with categories and description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="food-name">Food Name</Label>
                <Input
                  id="food-name"
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  placeholder="Enter food name"
                  className="inset-input"
                />
              </div>
              <div>
                <Label>Categories</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {categoryOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`new-category-${option.value}`}
                        checked={newFoodCategories.includes(option.value)}
                        onChange={() => handleNewCategoryChange(option.value)}
                        className="inset-checkbox"
                      />
                      <Label htmlFor={`new-category-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="food-description">Description</Label>
                <Textarea
                  id="food-description"
                  value={newFoodDescription}
                  onChange={(e) => setNewFoodDescription(e.target.value)}
                  placeholder="Enter food description"
                  className="inset-textarea"
                />
              </div>
              <div>
                <Label htmlFor="food-image">Upload Image (max 50MB)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="food-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="inset-file-input"
                  />
                  <Upload className="h-4 w-4 text-gray-400" />
                </div>
                {newFoodImagePreview && (
                  <div className="mt-2">
                    <div className="food-image-container">
                      <img 
                        src={newFoodImagePreview} 
                        alt="Preview" 
                        className="food-image" 
                        onError={handleImageError}
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={handleAddFood}
                className="w-full bg-orange-500 hover:bg-orange-600 add-dialog-button"
                disabled={isAdding}
              >
                {isAdding ? 'Adding...' : 'Add Food Item'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Section */}
      <div
        className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-2xl p-6 shadow-lg text-black mb-6 transform transition-all duration-300 search-box"
        style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
      >
        <h1 className="text-lg md:text-xl font-bold mb-2">Welcome to Menu Valley</h1>
        <p className="text-orange-50 mb-6">Check, report, and manage your food items with Menu Valley.</p>
        <form onSubmit={handleSearch} className="flex flex-col gap-2">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Enter food item to search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setInputError('');
              }}
              className="w-full p-2 pl-10 bg-white/90 border-0 placeholder-gray-500 text-gray-900 rounded search-bar"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            {inputError && (
              <div className="absolute -bottom-6 left-0 text-xs text-red-200 flex items-center">
                {inputError}
              </div>
            )}
          </div>
          <div className="category-select-container">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-white/90 text-black font-bold border-gray-300 rounded focus:ring-2 focus:ring-orange-300 category-select"
            >
              {dropdownOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex mt-2">
            <Button
              type="submit"
              className="ml-auto bg-orange-500 text-white font-bold border-orange-600 hover:bg-white hover:text-black check-now-button"
              style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
            >
              Check Now
            </Button>
          </div>
        </form>
      </div>

      {/* Info Sections */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div
          className="bg-gray-200 rounded-2xl p-6 shadow-lg text-gray-800 flex-1 transform transition-all duration-300 info-box"
          style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
        >
          <h2 className="text-xl font-semibold mb-4">Timings</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Breakfast: 7AM to 9AM</li>
            <li>Lunch: 11:30AM to 2PM</li>
            <li>Snacks: 4PM to 6PM</li>
            <li>Dinner: 7PM to 9PM</li>
          </ul>
        </div>
        <div
          className="bg-gray-200 rounded-2xl p-6 shadow-lg text-gray-800 flex-1 transform transition-all duration-300 info-box"
          style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
        >
          <h2 className="text-xl font-semibold mb-4">Note</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>On Public Holidays, Dosa will be served instead of all other breakfast items.</li>
            <li>Once a month, a feast will be organized.</li>
            <li>Subject to the availability of vegetables in the market, the menu may be varied.</li>
            <li>Boiled egg will be served as an add-on on a monthly basis.</li>
          </ul>
        </div>
      </div>

      {/* Food Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <Card
              key={item.id}
              draggable={isFullList}
              onDragStart={(e) => isFullList && handleDragStart(e, index)}
              onDragOver={(e) => isFullList && handleDragOver(e, index)}
              onDragEnd={(e) => isFullList && handleDragEnd(e)}
              onDrop={(e) => isFullList && handleDrop(e, index)}
              className={`transition-all duration-300 cursor-pointer transform food-card ${draggedIndex === index ? 'dragging' : ''} ${draggedIndex !== null && draggedIndex !== index && index === filteredItems.findIndex(i => i.tempOrder === item.tempOrder) ? 'drag-over' : ''}`}
              style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
            >
              <CardHeader className="pb-3">
                <div className="food-image-container">
                  {item.image ? (
                    <img
                      src={String(item.image)}
                      alt={item.name}
                      className="food-image"
                      onError={handleImageError}
                      crossOrigin="anonymous"
                      loading="lazy"
                    />
                  ) : (
                    <div className="placeholder-image">
                      📷
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{item.name}</CardTitle>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(Array.isArray(item.category) ? item.category : [item.category]).map((cat, idx) => (
                    <span
                      key={idx}
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full cursor-pointer category-button ${categoryColors[cat]?.base || 'bg-gray-100 text-gray-800'} ${categoryColors[cat]?.hover || 'hover:bg-gray-200 hover:text-gray-900'}`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                {item.description && (
                  <CardDescription className="text-xs text-gray-600 mt-1">
                    {item.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="px-4 py-2">
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-1 border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 action-button text-xs"
                    style={{ boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)' }}
                    onClick={() => handleEditClick(item)}
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-1 border-2 border-red-400 text-red-600 font-bold hover:bg-red-50 action-button text-xs"
                    style={{ boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3)' }}
                    onClick={() => handleDeleteFood(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : searchTerm ? (
          <div className="col-span-2 sm:col-span-4 flex items-center justify-center min-h-[200px] bg-red-100 text-red-800 p-4 rounded-lg border border-red-300">
            This food item is not available in our college menu
          </div>
        ) : null}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Food Item</DialogTitle>
            <DialogDescription>
              Update the food item details including image.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-food-name">Food Name</Label>
              <Input
                id="edit-food-name"
                value={editFoodName}
                onChange={(e) => setEditFoodName(e.target.value)}
                placeholder="Enter food name"
                className="inset-input"
              />
            </div>
            <div>
              <Label>Categories</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categoryOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-category-${option.value}`}
                      checked={editFoodCategories.includes(option.value)}
                      onChange={() => handleEditCategoryChange(option.value)}
                      className="inset-checkbox"
                    />
                    <Label htmlFor={`edit-category-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-food-description">Description</Label>
              <Textarea
                id="edit-food-description"
                value={editFoodDescription}
                onChange={(e) => setEditFoodDescription(e.target.value)}
                placeholder="Enter food description"
                className="inset-textarea"
              />
            </div>
            
            {/* Current Image Display - Fixed conditional rendering */}
            {editFoodImagePreview && !editImageError && (
              <div>
                <Label>Current Image</Label>
                <div className="mt-2">
                  <div className="food-image-container">
                    <img 
                      src={editFoodImagePreview} 
                      alt="Current food image" 
                      className="food-image" 
                      onError={handleEditImageError}
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Upload New Image */}
            <div>
              <Label htmlFor="edit-food-image">Upload New Image (max 50MB)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="edit-food-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="inset-file-input"
                />
                <Upload className="h-4 w-4 text-gray-400" />
              </div>
              {editFoodImage && editFoodImagePreview && (
                <div className="mt-2">
                  <div className="food-image-container">
                    <img 
                      src={editFoodImagePreview} 
                      alt="New image preview" 
                      className="food-image" 
                      onError={handleEditImageError}
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {editImageError && (
              <div className="text-red-600 text-xs">
                Failed to load image. Please try uploading a different image.
              </div>
            )}
            
            <Button onClick={handleUpdateFood} className="w-full bg-orange-500 hover:bg-orange-600 add-dialog-button">
              Update Food Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodMenu;
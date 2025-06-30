
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Edit, Upload } from 'lucide-react';
import { useFoodContext } from '@/contexts/FoodContext';
import Select from 'react-select';

const FoodMenu = () => {
  const { foodItems, addFoodItem, updateFoodItem } = useFoodContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form states for add dialog
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState('');
  const [newFoodDescription, setNewFoodDescription] = useState('');
  const [newFoodImage, setNewFoodImage] = useState('');

  // Form states for edit dialog
  const [editFoodName, setEditFoodName] = useState('');
  const [editFoodCategory, setEditFoodCategory] = useState<string[]>([]); // Changed to array for multiple categories
  const [editFoodDescription, setEditFoodDescription] = useState('');
  const [editFoodImage, setEditFoodImage] = useState('');

  // Category options for react-select
  const categoryOptions = [
    { value: 'Breakfast', label: 'Breakfast' },
    { value: 'Lunch', label: 'Lunch' },
    { value: 'Snacks', label: 'Snacks' },
    { value: 'Dinner', label: 'Dinner' }
  ];

  const filteredItems = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        if (isEdit) {
          setEditFoodImage(imageDataUrl);
        } else {
          setNewFoodImage(imageDataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFood = () => {
    if (newFoodName && newFoodCategory) {
      addFoodItem({
        id: crypto.randomUUID(),
        name: newFoodName,
        category: newFoodCategory, // Single category for add
        description: newFoodDescription,
        image: newFoodImage || '/placeholder.svg'
      });
      setNewFoodName('');
      setNewFoodCategory('');
      setNewFoodDescription('');
      setNewFoodImage('');
      setIsAddDialogOpen(false);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setEditFoodName(item.name);
    // Convert single category or array of categories to array
    setEditFoodCategory(Array.isArray(item.category) ? item.category : [item.category]);
    setEditFoodDescription(item.description || '');
    setEditFoodImage(item.image || '/placeholder.svg');
    setIsEditDialogOpen(true);
  };

  const handleUpdateFood = () => {
    if (editingItem && editFoodName && editFoodCategory.length > 0) {
      updateFoodItem(editingItem.id, {
        name: editFoodName,
        category: editFoodCategory, // Array of categories
        description: editFoodDescription,
        image: editFoodImage || '/placeholder.svg'
      });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setEditFoodName('');
      setEditFoodCategory([]);
      setEditFoodDescription('');
      setEditFoodImage('');
    }
  };

  // Custom styles for react-select
  const customStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#e2e8f0',
      borderRadius: '0.375rem',
      padding: '0.25rem'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999
    })
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-orange-700">Food Menu Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">Add New Food Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Food Item</DialogTitle>
              <DialogDescription>
                Add a new food item to the menu with category and description.
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
                />
              </div>
              <div>
                <Label htmlFor="food-category">Category</Label>
                <Select
                  options={categoryOptions}
                  value={categoryOptions.find(option => option.value === newFoodCategory) || null}
                  onChange={(selected) => setNewFoodCategory(selected?.value || '')}
                  placeholder="Select category"
                  styles={customStyles}
                />
              </div>
              <div>
                <Label htmlFor="food-description">Description</Label>
                <Textarea
                  id="food-description"
                  value={newFoodDescription}
                  onChange={(e) => setNewFoodDescription(e.target.value)}
                  placeholder="Enter food description"
                />
              </div>
              <div>
                <Label htmlFor="food-image">Upload Image</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="food-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="flex-1"
                  />
                  <Upload className="h-4 w-4 text-gray-400" />
                </div>
                {newFoodImage && (
                  <div className="mt-2">
                    <img
                      src={newFoodImage}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
              <Button onClick={handleAddFood} className="w-full">
                Add Food Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search food items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Food Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <img
                src={item.image || '/placeholder.svg'}
                alt={item.name}
                className="w-full h-32 object-cover rounded-lg mb-2"
              />
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription className="text-sm text-orange-600">
                {Array.isArray(item.category) ? item.category.join(', ') : item.category}
              </CardDescription>
              {item.description && (
                <CardDescription className="text-xs text-gray-600 mt-1">
                  {item.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => handleEditClick(item)}
              >
                <Edit className="h-4 w-4" />
                Edit Item
              </Button>
            </CardContent>
          </Card>
        ))}
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
              />
            </div>
            <div>
              <Label htmlFor="edit-food-category">Categories</Label>
              <Select
                isMulti
                options={categoryOptions}
                value={categoryOptions.filter(option => editFoodCategory.includes(option.value))}
                onChange={(selected) => setEditFoodCategory(selected.map(option => option.value))}
                placeholder="Select categories"
                styles={customStyles}
              />
            </div>
            <div>
              <Label htmlFor="edit-food-description">Description</Label>
              <Textarea
                id="edit-food-description"
                value={editFoodDescription}
                onChange={(e) => setEditFoodDescription(e.target.value)}
                placeholder="Enter food description"
              />
            </div>
            
            {/* Current Image Preview */}
            {editFoodImage && (
              <div>
                <Label>Current Image</Label>
                <div className="mt-2">
                  <img
                    src={editFoodImage}
                    alt="Current food image"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                </div>
              </div>
            )}
            
            {/* Image Upload */}
            <div>
              <Label htmlFor="edit-food-image">Upload New Image</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="edit-food-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, true)}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <Button onClick={handleUpdateFood} className="w-full">
              Update Food Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodMenu;

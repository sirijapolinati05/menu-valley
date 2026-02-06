import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useFoodContext } from '@/contexts/FoodContext';

const StudentFoodMenu = () => {
  const { foodItems } = useFoodContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [inputError, setInputError] = useState('');

  // Category options for dropdown
  const dropdownOptions = [
    { value: '', label: 'All Categories' },
    { value: 'Breakfast', label: 'Breakfast' },
    { value: 'Lunch', label: 'Lunch' },
    { value: 'Dinner', label: 'Dinner' },
    { value: 'Breakfast+Dinner', label: 'Breakfast+Dinner' },
  ];

  // Category color mapping with distinct hover colors
  const categoryColors = {
    Breakfast: { base: 'bg-blue-100 text-blue-800', hover: 'hover:bg-red-200 hover:text-red-900' },
    Lunch: { base: 'bg-green-100 text-gray-800', hover: 'hover:bg-orange-200 hover:text-orange-900' },
    Snacks: { base: 'bg-yellow-100 text-yellow-800', hover: 'hover:bg-purple-200 hover:text-purple-900' },
    Dinner: { base: 'bg-purple-100 text-purple-800', hover: 'hover:bg-green-200 hover:text-green-900' },
  };

  // Define category order for sorting
  const categoryOrder = [
    'Breakfast',
    'Breakfast+Snacks',
    'Snacks',
    'Snacks+Dinner',
    'Lunch',
    'Lunch+Dinner',
    'Dinner',
  ];

  // Helper function to get category key for sorting
  const getCategoryKey = (categories) => {
    const cats = Array.isArray(categories) ? categories.sort((a, b) => {
      if (a === 'Snacks' && b === 'Dinner') return -1;
      if (a === 'Dinner' && b === 'Snacks') return 1;
      if (a === 'Breakfast' && b === 'Snacks') return -1;
      if (a === 'Snacks' && b === 'Breakfast') return 1;
      if (a === 'Lunch' && b === 'Dinner') return -1;
      if (a === 'Dinner' && b === 'Lunch') return 1;
      return a.localeCompare(b);
    }) : [categories];
    if (cats.length === 1) return cats[0];
    if (cats.includes('Breakfast') && cats.includes('Snacks')) return 'Breakfast+Snacks';
    if (cats.includes('Snacks') && cats.includes('Dinner')) return 'Snacks+Dinner';
    if (cats.includes('Lunch') && cats.includes('Dinner')) return 'Lunch+Dinner';
    return cats[0] || 'Other';
  };

  // Validate search input
  const validateSearchInput = (input) => {
    if (!input.trim()) return 'Please enter a food item to search';
    return '';
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    const error = validateSearchInput(searchTerm);
    if (error) {
      setInputError(error);
      return;
    }
    setInputError('');
  };

  // Sort and filter food items
  const filteredItems = foodItems
    .filter(item => {
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
    })
    .sort((a, b) => {
      const aKey = getCategoryKey(a.category);
      const bKey = getCategoryKey(b.category);
      return categoryOrder.indexOf(aKey) - categoryOrder.indexOf(bKey);
    });

  // Image error handler
  const handleImageError = (e) => {
    e.target.src = '/placeholder.svg';
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
          .search-box:hover {
            animation: bulge 1.5s infinite ease-in-out;
          }
          .info-box:hover {
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
            .hostel-menu-title {
              font-size: 1.25rem; /* Smaller font size for mobile */
              line-height: 1.5rem;
              white-space: nowrap; /* Ensure single line */
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
          .food-card:hover {
            animation: bulge 1.5s infinite ease-in-out;
          }
          .check-now-button {
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
          }
          .check-now-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25), inset 0 -3px 5px rgba(0, 0, 0, 0.2), inset 0 3px 5px rgba(255, 255, 255, 0.4);
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .category-select-container {
            position: relative;
            width: 100%;
            max-width: 200px;
            margin-left: auto;
            margin-right: auto;
          }
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
            max-width: 100px;
            text-align: center;
            margin-left: auto;
            margin-right: auto;
            display: block;
            padding: 0 10px;
            box-shadow: inset 0 6px 12px rgba(0, 0, 0, 0.4), inset 0 -6px 12px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          .category-select option:hover {
            background-color: #f0f0f0 !important;
            color: #000000 !important;
          }
          .search-bar {
            box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 -4px 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .search-box {
            min-height: 180px;
          }
          .info-box {
            min-height: 160px;
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
        `}
      </style>
      <div className="flex justify-start items-center">
        <h2 className="text-3xl font-bold text-green-700 hostel-menu-title">Hostel Menu</h2>
      </div>
      <div 
        className="bg-gradient-to-r from-green-600 to-green-400 rounded-2xl p-6 shadow-lg text-black mb-6 transform transition-all duration-300 search-box"
        style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
      >
        <h1 className="text-2xl font-bold mb-2">Welcome to Menu Valley</h1>
        <p className="text-green-50 mb-6">Browse the hostel food menu with Menu Valley.</p>
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
              className="w-full p-2 bg-white/90 text-black font-bold border-gray-300 rounded focus:ring-2 focus:ring-green-300 category-select"
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
              className="ml-auto bg-green-500 text-white font-bold border-green-600 hover:bg-white hover:text-black check-now-button"
              style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
            >
              Check Now
            </Button>
          </div>
        </form>
      </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card 
            key={item.id} 
            className="transition-all duration-200 cursor-pointer transform food-card"
            style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}
          >
            <CardHeader className="pb-3">
              <div className="food-image-container">
                {item.image && typeof item.image === 'string' && item.image.startsWith('data:') ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="food-image"
                    onError={handleImageError}
                  />
                ) : (
                  <img
                    src="/placeholder.svg"
                    alt={item.name}
                    className="food-image"
                  />
                )}
              </div>
              <CardTitle className="text-lg mt-2">{item.name}</CardTitle>
              <div className="flex flex-wrap gap-1 mt-1">
                {(Array.isArray(item.category) ? item.category : [item.category]).map((cat, index) => (
                  <span
                    key={index}
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
            <CardContent>
              {/* No action buttons for students */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StudentFoodMenu;
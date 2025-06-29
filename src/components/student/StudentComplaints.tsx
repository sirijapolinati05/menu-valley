
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Complaint {
  id: string;
  meal: string;
  foodItem: string;
  complaint: string;
  date: Date;
  status: 'submitted' | 'reviewed' | 'resolved';
}

const StudentComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: '1',
      meal: 'Lunch',
      foodItem: 'Rice',
      complaint: 'The rice was undercooked and hard to eat.',
      date: new Date('2024-01-14'),
      status: 'reviewed'
    }
  ]);

  const [newComplaint, setNewComplaint] = useState({
    meal: '',
    foodItem: '',
    complaint: ''
  });

  const handleSubmitComplaint = () => {
    if (!newComplaint.meal || !newComplaint.foodItem || !newComplaint.complaint) {
      toast({
        title: "Please fill all fields",
        description: "All fields are required to submit a complaint.",
        variant: "destructive"
      });
      return;
    }

    const complaint: Complaint = {
      id: Date.now().toString(),
      meal: newComplaint.meal,
      foodItem: newComplaint.foodItem,
      complaint: newComplaint.complaint,
      date: new Date(),
      status: 'submitted'
    };

    setComplaints([complaint, ...complaints]);
    setNewComplaint({ meal: '', foodItem: '', complaint: '' });
    
    toast({
      title: "Complaint submitted successfully!",
      description: "Your complaint has been forwarded to the management team.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-green-700">Food Complaints</h2>
        <div className="text-sm text-gray-600">
          {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} submitted
        </div>
      </div>

      {/* Submit New Complaint */}
      <Card>
        <CardHeader>
          <CardTitle>Submit New Complaint</CardTitle>
          <CardDescription>
            Help us improve food quality by reporting any issues with meals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meal">Meal Type</Label>
              <Select value={newComplaint.meal} onValueChange={(value) => 
                setNewComplaint(prev => ({ ...prev, meal: value }))
              }>
                <SelectTrigger>
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
              <Input
                id="food-item"
                placeholder="e.g., Rice, Dosa, Sambar"
                value={newComplaint.foodItem}
                onChange={(e) => setNewComplaint(prev => ({ ...prev, foodItem: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="complaint">Complaint Details</Label>
            <Textarea
              id="complaint"
              placeholder="Describe the issue with the food (taste, temperature, quality, etc.)"
              value={newComplaint.complaint}
              onChange={(e) => setNewComplaint(prev => ({ ...prev, complaint: e.target.value }))}
              rows={4}
            />
          </div>
          
          <Button 
            onClick={handleSubmitComplaint}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Submit Complaint
          </Button>
        </CardContent>
      </Card>

      {/* Previous Complaints */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Your Previous Complaints</h3>
        
        {complaints.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No complaints submitted yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Use the form above to report any food-related issues.
              </p>
            </CardContent>
          </Card>
        ) : (
          complaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {complaint.foodItem} - {complaint.meal}
                    </CardTitle>
                    <CardDescription>
                      Submitted on {complaint.date.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(complaint.status)}>
                    {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{complaint.complaint}</p>
                
                {complaint.status === 'resolved' && (
                  <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400">
                    <p className="text-green-700 text-sm">
                      <strong>Management Response:</strong> Thank you for your feedback. 
                      We have addressed this issue with our kitchen staff and implemented 
                      measures to prevent similar occurrences.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentComplaints;

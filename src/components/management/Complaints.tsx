import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/integrations/firebase/client';
import { collection, getDocs, updateDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';

interface Complaint {
  id: string;
  studentName: string;
  contact: string;
  email: string;
  feesStatus: string;
  role: string;
  roomNumber: string;
  category: string;
  foodItem: string;
  complaint: string;
  date: string;
  status: 'submitted' | 'reviewed' | 'resolved';
  reply?: string;
}

const Complaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadComplaints = async () => {
    try {
      const complaintsRef = collection(db, 'complaints');
      const snapshot = await getDocs(complaintsRef);
      const currentDay = new Date().toDateString();
      const deletePromises: Promise<void>[] = [];
      const loadedComplaints: Complaint[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Complaint, 'id'>;
        const complaintDay = new Date(data.date).toDateString();
        if (complaintDay !== currentDay) {
          deletePromises.push(deleteDoc(docSnap.ref));
        } else {
          loadedComplaints.push({ id: docSnap.id, ...data });
        }
      });
      await Promise.all(deletePromises);
      setComplaints(loadedComplaints);
    } catch (error) {
      console.error('Failed to load complaints:', error);
    }
  };

  useEffect(() => {
    loadComplaints();
    const complaintsRef = collection(db, 'complaints');
    const unsubscribe = onSnapshot(complaintsRef, (snapshot) => {
      const updatedComplaints: Complaint[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];
      setComplaints(updatedComplaints);
    });
    return () => unsubscribe();
  }, []);

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

  const updateComplaintStatus = async (id: string, newStatus: 'submitted' | 'reviewed' | 'resolved') => {
    try {
      const complaintRef = doc(db, 'complaints', id);
      await updateDoc(complaintRef, { status: newStatus });
      setComplaints(complaints.map(complaint =>
        complaint.id === id ? { ...complaint, status: newStatus } : complaint
      ));
    } catch (error) {
      console.error('Failed to update complaint status:', error);
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedComplaint || !replyText.trim()) return;
    try {
      const complaintRef = doc(db, 'complaints', selectedComplaint.id);
      await updateDoc(complaintRef, { reply: replyText, status: 'resolved' });
      setComplaints(complaints.map(complaint =>
        complaint.id === selectedComplaint.id ? { ...complaint, reply: replyText, status: 'resolved' } : complaint
      ));
      setIsDialogOpen(false);
      setReplyText('');
      setSelectedComplaint(null);
    } catch (error) {
      console.error('Failed to submit reply:', error);
    }
  };

  const openReplyDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setReplyText(complaint.reply || '');
    setIsDialogOpen(true);
  };

  const groupedComplaints = complaints.reduce((acc, complaint) => {
    const key = complaint.foodItem;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(complaint);
    return acc;
  }, {} as Record<string, Complaint[]>);

  const sortedComplaints = [...complaints].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getStatusCounts = () => {
    const submitted = complaints.filter(c => c.status === 'submitted').length;
    const reviewed = complaints.filter(c => c.status === 'reviewed').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    return { submitted, reviewed, resolved };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6 py-2 px-2">
      <style>
        {`
          @keyframes float {
            0% {
              transform: translateY(0);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
            }
            50% {
              transform: translateY(-4px);
              box-shadow: 0 10px 16px rgba(0, 0, 0, 0.35), inset 0 -3px 5px rgba(0, 0, 0, 0.25), inset 0 3px 5px rgba(255, 255, 255, 0.5);
            }
            100% {
              transform: translateY(0);
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
            }
          }
          .prominent-card:hover {
            animation: float 1.5s infinite ease-in-out;
          }
          .food-card:hover {
            animation: float 1.5s infinite ease-in-out;
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
          .status-cards-grid {
            max-width: 75%; /* Increased width for desktop */
            justify-content: flex-start;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
          }
          @media (max-width: 640px) {
            .status-cards-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 0.5rem;
              max-width: 100%; /* Full width for mobile */
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
            .food-card {
              min-width: 100%;
              width: 100%;
            }
            .food-card .card-header {
              padding: 0.25rem 0.5rem;
            }
            .food-card .card-content {
              padding: 0.5rem;
            }
            .food-card .card-title {
              font-size: 0.75rem;
            }
            .food-card .card-description {
              font-size: 0.5rem;
            }
            .food-card .card-description-container {
              font-size: 0.5rem;
            }
            .food-card .complaint-text {
              font-size: 0.5rem;
              margin-bottom: 0.25rem;
            }
            .food-card .action-button-container {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
            }
            .food-card .status-action-buttons {
              display: flex;
              flex-direction: row;
              gap: 0.25rem;
            }
            .food-card .action-button {
              padding: 0.2rem;
              font-size: 0.45rem;
              height: 1.1rem;
              flex: 1;
            }
            .food-card .reply-button {
              width: 100%;
            }
            .category-button {
              padding: 0.05rem 0.25rem;
              font-size: 0.5rem;
              line-height: 1;
              border-radius: 0.25rem;
            }
            .category-button:hover {
              transform: scale(1.05);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15), inset 0 -1px 1px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.2);
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
          .action-button-container {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .action-button {
            flex: 1;
            background: linear-gradient(145deg, #f3f4f6, #d1d5db);
            border: 2px solid #9ca3af;
            border-radius: 0.375rem;
            padding: 0.5rem;
            font-size: 0.75rem;
            line-height: 1;
            height: 2rem;
            color: #1f2937;
            font-weight: 600;
            text-align: center;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4);
            transition: all 0.3s ease;
          }
          .action-button.reviewed-button:hover:not(:disabled) {
            transform: translateY(-4px);
            background: linear-gradient(145deg, #c71585, #db2777);
            color: #ffffff;
            box-shadow: 0 10px 16px rgba(0, 0, 0, 0.35), inset 0 -3px 5px rgba(0, 0, 0, 0.25), inset 0 3px 5px rgba(255, 255, 255, 0.5);
          }
          .action-button.resolved-button:hover:not(:disabled) {
            transform: translateY(-4px);
            background: linear-gradient(145deg, #7c3aed, #5b21b6);
            color: #ffffff;
            box-shadow: 0 10px 16px rgba(0, 0, 0, 0.35), inset 0 -3px 5px rgba(0, 0, 0, 0.25), inset 0 3px 5px rgba(255, 255, 255, 0.5);
          }
          .action-button.reply-button:hover:not(:disabled) {
            transform: translateY(-4px);
            background: linear-gradient(145deg, #2563eb, #1e40af);
            color: #ffffff;
            box-shadow: 0 10px 16px rgba(0, 0, 0, 0.35), inset 0 -3px 5px rgba(0, 0, 0, 0.25), inset 0 3px 5px rgba(255, 255, 255, 0.5);
          }
          .action-button:disabled {
            background: #e5e7eb;
            color: #9ca3af;
            cursor: not-allowed;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }
          .reply-text {
            margin-top: 0.5rem;
            padding: 0.5rem;
            background-color: #f3f4f6;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            color: #1f2937;
          }
        `}
      </style>
      <div className="flex justify-start items-center gap-4">
        <div className="pl-0">
          <h2 className="font-bold text-orange-700 text-[18px] md:text-[20px] ml-0">Student Complaints</h2>
        </div>
        <div className="text-sm text-gray-600">
          Total Complaints: {complaints.length}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 status-cards-grid mb-4">
        <Card className="text-center p-3 sm:p-4 bg-[#e0f7fa] border-2 border-gray-300 rounded-2xl shadow-lg shadow-gray-500/50 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer status-card submitted">
          <CardContent className="card-content">
            <div className="text-xl sm:text-2xl font-bold text-cyan-600 status-count">{statusCounts.submitted}</div>
            <p className="text-xs sm:text-sm text-gray-600 status-label">Submitted Complaints</p>
          </CardContent>
        </Card>
        <Card className="text-center p-3 sm:p-4 bg-[#f3e8ff] border-2 border-gray-300 rounded-2xl shadow-lg shadow-gray-500/50 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer status-card reviewed">
          <CardContent className="card-content">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 status-count">{statusCounts.reviewed}</div>
            <p className="text-xs sm:text-sm text-gray-600 status-label">Under Review</p>
          </CardContent>
        </Card>
        <Card className="text-center p-3 sm:p-4 bg-[#ecfdf5] border-2 border-gray-300 rounded-2xl shadow-lg shadow-gray-500/50 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer status-card resolved">
          <CardContent className="card-content">
            <div className="text-xl sm:text-2xl font-bold text-green-600 status-count">{statusCounts.resolved}</div>
            <p className="text-xs sm:text-sm text-gray-600 status-label">Resolved</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 justify-start">
        <Card className="w-full transition-all duration-300 cursor-pointer rounded-lg prominent-card bg-gray-100 border border-gray-200" style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}>
          <CardHeader className="py-2">
            <CardTitle className="text-lg">Most Complained Food Items</CardTitle>
            <CardDescription>Items with highest number of complaints</CardDescription>
          </CardHeader>
          <CardContent className="py-3 px-2">
            <div className="space-y-1">
              {Object.entries(groupedComplaints).length > 0 ? (
                Object.entries(groupedComplaints)
                  .sort(([, a], [, b]) => b.length - a.length)
                  .slice(0, 5)
                  .map(([foodItem, complaints]) => (
                    <div key={foodItem} className="p-2 bg-gray-50 rounded">
                      <span className="w-full bg-white rounded px-3 py-1 border border-gray-200 inset-item flex justify-between items-center">
                        <span className="font-medium">{foodItem}</span>
                        <Badge className="category-button food-item-badge">{complaints.length} complaints</Badge>
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500">No complaints data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Recent Complaints</h3>
        {complaints.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {sortedComplaints.map((complaint) => (
              <Card key={complaint.id} className="w-full transition-all duration-300 cursor-pointer rounded-lg food-card bg-gray-100 border border-gray-200" style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}>
                <CardHeader className="card-header pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="card-title text-base">
                        <span className="inline-block bg-white rounded px-2 py-1 border border-gray-200 inset-item">
                          {complaint.foodItem} - {complaint.category}
                        </span>
                      </CardTitle>
                      <CardDescription className="card-description">
                        <span className="flex items-center whitespace-nowrap card-description-container">
                          By {complaint.studentName} on {new Date(complaint.date).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(complaint.status)}>
                      {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="card-content px-4 py-2">
                  <p className="text-gray-700 complaint-text text-sm mb-3">{complaint.complaint}</p>
                  {complaint.reply && (
                    <p className="reply-text">Reply: {complaint.reply}</p>
                  )}
                  <div className="action-button-container">
                    <div className="status-action-buttons">
                      <Button
                        size="sm"
                        variant="outline"
                        className="action-button reviewed-button"
                        onClick={() => updateComplaintStatus(complaint.id, 'reviewed')}
                        disabled={complaint.status === 'reviewed' || complaint.status === 'resolved' || !!complaint.reply}
                      >
                        Mark as Reviewed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="action-button resolved-button"
                        onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                        disabled={complaint.status === 'resolved' || !!complaint.reply}
                      >
                        Mark as Resolved
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="action-button reply-button"
                      onClick={() => openReplyDialog(complaint)}
                      disabled={!!complaint.reply}
                    >
                      Reply to Student
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="w-full transition-all duration-300 cursor-pointer rounded-lg food-card bg-gray-100 border border-gray-200" style={{ boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.4)' }}>
            <CardContent className="card-content px-4 py-2 text-center">
              <p className="text-gray-500 complaint-text text-sm">No complaints found.</p>
            </CardContent>
          </Card>
        )}
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to {selectedComplaint?.studentName}'s Complaint</DialogTitle>
          </DialogHeader>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Enter your reply here..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReplySubmit}
              disabled={!replyText.trim()}
            >
              Submit Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Complaints;
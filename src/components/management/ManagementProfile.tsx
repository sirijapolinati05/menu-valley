import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ExcelJS from 'exceljs';
import { db } from '@/integrations/firebase/client';
import { collection, writeBatch, doc, query, where, getDocs, getDoc, Timestamp } from 'firebase/firestore';

interface ExcelData {
  [key: string]: string;
}

interface DayMenu {
  breakfast: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
  others: string[];
}

interface UserProfile {
  admin: string;
  contactnumber: string;
  department: string;
  email: string;
  fullname: string;
  gender: string;
  joiningdate: string;
  managementid: string;
  managementpassword: string;
  managementusername: string;
  role: string;
}

interface ManagementProfileProps {
  userInfo: any;
  setExcelData?: (data: ExcelData[]) => void;
}

const ManagementProfile = ({ userInfo, setExcelData }: ManagementProfileProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('Choose File');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isFileSubmitted, setIsFileSubmitted] = useState<boolean>(false);
  const [fileBlobs, setFileBlobs] = useState<{ [key: string]: Blob }>({});
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState({
    totalVotes: 0,
    menuItems: 0,
    complaints: 3,
  });
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!userInfo?.email) {
      console.warn('ManagementProfile: userInfo.email is undefined');
      setError('User email not provided. Please log in again.');
      return;
    }

    console.log('ManagementProfile: Fetching data for email:', userInfo.email);

    const fetchUserProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', userInfo.email);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setProfileData(userData);
          console.log('ManagementProfile: Fetched user profile from Firestore:', userData);
        } else {
          const userQuery = query(
            collection(db, 'users'),
            where('email', '==', userInfo.email)
          );
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data() as UserProfile;
            setProfileData(userData);
            console.log('ManagementProfile: Fetched user profile via query:', userData);
          } else {
            console.warn('ManagementProfile: No user profile found for email:', userInfo.email);
            setError('User profile not found in Firestore.');
          }
        }
      } catch (err) {
        console.error('ManagementProfile: Error fetching user profile from Firestore:', err);
        setError('Failed to load user profile. Please check Firestore permissions or data.');
      }
    };

    const fetchUploadedFiles = async () => {
      try {
        const filesQuery = query(
          collection(db, 'uploaded_files'),
          where('uploadedBy', '==', userInfo.email)
        );
        const filesSnapshot = await getDocs(filesQuery);
        const fileNames = filesSnapshot.docs.map(doc => doc.data().fileName);
        setUploadedFiles(fileNames);
        setIsFileSubmitted(fileNames.length > 0);
        localStorage.setItem(`uploadedExcelFiles_${userInfo.email}`, JSON.stringify(fileNames));
        console.log('ManagementProfile: Fetched uploaded files from Firestore:', fileNames);

        const storedData = localStorage.getItem(`excelData_${userInfo.email}`);
        if (storedData && typeof setExcelData === 'function') {
          try {
            const parsedData = JSON.parse(storedData);
            setExcelData(parsedData);
            console.log('ManagementProfile: Loaded excelData from localStorage:', parsedData);
          } catch (e) {
            console.error('ManagementProfile: Failed to parse excelData from localStorage:', e);
          }
        }
      } catch (err) {
        console.error('ManagementProfile: Error fetching uploaded files from Firestore:', err);
        setError('Failed to load uploaded files.');
        const storedFiles = localStorage.getItem(`uploadedExcelFiles_${userInfo.email}`);
        if (storedFiles) {
          try {
            const parsedFiles = JSON.parse(storedFiles);
            setUploadedFiles(parsedFiles);
            setIsFileSubmitted(parsedFiles.length > 0);
            console.log('ManagementProfile: Loaded uploadedFiles from localStorage:', parsedFiles);
          } catch (e) {
            console.error('ManagementProfile: Failed to parse uploadedFiles from localStorage:', e);
          }
        }
      }
    };

    const fetchTodayData = async () => {
      try {
        const today = new Date();
        const dateKey = today.toDateString();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const votesQuery = query(
          collection(db, `weekly_menus/${dateKey}/votes`),
          where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
          where('timestamp', '<=', Timestamp.fromDate(endOfDay))
        );
        const votesSnapshot = await getDocs(votesQuery);
        const uniqueVoters = new Set<string>();
        votesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.studentId) {
            uniqueVoters.add(data.studentId);
          }
        });

        let menuItemsCount = 0;
        try {
          const menuDocRef = doc(db, `weekly_menus/${dateKey}`);
          const menuDoc = await getDoc(menuDocRef);
          if (menuDoc.exists()) {
            const menuData = menuDoc.data() as DayMenu;
            const allItems = [
              ...(menuData.breakfast || []),
              ...(menuData.lunch || []),
              ...(menuData.snacks || []),
              ...(menuData.dinner || []),
            ];
            menuItemsCount = new Set(allItems).size;
            console.log('ManagementProfile: Menu items:', allItems, 'Unique count:', menuItemsCount);
          } else {
            const savedMenus = localStorage.getItem('weekly_menus');
            if (savedMenus && savedMenus !== 'undefined' && savedMenus !== 'null') {
              const parsedMenus = JSON.parse(savedMenus);
              if (parsedMenus[dateKey]) {
                const menuData = parsedMenus[dateKey] as DayMenu;
                const allItems = [
                  ...(menuData.breakfast || []),
                  ...(menuData.lunch || []),
                  ...(menuData.snacks || []),
                  ...(menuData.dinner || []),
                ];
                menuItemsCount = new Set(allItems).size;
                console.log('ManagementProfile: Menu items from localStorage:', allItems, 'Unique count:', menuItemsCount);
              }
            }
          }
        } catch (menuErr) {
          console.error('ManagementProfile: Error fetching menu from Firestore:', menuErr);
          const savedMenus = localStorage.getItem('weekly_menus');
          if (savedMenus && savedMenus !== 'undefined' && savedMenus !== 'null') {
            const parsedMenus = JSON.parse(savedMenus);
            if (parsedMenus[dateKey]) {
              const menuData = parsedMenus[dateKey] as DayMenu;
              const allItems = [
                ...(menuData.breakfast || []),
                ...(menuData.lunch || []),
                ...(menuData.snacks || []),
                ...(menuData.dinner || []),
              ];
              menuItemsCount = new Set(allItems).size;
              console.log('ManagementProfile: Menu items from localStorage (fallback):', allItems, 'Unique count:', menuItemsCount);
            }
          }
        }

        setTodayStats((prev) => ({
          ...prev,
          totalVotes: uniqueVoters.size,
          menuItems: menuItemsCount,
        }));
        console.log('ManagementProfile: Unique voters today:', uniqueVoters.size);
        console.log('ManagementProfile: Today menu items count:', menuItemsCount);
      } catch (err) {
        console.error('ManagementProfile: Error fetching data from Firestore:', err);
        setError('Failed to fetch voting or menu data.');
      }
    };

    fetchUserProfile();
    fetchUploadedFiles();
    fetchTodayData();
  }, [userInfo?.email]);

  useEffect(() => {
    if (userInfo?.email) {
      localStorage.setItem(`uploadedExcelFiles_${userInfo.email}`, JSON.stringify(uploadedFiles));
      localStorage.setItem(`isFileSubmitted_${userInfo.email}`, JSON.stringify(isFileSubmitted));
      console.log('ManagementProfile: Updated localStorage - uploadedFiles:', uploadedFiles, 'isFileSubmitted:', isFileSubmitted);
    }
  }, [uploadedFiles, isFileSubmitted, userInfo?.email]);

  const isValidExcelFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExtensions = ['.xls', '.xlsx'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
  };

  const parseExcelFile = async (file: File): Promise<ExcelData[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = new ExcelJS.Workbook();
          const buffer = e.target?.result as ArrayBuffer;
          await workbook.xlsx.load(buffer);
          const worksheet = workbook.worksheets[0];
          const jsonData: any[][] = [];
          worksheet.eachRow((row, rowNumber) => {
            jsonData.push(row.values.slice(1));
          });
          console.log('ManagementProfile: Raw Excel data:', jsonData);
          const headers = jsonData[0].map((h: any) =>
            h ? h.toString().trim().toLowerCase().replace(/\s+/g, '') : ''
          );
          console.log('ManagementProfile: Excel headers:', headers);
          const emailIndex = headers.findIndex(h => h === 'studentemail');
          const passwordIndex = headers.findIndex(h => h === 'studentpassword');
          if (emailIndex === -1 || passwordIndex === -1) {
            alert('Excel file must contain "studentemail" and "studentpassword" columns. Found: ' + headers.join(', '));
            console.log('ManagementProfile: Missing required columns. Expected: "studentemail", "studentpassword". Found:', headers);
            resolve([]);
            return;
          }
          const parsedData = jsonData.slice(1)
            .filter((row) => row[emailIndex] && row[passwordIndex])
            .map((row) => {
              const rowData: ExcelData = {};
              headers.forEach((header: string, index: number) => {
                if (header && row[index]) {
                  rowData[header] = row[index].toString().trim();
                }
              });
              return rowData;
            });
          console.log('ManagementProfile: Parsed Excel data (all columns):', parsedData);
          if (parsedData.length === 0) {
            alert('No valid data rows found in the Excel file.');
            console.log('ManagementProfile: No valid data rows found after parsing');
          }
          resolve(parsedData);
        } catch (e) {
          console.error('ManagementProfile: Error parsing Excel file:', e);
          alert('Failed to parse Excel file. Please ensure it is a valid .xlsx file with correct columns.');
          resolve([]);
        }
      };
      reader.onerror = (e) => {
        console.error('ManagementProfile: FileReader error:', e);
        alert('Error reading Excel file. Please try again.');
        resolve([]);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const checkDuplicateEmails = async (emails: string[]): Promise<string[]> => {
    const duplicates: string[] = [];
    for (let i = 0; i < emails.length; i += 10) {
      const batchEmails = emails.slice(i, i + 10);
      try {
        const q = query(
          collection(db, 'students'),
          where('studentemail', 'in', batchEmails)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          const email = doc.data().studentemail;
          if (!duplicates.includes(email)) {
            duplicates.push(email);
          }
        });
      } catch (err) {
        console.error('ManagementProfile: Error checking duplicate emails:', err);
        throw new Error('Failed to check for duplicate emails.');
      }
    }
    return duplicates;
  };

  const getExistingFirestoreData = async (emails: string[]): Promise<{ [email: string]: any }> => {
    const existingData: { [email: string]: any } = {};
    for (let i = 0; i < emails.length; i += 10) {
      const batchEmails = emails.slice(i, i + 10);
      try {
        const q = query(
          collection(db, 'students'),
          where('studentemail', 'in', batchEmails)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          existingData[doc.data().studentemail] = doc.data();
        });
      } catch (err) {
        console.error('ManagementProfile: Error fetching existing Firestore data:', err);
        throw new Error('Failed to fetch existing Firestore data.');
      }
    }
    return existingData;
  };

  const hasDataChanged = (newData: ExcelData, existingData: any): boolean => {
    for (const key in newData) {
      if (key !== 'studentemail' && newData[key] !== existingData[key]) {
        return true;
      }
    }
    return false;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('ManagementProfile: File selected:', file.name);
      if (isValidExcelFile(file)) {
        setSelectedFile(file);
        setSelectedFileName(file.name);
        setFileBlobs((prev) => ({ ...prev, [file.name]: file }));
        const parsedData = await parseExcelFile(file);
        if (parsedData.length > 0) {
          if (typeof setExcelData === 'function') {
            setExcelData(parsedData);
          }
          localStorage.setItem(`excelData_${userInfo.email}`, JSON.stringify(parsedData));
          console.log('ManagementProfile: Saved excelData to localStorage:', parsedData);
        } else {
          setSelectedFile(null);
          setSelectedFileName('Choose File');
          localStorage.removeItem(`excelData_${userInfo.email}`);
          console.log('ManagementProfile: Cleared excelData in localStorage due to invalid file');
        }
      } else {
        alert('Please upload a valid Excel file (.xls or .xlsx)');
        setSelectedFile(null);
        setSelectedFileName('Choose File');
        localStorage.removeItem(`excelData_${userInfo.email}`);
        console.log('ManagementProfile: Cleared excelData in localStorage due to invalid file type');
      }
    } else {
      console.log('ManagementProfile: No file selected');
      setSelectedFileName('Choose File');
    }
  };

  const handleSubmit = async () => {
    if (selectedFile && userInfo?.email) {
      console.log('ManagementProfile: Submitting file:', selectedFile.name);
      if (!editingFileName && uploadedFiles.includes(selectedFile.name)) {
        alert('This Excel sheet data is already in Firebase.');
        setError('This Excel sheet data is already in Firebase.');
        return;
      }
      setError(null);
      try {
        const parsedData = await parseExcelFile(selectedFile);
        if (parsedData.length === 0) {
          setUploadedFiles((prev) => prev.filter((name) => name !== selectedFile.name));
          setIsFileSubmitted(uploadedFiles.length > 1);
          setSelectedFileName('Choose File');
          localStorage.removeItem(`excelData_${userInfo.email}`);
          alert('No valid data found in the Excel file.');
          setError('No valid data found in the Excel file.');
          return;
        }

        const emails = parsedData.map((data) => data.studentemail).filter(Boolean);
        const existingData = await getExistingFirestoreData(emails);

        const batch = writeBatch(db);
        const collectionRef = collection(db, 'users');
        const recordsToUpdate: ExcelData[] = [];
        for (const data of parsedData) {
          if (!data.studentemail) continue;
          const existingRecord = existingData[data.studentemail];
          if (!existingRecord) {
            const docRef = doc(collectionRef, data.studentemail);
            batch.set(docRef, {
              ...data,
              uploadedBy: userInfo.email,
              timestamp: new Date().toISOString(),
            });
            recordsToUpdate.push(data);
          } else if (hasDataChanged(data, existingRecord)) {
            const docRef = doc(collectionRef, data.studentemail);
            batch.set(docRef, {
              ...data,
              uploadedBy: userInfo.email,
              timestamp: new Date().toISOString(),
            }, { merge: true });
            recordsToUpdate.push(data);
          }
        }

        if (recordsToUpdate.length === 0) {
          console.log('ManagementProfile: No new or updated data to sync.');
          alert('No new or updated data to sync.');
          setError('No new or updated data to sync.');
          setSelectedFileName('Choose File');
          return;
        }

        const fileDocRef = doc(db, 'uploaded_files', selectedFile.name);
        batch.set(fileDocRef, {
          fileName: selectedFile.name,
          uploadedBy: userInfo.email,
          timestamp: new Date().toISOString(),
        });

        await batch.commit();
        console.log('ManagementProfile: Data synced to Firestore:', recordsToUpdate);
        console.log('ManagementProfile: File metadata saved to Firestore:', selectedFile.name);

        if (!editingFileName) {
          setUploadedFiles((prev) => [...new Set([...prev, selectedFile.name])]);
          setIsFileSubmitted(true);
        }
        if (typeof setExcelData === 'function') {
          setExcelData(parsedData);
        }
        localStorage.setItem(`excelData_${userInfo.email}`, JSON.stringify(parsedData));
        localStorage.setItem(`uploadedExcelFiles_${userInfo.email}`, JSON.stringify([...new Set([...uploadedFiles, selectedFile.name])]));
        console.log('ManagementProfile: Saved excelData to localStorage:', parsedData);
        alert('File uploaded and synced to Firestore successfully');
        setSelectedFileName('Choose File');
      } catch (err) {
        console.error('ManagementProfile: Error syncing to Firestore:', err);
        setError('Failed to sync data to Firestore. Please try again.');
        alert('Failed to sync data to Firestore. Please try again.');
        setSelectedFileName('Choose File');
        return;
      }

      const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      setSelectedFile(null);
    } else {
      alert('Please select an Excel file first');
      setError('No file selected.');
      console.log('ManagementProfile: Submit clicked but no file selected');
      setSelectedFileName('Choose File');
    }
  };

  const handleEdit = async (fileName: string) => {
    console.log('ManagementProfile: Editing file:', fileName);
    setEditingFileName(fileName);
    const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
      fileInput.onchange = async (event: Event) => {
        const newFile = (event.target as HTMLInputElement).files?.[0];
        if (newFile && isValidExcelFile(newFile)) {
          console.log('ManagementProfile: Replacing with new file:', newFile.name);
          if (!editingFileName && uploadedFiles.includes(newFile.name)) {
            alert('This Excel sheet data is already in Firebase.');
            setError('This Excel sheet data is already in Firebase.');
            setEditingFileName(null);
            setSelectedFileName('Choose File');
            fileInput.value = '';
            return;
          }
          const parsedData = await parseExcelFile(newFile);
          if (parsedData.length > 0) {
            try {
              const emails = parsedData.map((data) => data.studentemail).filter(Boolean);
              const existingData = await getExistingFirestoreData(emails);

              const batch = writeBatch(db);
              const collectionRef = collection(db, 'users');
              const recordsToUpdate: ExcelData[] = [];
              for (const data of parsedData) {
                if (!data.studentemail) continue;
                const existingRecord = existingData[data.studentemail];
                if (!existingRecord) {
                  const docRef = doc(collectionRef, data.studentemail);
                  batch.set(docRef, {
                    ...data,
                    uploadedBy: userInfo.email,
                    timestamp: new Date().toISOString(),
                  });
                  recordsToUpdate.push(data);
                } else if (hasDataChanged(data, existingRecord)) {
                  const docRef = doc(collectionRef, data.studentemail);
                  batch.set(docRef, {
                    ...data,
                    uploadedBy: userInfo.email,
                    timestamp: new Date().toISOString(),
                  }, { merge: true });
                  recordsToUpdate.push(data);
                }
              }

              if (recordsToUpdate.length === 0) {
                console.log('ManagementProfile: No new or updated data to sync.');
                alert('No new or updated data to sync.');
                setError('No new or updated data to sync.');
                setEditingFileName(null);
                setSelectedFileName('Choose File');
                fileInput.value = '';
                return;
              }

              const fileDocRef = doc(db, 'uploaded_files', newFile.name);
              batch.set(fileDocRef, {
                fileName: newFile.name,
                uploadedBy: userInfo.email,
                timestamp: new Date().toISOString(),
              });

              if (fileName !== newFile.name) {
                const oldFileDocRef = doc(db, 'uploaded_files', fileName);
                batch.delete(oldFileDocRef);
              }

              await batch.commit();
              console.log('ManagementProfile: Edited data synced to Firestore:', recordsToUpdate);
              console.log('ManagementProfile: Updated file metadata in Firestore:', newFile.name);

              setFileBlobs((prev) => {
                const { [fileName]: _, ...rest } = prev;
                return { ...rest, [newFile.name]: newFile };
              });
              setUploadedFiles((prev) =>
                prev.map((name) => (name === fileName ? newFile.name : name))
              );
              if (typeof setExcelData === 'function') {
                setExcelData(parsedData);
              }
              localStorage.setItem(`excelData_${userInfo.email}`, JSON.stringify(parsedData));
              localStorage.setItem(`uploadedExcelFiles_${userInfo.email}`, JSON.stringify(uploadedFiles.map((name) => (name === fileName ? newFile.name : name))));
              console.log('ManagementProfile: Saved excelData to localStorage:', parsedData);
              setIsFileSubmitted(true);
              setEditingFileName(null);
              setSelectedFile(null);
              setSelectedFileName('Choose File');
              fileInput.value = '';
              alert('File replaced and synced to Firestore successfully');
            } catch (err) {
              console.error('ManagementProfile: Error syncing edited data to Firestore:', err);
              setError('Failed to sync edited data to Firestore. Please try again.');
              alert('Failed to sync edited data to Firestore. Please try again.');
              setEditingFileName(null);
              setSelectedFileName('Choose File');
              fileInput.value = '';
            }
          } else {
            alert('No valid data found in the Excel file.');
            setError('No valid data found in the Excel file.');
            setSelectedFileName('Choose File');
            localStorage.removeItem(`excelData_${userInfo.email}`);
            console.log('ManagementProfile: Cleared excelData in localStorage due to invalid file');
            setEditingFileName(null);
            fileInput.value = '';
          }
        } else {
          alert('Please upload a valid Excel file (.xls or .xlsx)');
          setError('Invalid file type.');
          setSelectedFileName('Choose File');
          localStorage.removeItem(`excelData_${userInfo.email}`);
          console.log('ManagementProfile: Cleared excelData in localStorage due to invalid file type');
          setEditingFileName(null);
          fileInput.value = '';
        }
      };
    }
  };

  const handleDownload = (fileName: string) => {
    console.log('ManagementProfile: Downloading file:', fileName);
    const file = fileBlobs[fileName];
    if (file) {
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('File not found for download.');
      setError('File not found for download.');
    }
  };

  if (!userInfo?.email) {
    console.log('ManagementProfile: Redirecting to /login due to undefined userInfo.email');
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      <style>
        {`
          .quick-actions-card {
            perspective: 1000px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            transform-style: preserve-3d;
            border: 2px solid #d1d5db;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
          }
          .quick-actions-card:hover {
            transform: translateY(-8px) rotateX(5deg) rotateY(5deg);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
            cursor: pointer;
          }
          .upload-excel-box {
            box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 -4px 8px rgba(0, 0, 0, 0.15);
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            background: #e5e7eb;
            transform: scale(0.95);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            padding: 0.5rem;
          }
          .upload-excel-box:hover {
            box-shadow: inset 0 6px 12px rgba(0, 0, 0, 0.2), inset 0 -6px 12px rgba(0, 0, 0, 0.2);
            transform: scale(0.97);
          }
          .file-input-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: #1f2937;
            cursor: pointer;
            padding: 0.3rem 1rem;
            border-radius: 0.375rem;
            background: #d1d5db;
            box-shadow: 0 4px 12px #4b5563, 0 2px 6px #4b5563;
            transform: translateY(-2px) scale(1.02);
            transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          }
          .file-input-label:hover {
            background: #e5e7eb;
            transform: translateY(-4px) scale(1.03);
            box-shadow: 0 6px 16px #4b5563, 0 3px 8px #4b5563;
          }
          .file-input-label:active {
            transform: translateY(0) scale(1);
            box-shadow: 0 2px 8px #4b5563;
          }
          .file-input-hidden {
            display: none;
          }
          .submit-button {
            font-size: 0.75rem;
            font-weight: 500;
            color: #ffffff;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            background: #f97316;
            box-shadow: 0 4px 12px #4b5563, 0 2px 6px #4b5563;
            transform: translateY(-2px) scale(1.02);
            transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          }
          .submit-button:hover {
            background: #ea580c;
            transform: translateY(-4px) scale(1.03);
            box-shadow: 0 6px 16px #4b5563, 0 3px 8px #4b5563;
          }
          .submit-button:active {
            transform: translateY(0) scale(1);
            box-shadow: 0 2px 8px #4b5563;
          }
          .submit-button:disabled {
            background: #fb923c;
            cursor: not-allowed;
            transform: translateY(0) scale(1);
            box-shadow: 0 2px 8px #4b5563;
          }
          @media (max-width: 640px) {
            .quick-actions-card {
              min-width: 0;
              padding: 0.5rem;
            }
            .upload-excel-box {
              padding: 0.5rem;
            }
            .file-input-label {
              padding: 0.3rem 0.8rem;
              font-size: 0.75rem;
            }
            .submit-button {
              padding: 0.4rem 0.8rem;
              font-size: 0.7rem;
            }
          }
        `}
      </style>
      <h2 className="text-[18px] md:text-[20px] font-bold text-orange-700">Profile</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="w-full max-w-4xl md:max-w-4xl p-4 lg:p-6 border-2 border-gray-300 shadow-lg shadow-gray-500/50 transform hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your account details and role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 lg:space-y-4">
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-base lg:text-lg">{profileData?.fullname || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Email</label>
                <p className="text-base lg:text-lg">{profileData?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Role</label>
                <div className="flex items-center gap-2">
                  <p className="text-base lg:text-lg">{profileData?.role || 'N/A'}</p>
                  {profileData?.admin === 'yes' ? (
                    <Badge className="bg-orange-200 text-orange-800 hover:bg-orange-300 shadow-md rounded-lg transform hover:scale-110 hover:shadow-lg transition-all duration-200 cursor-pointer">
                      Admin
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-200 text-yellow-800 hover:bg-yellow-300 shadow-md rounded-lg transform hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer">
                      Non-Admin
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Department</label>
                <p className="text-base lg:text-lg">{profileData?.department || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Contact Number</label>
                <p className="text-base lg:text-lg">{profileData?.contactnumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Joined</label>
                <p className="text-base lg:text-lg">{profileData?.joiningdate || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Management ID</label>
                <p className="text-base lg:text-lg">{profileData?.managementid || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs lg:text-sm font-medium text-gray-600">Username</label>
                <p className="text-base lg:text-lg">{profileData?.managementusername || 'N/A'}</p>
              </div>
              {uploadedFiles.length > 0 && (
                <div>
                  <label className="text-xs lg:text-sm font-medium text-gray-600">Uploaded Excel Files</label>
                  <p className="text-base lg:text-lg">{uploadedFiles.map(name => name.replace(/\.[^/.]+$/, '')).join(', ')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="mt-6">
            <h3 className="text-xl font-semibold">Today's Overview</h3>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 lg:p-6 bg-green-50 border-2 border-gray-300 rounded-2xl shadow-lg shadow-gray-500/50 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="text-xl lg:text-2xl font-bold text-green-600">{todayStats.totalVotes}</div>
                  <p className="text-xs lg:text-sm text-gray-600">Unique Voters</p>
                </div>
                <div className="text-center p-3 lg:p-6 bg-purple-50 border-2 border-gray-300 rounded-2xl shadow-lg shadow-gray-500/50 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="text-xl lg:text-2xl font-bold text-purple-600">{todayStats.menuItems}</div>
                  <p className="text-xs lg:text-sm text-gray-600">Today Menu Items</p>
                </div>
                <div className="text-center p-3 lg:p-6 bg-cyan-100 border-2 border-gray-300 rounded-2xl shadow-lg shadow-gray-500/50 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="text-xl lg:text-2xl font-bold text-cyan-600">{todayStats.complaints}</div>
                  <p className="text-xs lg:text-sm text-gray-600">New Complaints</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {profileData?.admin === 'yes' && (
        <Card className="w-full max-w-md mx-auto quick-actions-card">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Frequently used management functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="h-20 flex flex-col justify-between p-2 upload-excel-box">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="excel-upload" className="font-medium">Upload Excel</Label>
                  <label className="file-input-label">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    {selectedFileName}
                    <Input
                      id="excel-upload"
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={handleFileUpload}
                      className="file-input-hidden"
                    />
                  </label>
                </div>
              </div>
              <div className="flex justify-center mt-4">
                {!isFileSubmitted || uploadedFiles.length < 3 ? (
                  <Button
                    variant="outline"
                    className="w-24 text-xs py-1 h-7 submit-button"
                    onClick={handleSubmit}
                    disabled={!selectedFile}
                  >
                    Submit
                  </Button>
                ) : (
                  <p className="text-sm text-gray-600">Maximum 3 files uploaded</p>
                )}
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </CardContent>
        </Card>
      )}
      {isFileSubmitted && uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Excel Sheets</CardTitle>
            <CardDescription>Manage your student Excel files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex flex-wrap gap-4 ${uploadedFiles.length === 1 ? 'justify-center' : 'justify-start'}`}>
              {uploadedFiles.map((fileName) => (
                <div
                  key={fileName}
                  className="w-full max-w-[10rem] p-3 bg-gray-100 rounded-lg flex flex-col items-center justify-center"
                >
                  <p className="text-sm font-medium text-gray-600 truncate w-full text-center mb-2">
                    {fileName.replace(/\.[^/.]+$/, '')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md px-1.5 py-0.5 text-xs"
                      onClick={() => handleEdit(fileName)}
                      title="Edit Sheet"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white border border-red-300 hover:bg-red-100 text-red-700 rounded-md px-1.5 py-0.5 text-xs"
                      onClick={() => handleDelete(fileName)}
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-2 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2l-2-12"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                      </svg>
                    </Button>
                    <button
                      className="bg-white border border-blue-300 hover:bg-blue-100 text-blue-700 rounded-md px-1.5 py-0.5 text-xs"
                      onClick={() => handleDownload(fileName)}
                      title="Download"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManagementProfile;
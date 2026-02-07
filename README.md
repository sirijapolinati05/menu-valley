# 🍽️ Menu Valley – Smart Hostel Food Management System

🔗 **Live Demo:** https://hostelapp-6b14e.web.app/


**Menu Valley** is an advanced web-based hostel food management system developed for **Shri Vishnu Engineering College for Women**.  
It connects **Hostel Management** and **Students** through a smart platform for **food menu planning, voting, and complaint handling** to significantly **reduce food wastage** and **improve meal quality**.

---

## 🎯 Project Objective

Traditional hostel mess systems prepare food without knowing student preferences, leading to:
- Food wastage
- Student dissatisfaction
- Poor meal planning

**Menu Valley solves this** by allowing students to vote for meals and management to plan menus based on real-time data.

---

## 👥 User Roles & Responsibilities

### 🧑‍💼 Management Portal
- Add / Edit / Delete food items
- Upload food images
- Plan Today's Menu
- Plan Weekly Menu
- Track student votes live
- View and respond to complaints
- Upload student credentials via Excel
- View daily statistics
- Manage profile

### 🎓 Student Portal
- View full food menu
- Search food by name/category
- Vote for today's meals
- Vote for weekly meals
- Submit complaints
- Track complaint status
- View personal profile & activity

---

## 🧩 System Architecture (Contexts)

| Context | Purpose |
|---|---|
| AuthContext | Login, logout, session persistence |
| FoodContext | Food items storage using IndexedDB (Dexie) |
| ExcelDataContext | Share student Excel data across components |

---

## 🔐 Authentication Flow

- **Management Login** → `users` collection
- **Student Login** → `students` collection
- Role-based redirection:
  - Management → `/management`
  - Student → `/dashboard`
- Session stored in local storage (`hostel_user`)

---

## 🛠️ Tech Stack

- React + TypeScript
- Firebase Authentication
- Firebase Firestore (real-time)
- Dexie.js (IndexedDB for PWA/offline)
- Tailwind CSS + Shadcn UI
- ExcelJS (student upload)
- Lucide Icons

---

## 🗃️ Firestore Database Design

| Collection | Purpose |
|---|---|
| users | Management credentials |
| students | Student credentials |
| weekly_menus | Votes for daily & weekly menu |
| complaints | Student complaints |
| uploaded_files | Excel file metadata |

---

## 🧱 Major Modules

### 🔑 Login Section
Dual login for management and students with Firestore validation and role routing.

### 🧑‍💼 Management Dashboard
- Food Menu (CRUD + drag reorder)
- Today's Menu (live votes & complaints)
- Weekly Calendar planning
- Complaints handling & reply
- Profile with Excel upload & stats

### 🎓 Student Dashboard
- Food Menu with search & filter
- Today's voting with absence options
- Weekly voting calendar
- Complaint submission & tracking
- Profile page

---

## 🍲 Food Menu Features

- Add food with image, category, description
- Drag & drop reordering
- Search and category filtering
- Image validation & preview
- Stored in IndexedDB for offline access

---

## 🗳️ Voting System

### Today's Voting
- Vote per category
- Special "Others" options (outing / absent)
- Real-time vote count display

### Weekly Voting
- Vote/edit vote for each day
- One vote per category per day
- Firestore live sync

---

## 📝 Complaint System

- Students submit complaints per food item
- Prevent duplicate complaints
- Management can:
  - Mark Reviewed
  - Mark Resolved
  - Reply to student
- Live status updates

---

## 📊 Management Statistics

- Unique voters count
- Menu items count
- Complaint summary
- Top complained food items

---

## 📥 Excel Upload System (Admin)

- Upload `.xlsx` file with student data
- Required columns: `studentemail`, `studentpassword`
- Duplicate email detection
- Batch Firestore updates
- File edit/download support

---

## 💾 Offline Support (PWA Ready)

- Food items stored in IndexedDB
- Persistent storage request
- Works even without internet

---

## 📱 Responsive UI

- Desktop → Sidebar navigation
- Mobile → Bottom navigation
- Animated cards, gradients, shadows

---

## ⚙️ Installation

```bash
git clone <repo-url>
cd menu-valley
npm install
npm run dev

# High School Class Scheduler

## Overview  
This full-stack web app allows high school students to create, save, and manage multi-year academic plans while enabling school administrators to view and annotate those plans. The platform helps students map out their coursework across all four years of high school, track graduation requirements in real-time, and explore alternative schedules (e.g., “Plan A”, “Plan B”). Admins can view all student schedules and provide feedback through annotations.

## Implementation  
The frontend was developed using **React** and styled with **Tailwind CSS**, while the backend is powered by **Express.js** and uses **SQLite** for data persistence. Authentication is handled via **Google OAuth** using **Passport.js**.

### Frontend (React)  
- Built with **React** and **Tailwind CSS**
- Students can select courses to populate their schedule for each year  
- Users can view all saved schedules and toggle between different plans  
- Admins can log in and view schedules from all users, adding annotations to highlight issues or offer suggestions  

### Backend (Node.js with Express)  
- Uses **Express.js** for routing and API endpoints  
- Integrated **Passport.js** for Google OAuth login and session management  
- Role-based access control restricts admin functionality to specific authorized users  
- **SQLite** database schema includes tables for users, classes, requirements, plans, and plan-specific courses  

### Features  
- **Student Dashboard**: View and edit multiple saved four-year plans  
- **Admin Panel**: View and annotate student plans to help with course corrections   
- **Google OAuth Authentication**: Secure login using school-linked Google accounts  
- **Plan Versioning**: Students can maintain alternate schedules under different names (e.g., “Plan A”, “Plan B”)  
- **Responsive Design**: Fully styled with **Tailwind CSS** for mobile and desktop usability  

## Technologies Used  
- **Frontend**: React, Tailwind CSS  
- **Backend**: Node.js, Express.js, Passport.js (Google OAuth), SQLite  
- **Authentication**: Google OAuth with Passport.js  
- **Version Control**: Git, GitHub  

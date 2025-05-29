# Scheduling App

## Overview
This web app allows users to create, manage, and save four-year class schedules for high school students. Students can plan their classes over four years, track credit fulfillment in real time, and save multiple plans for comparison. Admins can view all student schedules and provide annotations to flag conflicts or suggest improvements.

## Implementation
The frontend of this app is built with **React** and **Tailwind CSS**. The backend is implemented in **Node.js** with **Express** and uses **PostgreSQL** for data storage. User authentication is handled via **Google OAuth**, supporting both students and admin roles with different access privileges.

### Frontend (React + Tailwind CSS):
- React components and hooks provide dynamic schedule creation and editing.
- Tailwind CSS and Material UI components.
- Users can create multiple plans, see credit requirements update in real time, and view saved schedules.
- Admins have access to view all schedules and annotate them with feedback or conflict warnings.

### Backend (Node.js + Express + PostgreSQL):
- REST API endpoints manage users, class schedules, plans, and annotations.
- PostgreSQL stores user profiles, class data, schedules, and admin annotations.
- Google OAuth integration secures login and distinguishes between student and admin roles.

### Features:
- **User Authentication**: Login via Google accounts, with role-based access.
- **Schedule Planning**: Create and save four-year plans, add or remove classes, and monitor credits.
- **Multiple Plans**: Support for naming and managing several plans per user (e.g., “Plan A”, “Plan B”).
- **Admin Tools**: View all student plans and annotate to flag conflicts or provide advice.

## Technologies Used:
- **Frontend**: React, Tailwind CSS, Material UI, Google OAuth
- **Backend**: Node.js, Express, PostgreSQL, OAuth 2.0
- **Version Control**: Git, GitHub
<img width="988" alt="Screenshot 2025-05-27 at 3 22 00 PM" src="https://github.com/user-attachments/assets/54106124-68c2-49e7-9c3a-abf7ca439ac9" />
<img width="598" alt="Screenshot 2025-05-27 at 3 22 26 PM" src="https://github.com/user-attachments/assets/9279a689-64de-44cb-9e4e-d2876871714f" />
<img width="584" alt="Screenshot 2025-05-27 at 3 22 41 PM" src="https://github.com/user-attachments/assets/fcfae4ba-3508-460c-b8fb-c0e7afdda95f" />

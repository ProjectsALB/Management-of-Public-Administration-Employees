# Public Administration Employee Management System

**Sistem për menaxhimin e punonjësve të Administratës Publike në Shqipëri**

A full-stack web application designed for managing employees across Albania’s local (bashki) and central (ministri) public administration.  
It provides complete employee record management, CSV import/export, dynamic search & filtering, and interactive data analytics with Chart.js visualizations to support better administrative decision-making.

---

## ✨ Features

### Core Management
- **Local Administration** – Management of all 61 Albanian municipalities (*bashki*)
- **Central Administration** – Management of 13 ministries (*ministri*)
- Full **employee records** with detailed personal and professional data:
  - Name, position, email, phone
  - Date of birth, gender, marital status
  - Projects, start date
  - Linked institution (municipality or ministry)
- **Add** and **delete** employees (individual or bulk)
- Dynamic **search** and **filtering** by name, gender, marital status, projects, etc.
- **CSV import** – Upload employee lists for any institution
- **CSV export** – Download filtered employee data

### Analytics & Insights
- Interactive charts powered by **Chart.js**
- Demographic analysis (gender, age distribution, marital status)
- Position distribution
- Project involvement analysis
- Tenure / seniority analysis
- Start-year trends
- Gender vs. position cross-analysis
- Real-time filtering that updates both tables and charts

### User Experience
- Clean, modern and fully **responsive** UI
- Smooth navigation between institutions and employee lists
- Intuitive forms and action buttons
- Visual feedback and employee counters

---

## 🛠 Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Backend        | Node.js + Express.js                |
| Database       | MongoDB + Mongoose ODM              |
| Frontend       | HTML5, CSS3, Vanilla JavaScript     |
| Charts         | Chart.js                            |
| File Upload    | express-fileupload                  |
| Configuration  | dotenv                              |
| Development    | nodemon                             |

---

## 📁 Project Structure
project-folder/
├── config/
│   ├── db.js                          # MongoDB connection
│   ├── analiza.js / analiza.sql       # Analytics scripts (SQL + JS)
│   ├── databasa.sql                   # Relational schema reference
│   └── mongodb_advanced_analytics.js  # Advanced MongoDB design notes
├── data/
│   ├── bashkit.json                   # Seed data – municipalities
│   ├── ministrit.json                 # Seed data – ministries
│   └── punonjesit.json                # Seed data – employees
├── models/
│   ├── Bashkia.js                     # Municipality schema
│   ├── Ministria.js                   # Ministry schema
│   └── Punonjes.js                    # Employee schema
├── public/
│   ├── index.html                     # Main UI
│   ├── script.js                      # Frontend logic + charts
│   └── style.css                      # Styles
├── seed.js                            # Database seeder
├── server.js                          # Express API + static server
├── package.json
└── .gitignore


---

## ⚙️ Prerequisites

- **Node.js** ≥ 16.x
- **MongoDB** (local instance or MongoDB Atlas)
- **npm** or **yarn**

---

## 🚀 Installation & Setup

### 1. Clone the repository


git clone <repository-url>
cd Management-of-Public-Administration-Employees-main/project-folder


### 2. Install dependencies

npm install

### 3. Configure environment variables

MONGO_URI=mongodb://localhost:27017/administrata-publike
# or your MongoDB Atlas connection string
PORT=3000

### 4. Seed the database (recommended)
node seed.js

This will load:

All Albanian municipalities (bashki)
All ministries (ministri)
Sample employee records

### 5. Start the server

# Production
npm start

# Development (auto-reload)
npm run dev

### 📡 API Endpoints

Method,Endpoint,Description
GET,/api/bashkit,List all municipalities
GET,/api/bashkia/:id/punonjes,Get employees of a municipality
GET,/api/ministrit,List all ministries
GET,/api/ministria/:id/punonjes,Get employees of a ministry
POST,/api/punonjes,Create a new employee
DELETE,/api/punonjes/:id,Delete an employee
POST,/api/upload-punonjes,Bulk import employees from CSV


CSV Import Format
Required columns (case-insensitive):
emri,pozita,email,telefoni,ditelindja,gjinia,gjendja_civile,projektet,dataFillimit

### 📊 Data Model Overview
Bashkia
emri, qyteti, numriPunonjesve, popullsia
Ministria
emri, ministri, numriPunonjesve
Punonjes
emri, pozita, email (unique), telefoni, ditelindja, gjinia, gjendjaCivile, projektet, dataFillimit,
bashkiaId or ministriaId

### 📈 Analytics Available

Gender distribution
Age groups (5-year intervals)
Marital status breakdown
Position distribution
Project count analysis
Tenure / seniority insights
Employment start-year trends
Position × Gender cross-tabulation

All charts update dynamically based on the selected filters.

### 📄 License
This project is intended for educational and demonstration purposes.
You are free to use, modify and distribute it.

### 🤝 Contributing
Feel free to open issues or submit pull requests if you want to improve the system (e.g. add employee update endpoint, authentication, role-based access, more advanced analytics, etc.).


# CashMate 💰

CashMate is a personal finance management app designed to help you track your expenses, manage group spending, and settle debts seamlessly. With an intuitive interface and powerful features, CashMate makes managing your finances easier than ever.

---

## Features 🚀

- **User Authentication**: Secure user registration, login, and management.
- **Expense Tracking**: Add and track individual and group expenses.
- **Group Management**: Create and manage groups for shared expenses.
- **Loan Management**: Track loans you owe and loans owed to you.
- **Real-Time Insights**: Get an overview of your financial balance, including what you owe and what you're owed.
- **Responsive Design**: Works seamlessly across desktops, tablets, and mobile devices.

---

## Live Deployment 🌐

The application is deployed on Vercel. You can access the live version here:

**[CashMate Live Deployment](https://cash-mate-one.vercel.app/)**

---

## Installation 🛠️

### Prerequisites:
- [Node.js](https://nodejs.org/) (version 16+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Clone the Repository:
```bash
git clone https://github.com/SarveshShahane/CashMate.git
cd CashMate
```

### Backend Setup:
1. Navigate to the backend folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env` file:
   ```plaintext
   PORT=5000
   MONGO_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-secret-key>
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup:
1. Navigate to the frontend folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env` file:
   ```plaintext
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## Tech Stack 🛠️

### Frontend:
- **React** with **TypeScript**
- **Vite** as the build tool
- **Axios** for HTTP requests
- **Lucide-React** for beautiful icons

### Backend:
- **Node.js** with **Express**
- **MongoDB** as the database
- **JWT** for authentication
- **Mongoose** for database modeling

---

## Language Composition 📊

The repository's language composition is as follows:
- **TypeScript**: 73.8%
- **JavaScript**: 25.5%
- **Other**: 0.7%

---

## Folder Structure 📂

```
CashMate/
├── client/       # Frontend code
│   ├── src/
│   │   ├── api/          # API service definitions
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── types/        # TypeScript type definitions
│   │   └── ...           # Other frontend files
│   └── ...
├── server/       # Backend code
│   ├── controllers/ # Request handlers
│   ├── models/       # Database schemas
│   ├── routes/       # API routes definitions
│   └── ...
└── README.md    # Project documentation
```

---

## Contributors ✨

We would like to thank the following contributors for their efforts:

- [sa7vic](https://github.com/sa7vic)
- [Turbash](https://github.com/Turbash)

---

## License 📜

This project is licensed under the [MIT License](LICENSE).
```

### Key Information Included:
1. **Features**: Describes the app's functionality.
2. **Live Deployment**: Provides the Vercel deployment link.
3. **Installation Instructions**: Step-by-step guide for setting up the project locally.
4. **Tech Stack**: Lists the technologies used in the project.
5. **Language Composition**: Highlights the language breakdown based on the repository's data.
6. **Folder Structure**: Explains the organization of the project files.
7. **Contributors**: Acknowledges `sa7vic` and `Turbash`.
8. **License**: Specifies the project license.

Let me know if you need any further adjustments!

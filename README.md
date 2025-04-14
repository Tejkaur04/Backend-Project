# Backend-Project
# Personal Expense Tracker App

A simple and user-friendly personal expense tracker built with **Express.js**, **EJS**, and **JSON file-based storage**. This application helps users to manage their daily expenses, providing functionalities to add, edit, and delete expenses efficiently. The app also includes session management and user authentication via cookies for a secure experience.

---

## Features

- **User Authentication**: Allows users to log in and sign up securely.
- **Expense Management**: Users can add, edit, and delete expenses with ease.
- **Responsive Dashboard**: A dynamic dashboard where users can view their expenses directly.
- **Session Management**: Maintains user sessions using cookies for a personalized experience.
- **Data Storage**: Expenses are stored in a JSON file, making the application simple and lightweight.
- **Dynamic Routes**: Handles routes dynamically, depending on whether the user is adding a new expense or editing an existing one.

---

## Technologies Used

- **Express.js**: Web framework for Node.js.
- **EJS**: Templating engine for dynamic HTML rendering.
- **JSON**: File-based storage for expense data.
- **Cookies**: Session management for user authentication.
- **Body-Parser**: Middleware to handle form data.

---
## How It Works

### 1. User Authentication
- **Login**: Users can log in to their account using their credentials.
- **Sign Up**: New users can create an account by signing up with their details.
- **Session Handling**: Once logged in, users remain authenticated through cookies. The app maintains user sessions to provide a seamless experience.

### 2. Expense Management
- **Add Expense**: Users can add new expenses by filling out a form with details such as amount, description, and category.
- **Edit Expense**: Users can edit existing expenses by clicking on the "Edit" button next to each expense.
- **Delete Expense**: Expenses can be deleted from the dashboard.

### 3. Dynamic Form Handling
The form action is dynamically set depending on whether the user is adding a new expense or editing an existing one. The app handles the form submission and updates the expense data accordingly.

### 4. Data Storage
Expense data is stored in a simple `users.json` file for persistence. This keeps the app lightweight and easy to manage.

---

## Routes

### GET /
- **Description**: Displays the dashboard with all the user's expenses.
- **Functionality**: Fetches all expenses from the `users.json` file and displays them on the dashboard.

### GET /login
- **Description**: Displays the login form.
- **Functionality**: Allows users to log in using their credentials.

### GET /signup
- **Description**: Displays the signup form.
- **Functionality**: Allows new users to sign up for an account.

### POST /login
- **Description**: Authenticates the user based on credentials.
- **Functionality**: Checks the user's credentials and logs them in.

### POST /signup
- **Description**: Registers a new user.
- **Functionality**: Saves the new user's details to the `users.json` file.

### POST /add-expense
- **Description**: Adds a new expense.
- **Functionality**: Accepts data from the form and adds a new expense to the `users.json` file.

### POST /edit-expense/:id
- **Description**: Edits an existing expense.
- **Functionality**: Finds the expense by `id` and updates it with new data.

### POST /delete-expense/:id
- **Description**: Deletes an expense.
- **Functionality**: Finds and removes the expense from the `users.json` file.

---

## File Structure

- public
  - background.jpg   # Background image
  - user.jpg         # User profile image
- views
  - expenses.ejs     # Expense management page
  - home.ejs         # Dashboard page
  - login.ejs        # Login page
  - signup.ejs       # Sign-up page
- index.js           # Main application logic and route handling
- users.json         # Stores user and expense data
- README.md          # Project documentation
- .gitignore         # Git ignore file





# Backend-Project 
# Personal Expense Tracker App 💰

**Take control of your finances with ease!** This isn't just another expense tracker; it's your personalized financial command center. Built with a robust foundation of **Express.js**, dynamic **EJS** views, and a lightweight **JSON** data store, this app empowers you to effortlessly manage both your individual spending and shared expenses with friends or family.

Tired of juggling multiple spreadsheets or struggling to remember where your money went?  This app provides a clean, intuitive, and secure way to track your expenses, gain valuable insights into your spending habits, and collaborate on shared budgets.

---

## Key Benefits ✨

-   **Effortless Expense Tracking**:  Quickly and easily log your expenses, categorize them, and add details.  No more lost receipts or forgotten transactions!
-   **Shared Expense Harmony**:  Simplify shared living expenses.  Create groups, record shared costs, and let the app automatically calculate individual contributions. Perfect for roommates, families, or group trips!
-   **Crystal-Clear Financial Overview**:  Visualize your spending with a clean and organized dashboard.  See where your money is going, identify areas where you can save, and make informed financial decisions.
-   **Secure and Personalized Experience**:  Your financial data is important.  This app uses secure user authentication and personalized sessions to ensure your information is protected.
-   **Lightweight and Efficient**:  Built for speed and simplicity.  The app is designed to be responsive and easy to use, without unnecessary bloat.
-   **Empowering Collaboration**:  Simplify shared finances and promote transparency.

---

## Features That Make a Difference 🚀

-   **User-Friendly Interface**:  A clean, intuitive design that makes expense tracking a breeze.
-   **Secure Authentication**:  Protect your financial data with robust user authentication.
-   **Personalized Dashboards**:  Get a clear overview of your spending, tailored to your needs.
-   **Shared Expense Management**:  Simplify finances with roommates, partners, or groups.
    -   **Class Creation**: Create virtual "classes" (e.g., "Apartment", "Trip") to organize shared expenses.  Each class has a unique ID.
    -   **Class Joining**: Join existing classes using their unique IDs to participate in shared expense tracking.
    -   **Shared Expense Recording**:  When adding an expense, specify the class. The app automatically divides the cost among class members.
    -   **Automatic Calculation**: The app calculates and tracks how much each member owes or is owed.
    -   **Clear Overview**:  View shared expenses within the context of the class, with a breakdown of individual contributions.
-   **Dynamic Data Handling**:  The app adapts to your needs, whether you're adding a new expense or editing an existing one.
-   **Data Persistence**: Your data is stored safely, so you can access it anytime.

---
## File Structure
```php

├── public/
│   ├── background.jpg
│   └── user.png
├── views/
│   ├── expenses.ejs
│   ├── home.ejs
│   ├── login.ejs
│   ├── signup.ejs
│   └── error.ejs
├── index.js
├── users.json
├── README.md
└── .gitignore

```
---

## Built With Passion and Precision 🛠️

This app is crafted using the following technologies:

-   **Express.js**:  A powerful and flexible Node.js web framework.
-   **EJS**:  For dynamic and efficient rendering of web pages.
-   **JSON**:  A simple and lightweight format for data storage.
-   **Cookies**:  For secure and persistent user sessions.
-   **Morgan**:  For detailed logging of app activity.
-   **UUID**:  For generating unique identifiers.

---

## Take Control of Your Finances Today! 🚀

This Personal Expense Tracker App is more than just a tool; it's your partner in achieving financial clarity and control.  Whether you're an individual looking to better manage your budget or a group seeking a seamless way to handle shared expenses, this app provides the features, security, and ease of use you need.

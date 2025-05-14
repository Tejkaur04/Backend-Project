const express = require('express');
const app = express();
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

app.set("view engine", "ejs");

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(morgan('dev'));

const dataFile = "users.json";

// Helper function to load user data with robust error handling
async function loadUserData() {
    try {
        const data = await fs.readFile(dataFile, "utf8");
        const parsedData = JSON.parse(data);
        return parsedData;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If the file doesn't exist, return a default object
            console.warn("Warning: users.json not found. Creating a new file.");
            return { users: [], classes: {} };
        } else {
            // For other errors, throw the error to be caught by the route handler
            console.error("Error reading users.json:", error);
            throw error;
        }
    }
}

// Helper function to save user data with robust error handling
async function saveUserData(data) {
    try {
        await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to users.json:", error);
        throw error; // Re-throw to be handled by the route
    }
}

app.get("/", (req, res) => {
    res.render("login", { message: null });
});

function getExpensesData(expenses) {
    const grouped = {};

    expenses.forEach(exp => {
        const date = new Date(exp.date);
        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        if (!grouped[monthKey]) {
            grouped[monthKey] = {
                total: 0,
                items: []
            };
        }

        grouped[monthKey].items.push(exp);
        grouped[monthKey].total += exp.amount;
    });

    return Object.keys(grouped).map(month => ({
        month,
        total: grouped[month].total,
        items: grouped[month].items
    }));
}

app.post("/", async (req, res) => {
    const { email, password } = req.body;
    console.log("Received login request with email:", email, "and password:", password);

    try {
        const data = await loadUserData();
        const user = data.users.find(u => u.email === email && u.password === password);

        if (user) {
            res.cookie("user", user.username, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
            });
            res.redirect("/home");
        } else {
            res.render("login", { message: "Email or Password is incorrect. Try again" });
        }
    } catch (error) {
        // Handle errors that occurred during data loading
        console.error("Login error:", error);
        res.status(500).send("Internal server error during login."); // Send 500
    }
});

app.get("/signup", (req, res) => {
    res.render("signup", { message: null });
});

app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const data = await loadUserData();
        const existingUser = data.users.find(user => user.email === email);

        if (existingUser) {
            res.render("signup", { message: "Email already registered! Please login." });
        } else {
            data.users.push({ username, email, password, expenses: [], joinedClasses: [] });
            await saveUserData(data);
            res.render("login", { message: "Account registration successful! Please login." });
        }
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).send("Internal server error during signup.");
    }
});

app.get("/home", async (req, res) => {
    const username = req.cookies.user;

    if (username) {
        try {
            const data = await loadUserData();
            const user = data.users.find(u => u.username === username);

            if (!user) return res.render("login", { message: "Please login again." });

            if (!user.expenses) user.expenses = [];

            let totalMonthly = user.expenses.reduce((sum, expense) => sum + expense.amount, 0);

            let totalShared = 0;
            const sharedExpenses = [];
            if (user.joinedClasses) {
                for (const classId of user.joinedClasses) {
                    if (data.classes && data.classes[classId]) {
                        const currentClass = data.classes[classId];
                        const memberCount = currentClass.members.length;
                        if (currentClass.expenses) {
                            for (const expense of currentClass.expenses) {
                                const sharedAmount = expense.amount / memberCount;  // Calculate shared amount
                                if (currentClass.members.includes(username)) {
                                    sharedExpenses.push({
                                        ...expense,
                                        className: currentClass.className,
                                        sharedAmount: sharedAmount, // Store the shared amount
                                    });
                                    totalShared += sharedAmount;
                                }
                            }
                        }
                    }
                }
            }
            const allSharedExpenses = sharedExpenses;
            const classes = user.joinedClasses ? user.joinedClasses.map(classId => data.classes[classId]) : [];
            res.render("home", { username, expenses: user.expenses, totalMonthly, sharedExpenses: allSharedExpenses, user, classes, message: null });
        } catch (error) {
            console.error("Home route error:", error);
            res.status(500).send("Internal server error.");
        }
    } else {
        res.render("login", { message: "Please login first." });
    }
});


app.get("/expenses", async (req, res) => {
    const username = req.cookies.user;

    if (username) {
        try {
            const data = await loadUserData();
            const user = data.users.find(u => u.username === username);

            if (!user || !user.expenses) {
                user.expenses = [];
            }
            // Include shared expenses calculation here as well, similar to /home
            let totalShared = 0;
            const sharedExpenses = [];
            if (user.joinedClasses) {
                for (const classId of user.joinedClasses) {
                    if (data.classes && data.classes[classId]) {
                        const currentClass = data.classes[classId];
                        const memberCount = currentClass.members.length;
                        if (currentClass.expenses) {
                            for (const expense of currentClass.expenses) {
                                const sharedAmount = expense.amount / memberCount;  // Calculate shared amount
                                if (currentClass.members.includes(username)) {
                                    sharedExpenses.push({
                                        ...expense,
                                        className: currentClass.className,
                                        sharedAmount: sharedAmount, // Store the shared amount
                                    });
                                    totalShared += sharedAmount;
                                }
                            }
                        }
                    }
                }
            }
            const monthlyData = getExpensesData(user.expenses);
             // Combine personal and shared expenses for display
            const allExpenses = [...monthlyData];  // Start with personal expenses
            sharedExpenses.forEach(sharedExpense => {
                // Try to find a matching expense in the existing monthlyData
                const matchingMonth = allExpenses.find(month => {
                    return month.items.find(item => item.id === sharedExpense.id);
                });

                if (matchingMonth) {
                    // If found, update the existing expense item
                    const existingItemIndex = matchingMonth.items.findIndex(item => item.id === sharedExpense.id);
                    if (existingItemIndex > -1) {
                        matchingMonth.items[existingItemIndex] = {
                            ...matchingMonth.items[existingItemIndex],
                            sharedAmount: sharedExpense.sharedAmount
                        };
                    }
                } else {
                    // If not found, add the shared expense as a new month
                    const monthKey = new Date(sharedExpense.date).toLocaleString('default', { month: 'long', year: 'numeric' });
                    let monthToAdd = allExpenses.find(m => m.month === monthKey);
                    if (!monthToAdd) {
                        monthToAdd = { month: monthKey, total: 0, items: [] };
                        allExpenses.push(monthToAdd);
                    }
                    monthToAdd.items.push(sharedExpense);
                    monthToAdd.total += sharedExpense.sharedAmount;
                }
            });
            res.render('expenses', { monthlyData: allExpenses, username: user.username }); // Pass combined data
        } catch (error) {
            console.error("Expenses route error", error);
            res.status(500).send("Internal server error.");
        }
    } else {
        res.render("login", { message: "Please login first." });
    }
});

app.post("/expenses", async (req, res) => {
    const { productName, category, date, amount } = req.body;
    const username = req.cookies.user;

    try {
        const data = await loadUserData();
        const user = data.users.find(u => u.username === username);

        if (!user) return res.status(404).send("User not found");

        if (!user.expenses) user.expenses = [];

        const newExpense = {
            id: Date.now(),
            productName,
            category,
            date,
            amount: parseFloat(amount)
        };

        user.expenses.push(newExpense);
        await saveUserData(data);
        res.redirect("/expenses");
    } catch (error) {
        console.error("Add expense error:", error);
        res.status(500).send("Internal server error.");
    }
});


app.post("/expenses/add", async (req, res) => {
    const { productName, category, date, amount, sharedClass } = req.body;
    const username = req.cookies.user;

    try {
        const data = await loadUserData();
        const user = data.users.find(u => u.username === username);

        if (!user) return res.status(404).send("User not found");

        const newExpense = {
            id: Date.now(),
            productName,
            category,
            date,
            amount: parseFloat(amount),
            addedBy: username
        };

        if (sharedClass && data.classes && data.classes[sharedClass] && data.classes[sharedClass].members.includes(username)) {
            const currentClass = data.classes[sharedClass];
            const memberCount = currentClass.members.length;
            const sharedAmount = parseFloat(amount) / memberCount;

            const sharedExpense = { ...newExpense, sharedAmount }; // Store sharedAmount
            if (!data.classes[sharedClass].expenses) {
                data.classes[sharedClass].expenses = [];
            }
            data.classes[sharedClass].expenses.push(sharedExpense);
        } else {
            if (!user.expenses) user.expenses = [];
            user.expenses.push(newExpense);
        }

        await saveUserData(data);
        res.redirect("/home");
    } catch (error) {
        console.error("Add shared expense error:", error);
        res.status(500).send("Internal server error.");
    }
});

app.post("/expenses/delete/:id", async (req, res) => {
    const expenseId = parseInt(req.params.id);
    const username = req.cookies.user;

    try {
        const data = await loadUserData();
        const user = data.users.find(u => u.username === username);

        if (!user) return res.status(404).send("User not found");

        if (!user.expenses) user.expenses = [];

        const initialLength = user.expenses.length;
        user.expenses = user.expenses.filter(expense => expense.id !== expenseId);

        if (user.expenses.length === initialLength) {
            for (const classId of user.joinedClasses) {
                if (data.classes && data.classes[classId] && data.classes[classId].expenses) {
                    const initialSharedLength = data.classes[classId].expenses.length;
                    data.classes[classId].expenses = data.classes[classId].expenses.filter(exp => exp.id !== expenseId);
                    if (data.classes[classId].expenses.length !== initialSharedLength) {
                        break;
                    }
                }
            }
        }

        await saveUserData(data);
        res.redirect("/home");
    } catch (error) {
        console.error("Delete expense error:", error);
        res.status(500).send("Internal server error.");
    }
});

app.post("/expenses/edit/:id", async (req, res) => {
    const expenseId = parseInt(req.params.id);
    const { productName, category, date, amount } = req.body;
    const username = req.cookies.user;

    try {
        const data = await loadUserData();
        const user = data.users.find(u => u.username === username);

        if (!user) return res.status(404).send("User not found");

        if (!user.expenses) user.expenses = [];

        let expenseUpdated = false;
        const expenseIndex = user.expenses.findIndex(exp => exp.id === expenseId);
        if (expenseIndex !== -1) {
            user.expenses[expenseIndex] = { id: expenseId, productName, category, date, amount: parseFloat(amount) };
            expenseUpdated = true;
        }

        if (!expenseUpdated) {
            for (const classId of user.joinedClasses) {
                if (data.classes && data.classes[classId] && data.classes[classId].expenses) {
                    const expenseToEdit = data.classes[classId].expenses.find(exp => exp.id === expenseId);
                    if (expenseToEdit) {
                        expenseToEdit.productName = productName;
                        expenseToEdit.category = category;
                        expenseToEdit.date = date;
                        expenseToEdit.amount = parseFloat(amount);
                        expenseUpdated = true;
                        break;
                    }
                }
            }
        }

        await saveUserData(data);
        res.redirect("/home");
    } catch (error) {
        console.error("Edit expense error:", error);
        res.status(500).send("Internal server error.");
    }
});

app.post("/create-class", async (req, res) => {
    const username = req.cookies.user;
    if (!username) return res.redirect('/login');

    try {
        const classId = uuidv4();
        const data = await loadUserData();

        if (!data.classes) {
            data.classes = {};
        }

        data.classes[classId] = {
            members: [username],
            expenses: [],
            className: `Class-${Object.keys(data.classes).length + 1}`, //give a default name,
            classId: classId
        };

        const user = data.users.find(u => u.username === username);
        if (user) {
            if (!user.joinedClasses) {
                user.joinedClasses = [];
            }
            user.joinedClasses.push(classId);
            await saveUserData(data);
            res.redirect('/home');
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error("Create class error:", error);
        res.status(500).send("Internal server error.");
    }
});

app.post("/join-class", async (req, res) => {
    const username = req.cookies.user;
    const { classId } = req.body;
    if (!username || !classId) return res.redirect('/home');

    try {
        const data = await loadUserData();

        if (!data.classes) {
            data.classes = {};
        }

        if (data.classes[classId]) {
            if (!data.classes[classId].members.includes(username)) {
                data.classes[classId].members.push(username);
                const user = data.users.find(u => u.username === username);
                if (user) {
                    if (!user.joinedClasses) {
                        user.joinedClasses = [];
                    }
                    user.joinedClasses.push(classId);
                    await saveUserData(data);
                }
            }
            res.redirect('/home');
        } else {
            res.render("home", { message: "Class not found" });
        }
    } catch (error) {
        console.error("Join class error:", error);
        res.status(500).send("Internal server error.");
    }
});

app.get("/logout", (req, res) => {
    res.clearCookie("user");
    res.redirect("/");
});

app.get("/*", (req, res, next) => {
    const error = new Error(" does not exist.");
    error.status = 404;
    return next(error);
})

app.use((err, req, res, next) => {
    res.render("error.ejs", { url: req.url, code: err.status, reason: err.message });
})

app.listen(3000, () => {
    console.log("Server running on port 3000.");
});

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

async function loadUserData() {
    try {
        const data = await fs.readFile(dataFile, "utf8");
        return data ? JSON.parse(data) : { users: [], classes: {} }; // Changed this line
    } catch (error) {
        console.error("Error reading JSON file:", error);
        return { users: [], classes: {} }; // And this line
    }
}

async function saveUserData(data) {
    try {
        await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing JSON file:", error);
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
    const data = await loadUserData();
    let user = null;

    if (data && data.users) { // Added null check
        user = data.users.find(user => user.email === email && user.password === password);
    }
    console.log("User found:", user);

    if (user) {
        res.cookie("user", user.username, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.redirect("/home");
    } else {
        res.render("login", { message: "Email or Password is incorrect. Try again" });
    }
});

app.get("/signup", (req, res) => {
        res.render("signup", { message: null });
});

app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    const data = await loadUserData();

    const existingUser = data.users.find(user => user.email === email);

    if (existingUser) {
        res.render("signup", { message: "Email already registered! Please login." });
    } else {
        data.users.push({ username, email, password, expenses: [], joinedClasses: [] });
        await saveUserData(data);
        res.render("login", { message: "Account registration successful! Please login." });
    }
});

app.get("/home", async (req, res) => {
    const username = req.cookies.user;

    if (username) {
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
                    if (data.classes[classId].expenses) {
                        for (const expense of data.classes[classId].expenses) {
                            sharedExpenses.push({ ...expense, className: classId });
                            totalShared += expense.amount;
                        }
                    }
                }
            }
        }
        const allSharedExpenses = sharedExpenses;

        res.render("home", { username, expenses: user.expenses, totalMonthly, sharedExpenses: allSharedExpenses, user });
    } else {
        res.render("login", { message: "Please login first." });
    }
});


app.get("/expenses", async (req, res) => {
    const username = req.cookies.user;

    if (username) {
        const data = await loadUserData();
        const user = data.users.find(u => u.username === username);

        if (!user || !user.expenses) {
            user.expenses = [];
        }

        const monthlyData = getExpensesData(user.expenses);

        res.render('expenses', { monthlyData, username: user.username });
    } else {
        res.render("login", { message: "Please login first." });
    }
});

app.post("/expenses", async (req, res) => {
    const { productName, category, date, amount } = req.body;
    const username = req.cookies.user;

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
});


app.post("/expenses/add", async (req, res) => {
    const { productName, category, date, amount, sharedClass } = req.body;
    const username = req.cookies.user;

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
        if (!data.classes[sharedClass].expenses) {
            data.classes[sharedClass].expenses = [];
        }
        data.classes[sharedClass].expenses.push(newExpense);
    } else {
        if (!user.expenses) user.expenses = [];
        user.expenses.push(newExpense);
    }

    await saveUserData(data);
    res.redirect("/home");
});

app.post("/expenses/delete/:id", async (req, res) => {
    const expenseId = parseInt(req.params.id);
    const username = req.cookies.user;

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
});

app.post("/expenses/edit/:id", async (req, res) => {
    const expenseId = parseInt(req.params.id);
    const { productName, category, date, amount } = req.body;
    const username = req.cookies.user;

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
});

app.post("/create-class", async (req, res) => {
    const username = req.cookies.user;
    if (!username) return res.redirect('/login');

    const classId = uuidv4();
    const data = await loadUserData();

    if (!data.classes) {
        data.classes = {};
    }

    data.classes[classId] = { members: [username], expenses: [] };
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
});

app.post("/join-class", async (req, res) => {
    const username = req.cookies.user;
    const { classId } = req.body;
    if (!username || !classId) return res.redirect('/home');

    const data = await loadUserData();

    if (data.classes && data.classes[classId] && !data.classes[classId].members.includes(username)) {
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

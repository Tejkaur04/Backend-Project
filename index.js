const express = require('express');
const app = express();
const fs = require('fs');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');


app.set("view engine", "ejs");

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(morgan('dev'));

const dataFile = "users.json";

function loadUserData() {
    if (fs.existsSync(dataFile)) {
        try {
            const data = fs.readFileSync(dataFile, "utf8");
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("Error reading JSON file:", error);
            return [];
        }
    }
    return [];
}

function saveUserData(users) {
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
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

app.post("/", (req, res) => {
    const { email, password } = req.body;
    let users = loadUserData();
    const user = users.find(user => user.email === email && user.password === password);

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

app.post("/signup", (req, res) => {
    const { username, email, password } = req.body;
    let users = loadUserData();

    const existingUser = users.find(user => user.email === email);

    if (existingUser) {
        res.render("signup", { message: "Email already registered! Please login." });
    } else {
        users.push({ username, email, password, expenses: [] });
        saveUserData(users);
        res.render("login", { message: "Account registration successful! Please login." });
    }
});

app.get("/home", (req, res) => {
    const username = req.cookies.user;

    if (username) {
        let users = loadUserData();
        let user = users.find(user => user.username === username);

        if (!user) return res.render("login", { message: "Please login again." });

        if (!user.expenses) user.expenses = [];

        
        const totalMonthly = user.expenses.reduce((total, expense) => {
            const expenseDate = new Date(expense.date);
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
                total += expense.amount;
            }
            return total;
        }, 0);

        res.render("home", { username, expenses: user.expenses, totalMonthly });
    } else {
        res.render("login", { message: "Please login first." });
    }
});


app.get("/expenses", (req, res) => {
    const username = req.cookies.user;

    if (username) {
        let users = loadUserData();
        let user = users.find(u => u.username === username);

        if (!user || !user.expenses) {
            user.expenses = [];
        }

        const monthlyData = getExpensesData(user.expenses);  

        res.render('expenses', { monthlyData, username: user.username });
    } else {
        res.render("login", { message: "Please login first." });
    }
});

app.post("/expenses", (req, res) => {
    const { productName, category, date, amount } = req.body;
    const username = req.cookies.user;

    let users = loadUserData();
    let user = users.find(u => u.username === username);

    if (!user) return res.status(404).send("User not found");

    if (!user.expenses) user.expenses = [];

    const newExpense = {
        id: user.expenses.length + 1,
        productName,
        category,
        date,
        amount: parseFloat(amount)
    };

    user.expenses.push(newExpense);
    saveUserData(users);  
    res.redirect("/expenses");  
});


app.post("/expenses/add", (req, res) => {
    const { productName, category, date, amount } = req.body;
    const username = req.cookies.user;

    let users = loadUserData();
    let user = users.find(u => u.username === username);

    if (!user) return res.status(404).send("User not found");

    if (!user.expenses) user.expenses = [];

    const newExpense = {
        id : user.expenses.length + 1 ,
        productName,
        category,
        date,
        amount: parseFloat(amount)
    };

    user.expenses.push(newExpense);
    saveUserData(users);

    res.redirect("/home"); 
});


app.post("/add-expense", (req, res) => {
    const { productName, category, date, amount } = req.body;
    const username = req.cookies.user;

    let users = loadUserData();
    let user = users.find(u => u.username === username);

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
    saveUserData(users);

    res.redirect("/home");
});



app.post("/delete-expense", (req, res) => {
    const { id } = req.body;
    const username = req.cookies.user;

    let users = loadUserData();
    let user = users.find(u => u.username === username);

    if (!user) return res.status(404).send("User not found");

    user.expenses = user.expenses.filter(e => e.id != id);
    saveUserData(users);

    res.redirect("/home");
});
app.post("/expenses/delete/:id", (req, res) => {
    const expenseId = parseInt(req.params.id);  
    const username = req.cookies.user;

    let users = loadUserData();
    let user = users.find(u => u.username === username);

    if (!user) return res.status(404).send("User not found");

    if (!user.expenses) user.expenses = [];

    const expenseIndex = user.expenses.findIndex(expense => expense.id === expenseId);

    if (expenseIndex !== -1) {
        user.expenses.splice(expenseIndex, 1);

        saveUserData(users);
    }

    res.redirect("/home");  
});
app.post("/expenses/edit/:id", (req, res) => {
    const expenseId = parseInt(req.params.id);  
    const username = req.cookies.user;

    let users = loadUserData();
    let user = users.find(u => u.username === username);

    if (!user) return res.status(404).send("User not found");

    if (!user.expenses) user.expenses = [];

    
    const expense = user.expenses.find(exp => exp.id === expenseId);

    if (expense) {
        
        expense.productName = productName;
        expense.category = category;
        expense.date = date;
        expense.amount = parseFloat(amount);

        
        saveUserData(users);
    }

    res.redirect("/home");  
});


app.post("/edit-expense", (req, res) => {
    const { id, productName, category, date, amount } = req.body;
    const username = req.cookies.user;

    let users = loadUserData();
    let user = users.find(u => u.username === username);

    if (!user) return res.status(404).send("User not found");

    const expense = user.expenses.find(e => e.id == id);
    if (expense) {
        expense.productName = productName;
        expense.category = category;
        expense.date = date;
        expense.amount = parseFloat(amount);
    }

    saveUserData(users);
    res.redirect("/home");
});

app.get("/logout", (req, res) => {
    res.clearCookie("user");
    res.redirect("/");
});

// error handling middleware
app.get("/*",(req,res,next)=>{
    const error = new Error(" does not exist.");
    error.status = 404;
    return next(error);
})

app.use((err,req,res,next)=>{
    res.render("error.ejs",{url:req.url,code:err.status,reason:err.message});
})


app.listen(3000, () => {
    console.log("Server running on port 3000.");
});

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

app.get("/", (req, res) => {
    res.render("login", { message: null });
});

app.post("/", (req, res) => {
    const { email, password } = req.body;
    let users = loadUserData();
    const user = users.find(user => user.email === email && user.password === password);

    if (user) {
        res.cookie("user", user.username, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
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
        users.push({ username, email, password });
        fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
        res.render("login", { message: "Account registration successful! Please login." });
    }
});

app.get("/home", (req, res) => {
    const username = req.cookies.user;

    if (username) {
        let users = loadUserData();
        let user = users.find(user => user.username === username);

        if (!user || !user.expenses) {
            user.expenses = [];
        }

        res.render("home", { username, expenses: user.expenses });
    } else {
        res.render("login", { message: "Please login first." });
    }
});

app.get("/expenses", (req, res) => {
    const username = req.cookies.user;

    if (username) {
        res.render("expenses", { username });
    } else {
        res.render("login", { message: "Please login first." });
    }
});

app.post("/expenses", (req, res) => {
    const { productName, category, date, amount } = req.body;
    const username = req.cookies.user;

    let users = loadUserData();
    let user = users.find(user => user.username === username);

    if (!user) {
        return res.status(404).send("User not found");
    }

    if (!user.expenses) {
        user.expenses = [];
    }

    const newExpense = {
        id: user.expenses.length + 1,
        productName,
        category,
        date,
        amount: parseFloat(amount)
    };

    user.expenses.push(newExpense);
    fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));

    res.redirect("/expenses");
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

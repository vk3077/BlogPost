//jshint esversion:6
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const articleRouter = require("./routes/articles");
const User = require("./models/user");
const Articles = require("./models/article");
const session = require("express-session");
const passport = require("passport");
const MethodOverride = require("method-override");

const url = require("url");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(MethodOverride("_method"));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use("/articles", articleRouter);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB connected"))
  .catch(() => console.log("Failed to connect DB"));

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const loading = (req, res,next) => {
  res.render('loading')
  next()
}
app.get("/articles", async (req, res) => {
  if (req.isAuthenticated()) {
    var articles = [];
    Articles.find({}, (err, articleList) => {
      res.render("articles/index", {
        articles: articleList || articles,
        username: req.user.username,
      });
    });
  } else {
    res.redirect(
      url.format({
        pathname: "/login",
        query: {
          redirect: req.originalUrl,
        },
      })
    );
  }
});


app.get("/", (req, res) => {
  const redirectUrl = req.query.redirect ? req.query.redirect : "/articles";
  if (req.isAuthenticated()) res.redirect(redirectUrl);
  else {
    res.redirect(
      url.format({
        pathname: "/login",
        query: {
          redirect: redirectUrl,
        },
      })
    );
  }
});

// Login
app.get("/login", (req, res) => {
  const redirectUrl = req.query.redirect ? req.query.redirect : "/articles";
  if (req.isAuthenticated()) res.redirect(redirectUrl);
  else res.render("login", { redirect: redirectUrl });
});

app.post("/login", (req, res) => {
  const redirectUrl = req.body.signIn || "/articles";
  let userEmail;
  User.findOne({ username: req.body.username }, (err, user) => {
    if (err) res.json(err);
    else {
      if (user) userEmail = user.email;
      // user not exists error
      else res.render("user_not_exists", { redirect: redirectUrl });
    }
  });
  const user = new User({
    email: userEmail,
    username: req.body.username,
    password: req.body.password,
  });

  req.logIn(user, (err) => {
    if (err) {
      // res.send("Error Logging In please try again");
      res.json(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect(redirectUrl);
      });
    }
  });
});
//  Login

// Logout
app.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/login");
});
// logout

// Register
app.get("/register", (req, res) => {
  const redirectUrl = req.body.register || "/articles";
  res.render("register", { redirect: redirectUrl });
});

app.post("/register", (req, res) => {
  const redirectUrl = req.query.redirect ? req.query.redirect : "/articles";
  User.register(
    { email: req.body.email, username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        // res.send("User registration failed please try again");
        if (err.name == "UserExistsError") {
          res.render("user_exists", { redirect: redirectUrl });
        } else {
          res.json(err);
        }
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect(redirectUrl);
        });
      }
    }
  );
});
// Register

app.get("/loading", (req, res) => {
  // partial('loading')
  res.writeProcessing("Loading");
});

app.listen(process.env.PORT || "3000", () => {
  console.log("server is running on port 3000");
});

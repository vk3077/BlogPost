require("dotenv").config();
const express = require("express");
const router = express.Router();
const Article = require("./../models/article");
const passport = require("passport");
const url = require("url");
const marked = require("marked");
const createDomPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const dompurify = createDomPurify(new JSDOM().window);

router.get("/new", async (req, res) => {
  let article = new Article({
    username: "",
    title: "",
    description: "",
    markdown: "",
  });
  if (req.isAuthenticated())
    res.render("account/new", {
      article: article,
      username: req.user.username,
    });
  else {
    res.redirect(
      url.format({
        pathname: "/",
        query: {
          redirect: "/articles/new",
        },
      })
    );
  }
});

router.get("/:user", (req, res) => {
  if (req.isAuthenticated()) {
    Article.find({ username: req.user.username }, (err, articleList) => {
      if (articleList)
        res.render("account/all-posts", {
          articles: articleList,
          username: req.user.username,
        });
      else {
        res.send("<h1>You have no Blogs</h1>");
      }
    });
  } else {
    res.redirect(
      url.format({
        pathname: "/",
        query: {
          redirect: "/", // redirection sahi krna hai
        },
      })
    );
  }
});

router.get("/:user/:id", (req, res) => {
  if (req.isAuthenticated()) {
    Article.findOne({ _id: req.params.id }, (err, article) => {
      if (err) res.json(err);
      else {
        if (article)
          res.render("articles/show", {
            article: article,
            username: req.user.username,
          });
        else res.redirect("/");
      }
    });
  } else {
    res.redirect(
      url.format({
        pathname: "/",
        query: {
          redirect: `/articles/`,
        },
      })
    );
  }
});

router.post("/save", async (req, res) => {
  let article = new Article({
    username: req.user.username,
    title: req.body.title,
    description: req.body.description,
    markdown: req.body.markdown,
    sanitizedHtml: dompurify.sanitize(marked(req.body.markdown)),
  });
  try {
    savedArticle = await article.save();
    res.redirect(`/articles/${req.user.username}/${savedArticle.id}`);
  } catch (e) {
    res.render("account/new", {
      article: article,
      username: req.user.username,
    });
    console.log(e);
  }
});

router.get("/:user/edit/:id", (req, res) => {
  if (req.isAuthenticated()) {
    Article.findOne({ _id: req.params.id }, (err, article) => {
      if (err) res.json(err);
      else {
        if (article) {
          res.render("articles/edit", {
            article: article,
            username: req.user.username,
          });
        } else {
          res.render("404");
        }
      }
    });
  } else {
    res.redirect(
      url.format({
        pathname: "/",
        query: {
          // redirect: `/articles/${req.user.username}/edit/${req.params.id}`,
          redirect: "/",
        },
      })
    );
  }
});

router.post("/:user/edit/:id", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      await Article.findByIdAndDelete(req.params.id);
    } catch {
      res.render("Article not found");
    }
    res.redirect(307, "/articles/save");
  } else {
    res.redirect(
      url.format({
        pathname: "/",
        query: {
          redirect: "/",
        },
      })
    );
  }
});

router.delete("/:id", async (req, res) => {
  console.log("entered delete request");
  await Article.findByIdAndDelete(req.params.id);
  res.redirect(`/articles/${req.user.username}`);
});

module.exports = router;

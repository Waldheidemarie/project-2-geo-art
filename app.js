"use strict";

const { join } = require("path");
const express = require("express");
const createError = require("http-errors");
const connectMongo = require("connect-mongo");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const logger = require("morgan");
const mongoose = require("mongoose");

const sassMiddleware = require("node-sass-middleware");
const serveFavicon = require("serve-favicon");

const basicAuthenticationDeserializer = require("./middleware/basic-authentication-deserializer.js");
const routeGuard = require("./middleware/route-guard");
const bindUserToViewLocals = require("./middleware/bind-user-to-view-locals.js");
//ROUTERS----------------------------------------------------
const indexRouter = require("./routes/index");
const authenticationRouter = require("./routes/authentication");
const profileRouter = require("./routes/profile");
const placesRouter = require("./routes/places");
const contactRouter = require("./routes/contact");
const commentsRouter = require("./routes/comments");
//--------------------------------------------------------

//PARTIAL -------------------------------
const hbs = require("hbs");
const json = require("hbs-json");

hbs.registerHelper("json", json);

hbs.registerHelper("feedDate", function(value) {
  let feedDate = new Date(value).toDateString();
  return feedDate;
});

hbs.registerHelper("commentDate", function(value) {
  let commentDate = new Date(value).toUTCString();
  return commentDate;
});

hbs.registerPartials(__dirname + "/views/partial");
//----------------------------------------

const app = express();

app.set("views", join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(serveFavicon(join(__dirname, "public/images", "favicon.ico")));
app.use(
  sassMiddleware({
    src: join(__dirname, "public"),
    dest: join(__dirname, "public"),
    outputStyle: process.env.NODE_ENV === "development" ? "nested" : "compressed",
    force: process.env.NODE_ENV === "development",
    sourceMap: true
  })
);
app.use(express.static(join(__dirname, "public")));
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 24 * 15 * 1000,
      sameSite: "lax",
      httpOnly: true
    },
    store: new (connectMongo(expressSession))({
      mongooseConnection: mongoose.connection,
      ttl: 60 * 60 * 24
    })
  })
);
app.use(basicAuthenticationDeserializer);
app.use(bindUserToViewLocals);

app.use("/", indexRouter);
app.use("/authentication", authenticationRouter);
app.use("/profile", profileRouter);
app.use("/places", placesRouter);
app.use("/comments", commentsRouter);
app.use("/contact", contactRouter);

// Catch missing routes and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Catch all error handler
app.use((error, req, res, next) => {
  // Set error information, with stack only available in development
  res.locals.message = error.message;
  res.locals.error = req.app.get("env") === "development" ? error : {};
  res.status(error.status || 500);
  res.render("error");
});

module.exports = app;

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var logger = require("morgan");
const passport = require("passport");
const config = require("./config");

//added for google
const google = require("googleapis").google;
const OAuth2 = google.auth.OAuth2;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const campsiteRouter = require("./routes/campsiteRouter");
const promotionRouter = require("./routes/promotionRouter");
const partnerRouter = require("./routes/partnerRouter");
const uploadRouter = require("./routes/uploadRouter");

const mongoose = require("mongoose");
const url = config.mongoUrl;
const connect = mongoose.connect(url, {
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

connect.then(
  () => console.log("Connected correctly to server"),
  (err) => console.log(err)
);

var app = express();

app.all("*", (req, res, next) => {
  if (req.secure) {
    //if through https, req.secure is true
    return next();
  } else {
    console.log(
      `Redirecting to: https://${req.hostname}:${app.get("secPort")}${req.url}`
    );
    res.redirect(
      301,
      `https://${req.hostname}:${app.get("secPort")}${req.url}`
    );
  }
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/users", usersRouter);

//↓making localhost:3000 equal = path.join(__dirname, "public")
app.use(express.static(path.join(__dirname, "public")));

app.use("/campsites", campsiteRouter);
app.use("/promotions", promotionRouter);
app.use("/partners", partnerRouter);
app.use("/imageUpload", uploadRouter);

//↓ ------------------ for google auth --------------------------------------------
app.get("/auth_callback", function (req, res) {
  // Create an OAuth2 client object from the credentials in our config file
  const oauth2Client = new OAuth2(
    config.oauth2Credentials.client_id,
    config.oauth2Credentials.client_secret,
    config.oauth2Credentials.redirect_uris[0]
  );
  if (req.query.error) {
    // The user did not give us permission.
    return res.redirect("/");
  } else {
    oauth2Client.getToken(req.query.code, function (err, token) {
      if (err) return res.redirect("/");

      // Store the credentials given by google into a jsonwebtoken in a cookie called 'jwt'
      res.cookie("jwt", jwt.sign(token, config.JWTsecret));
      return res.redirect("/get_some_data");
    });
  }
});

app.get("/get_some_data", function (req, res) {
  if (!req.cookies.jwt) {
    // We haven't logged in
    return res.redirect("/");
  }
  // Create an OAuth2 client object from the credentials in our config file
  const oauth2Client = new OAuth2(
    config.oauth2Credentials.client_id,
    config.oauth2Credentials.client_secret,
    config.oauth2Credentials.redirect_uris[0]
  );
  // Add this specific user's credentials to our OAuth2 client
  oauth2Client.credentials = jwt.verify(req.cookies.jwt, config.JWTsecret);
  // Get the youtube service
  const service = google.youtube("v3");
  // Get five of the user's subscriptions (the channels they're subscribed to)
  service.subscriptions
    .list({
      auth: oauth2Client,
      mine: true,
      part: "snippet,contentDetails",
      maxResults: 5,
    })
    .then((response) => {
      // Render the data view, passing the subscriptions to it
      return res.render("data", { subscriptions: response.data.items });
    });
});

//↑ ------------------ for google auth --------------------------------------------

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

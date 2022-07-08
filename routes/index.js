var express = require("express");
var router = express.Router();

const google = require("googleapis").google;
const OAuth2 = google.auth.OAuth2;
const CONFIG = require("../config");

/* GET home page. */
router.get("/", function (req, res, next) {
  const oauth2Client = new OAuth2(
    CONFIG.oauth2Credentials.client_id,
    CONFIG.oauth2Credentials.client_secret,
    CONFIG.oauth2Credentials.redirect_uris[0]
  );

  // Obtain the google login link to which we'll send our users to give us access
  const loginLink = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: CONFIG.oauth2Credentials.scopes,
  });
  // access_type: Indicates that we need to be able to access data continously without the user constantly giving us consent
  // scope: Using the access scopes from our config file

  res.render("index", { title: "Express", loginLink: loginLink });
});

module.exports = router;

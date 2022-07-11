const express = require("express");
const Favorite = require("../models/favorite");
const authenticate = require("../authenticate");
const cors = require("./cors");

const favoriteRouter = express.Router();

//campsites call without params---------------------------
favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) =>
    res.sendStatus(200)
  )
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
      .populate("users")
      .populate("campsites")
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite) {
        console.log("Fount the favorite", favorite);
        const favoritedCampsites = favorite.campsites.reduce(
          (acc, campsite) => {
            return { ...acc, [campsite._id]: true };
          },
          {}
        );
        // console.log(favoritedCampsites);
        const filteredCampsites = req.body.filter(
          (campsite) => !favoritedCampsites[campsite._id]
        );
        favorite.campsites = [
          ...favorite.campsites,
          ...filteredCampsites.map((obj) => obj._id),
        ];
        console.log("fav", favorite.campsites);
        favorite
          .save()
          .then((favorite) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          })
          .catch((err) => next(err));
      } else {
        console.log("Not fount the favorite", favorite);

        Favorite.create({
          user: req.user._id,
          campsites: req.body,
        })
          .then((favorite) => {
            console.log("favorite Created ", favorite);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          })
          .catch((err) => next(err));
      }
    });
  })
  .put(cors.corsWithOptions, (req, res) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /campsites");
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user: req.user._id })
      .then((fav) => {
        res.statusCode = 200;
        if (fav) {
          res.setHeader("Content-Type", "application/json");
          res.json(fav);
        } else {
          res.setHeader("Content-Type", "text/plain");
          res.end("No favorite found");
        }
      })
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:campsiteId")
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res, next) => {
    res.statusCode = 403;
    res.end("GET operation not supported on /campsites");
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    Favorite.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite) {
        if (favorite.campsites.includes(req.params.campsiteId)) {
          res.setHeader("Content-Type", "text/plain");
          res.end("That campsite is already in the list of favorites!");
        } else {
          favorite.campsites.push(req.params.campsiteId);
          favorite
            .save()
            .then((favorite) => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        }
      } else {
        console.log("Not fount the favorite", favorite);

        Favorite.create({
          user: req.user._id,
          campsites: [req.params.campsiteId],
        })
          .then((favorite) => {
            console.log("favorite Created ", favorite);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(favorite);
          })
          .catch((err) => next(err));
      }
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      `PUT operation not supported on /favorites/${req.params.campsiteId}`
    );
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }).then((fav) => {
      if (fav) {
        if (fav.campsites.includes(req.params.campsiteId)) {
          fav.campsites = fav.campsites.filter(
            (campsite) => campsite.toString() !== req.params.campsiteId
          );

          fav
            .save()
            .then((favorite) => {
              console.log("favorite Deleted ", favorite);
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json(favorite);
            })
            .catch((err) => next(err));
        } else {
          res.setHeader("Content-Type", "text/plain");
          res.end("That campsite is not in the list of favorites!");
        }
      } else {
        res.setHeader("Content-Type", "text/plain");
        res.end("Favorite not found");
      }
    });
  });

module.exports = favoriteRouter;

"use strict";

const { Router } = require("express");
const placesRouter = new Router();
const Place = require("./../models/place");
const routeGuard = require("../middleware/route-guard");

placesRouter.get("/my-list", routeGuard, (req, res, next) => {
  const creator = req.user.id;
  Place.find({ creator })
    .then((places) => {
      console.log(places);
      res.render("places/my-list", { places });
    })
    .catch((error) => {
      next(error);
    });
});

placesRouter.get("/create", routeGuard, (req, res, next) => {
  res.render("places/create");
});

placesRouter.post("/create", routeGuard, (req, res, next) => {
  const name = req.body.name;
  const description = req.body.description;
  const latitude = req.body.latitude;
  const longitude = req.body.longitude;
  console.log(req.user.id);
  return Place.create({
    name,
    description,
    location: {
      coordinates: [longitude, latitude]
    },
    creator: req.user.id
  })
    .then((place) => {
      res.redirect("my-list");
    })
    .catch((error) => {
      next(error);
    });
});

placesRouter.get("/:id", (req, res, next) => {
  const id = req.params.id;
  Place.findById(id)
    .then((place) => {
      res.render("places/single", { place });
    })
    .catch((error) => {
      next(error);
    });
});

placesRouter.get("/update/:id", (req, res, next) => {
  const id = req.params.id;

  Place.findById(id)
    .then((place) => {
      res.render("places/update", { place });
    })
    .catch((error) => {
      next(error);
    });
});

placesRouter.post("/update/:id", (req, res, next) => {
  const id = req.params.id;
  const name = req.body.name;
  const description = req.body.description;
  const latitude = req.body.latitude;
  const longitude = req.body.longitude;

  const query = {
    name,
    description,
    location: {
      coordinates: [longitude, latitude]
    }
  };

  Place.findOneAndUpdate({ _id: id }, query)
    .then((place) => {
      res.redirect("/places/my-list");
    })
    .catch((error) => {
      next(error);
    });
});

module.exports = placesRouter;

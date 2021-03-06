"use strict";

const { Router } = require("express");
const placesRouter = new Router();
const Place = require("./../models/place");
const routeGuard = require("../middleware/route-guard");

//CLOUDINARY CONFIG-------------------------------
const multer = require("multer");
const cloudinary = require("cloudinary");
const multerStorageCloudinary = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multerStorageCloudinary({
  cloudinary,
  folder: "GEOARTPROJECT"
});

const uploader = multer({ storage });

//ROUTES CRUD ------------------------------------------

//PLACES LIST OF A USER
placesRouter.get("/my-list", routeGuard, (req, res, next) => {
  const creator = req.user.id;
  Place.find({ creator })

    .sort({ createdDate: -1 })
    .populate("creator")
    .then((places) => {
      //console.log(places);
      res.render("places/my-list", { places });
    })
    .catch((error) => {
      next(error);
    });
});

//CREATE NEW PLACE
placesRouter.get("/create", routeGuard, (req, res, next) => {
  res.render("places/create");
});

placesRouter.post("/create", routeGuard, uploader.single("picture"), (req, res, next) => {
  const name = req.body.name;
  const description = req.body.description;
  const latitude = req.body.latitude;
  const longitude = req.body.longitude;
  const pictureUrl = req.file.url;

  return Place.create({
    name,
    description,
    location: {
      coordinates: [longitude, latitude]
    },
    pictureUrl,
    creator: req.user.id
  })
    .then((place) => {
      res.redirect("my-list");
    })
    .catch((error) => {
      next(error);
    });
});

//MAP OF ALL PLACES
placesRouter.get("/map", (req, res, next) => {
  Place.find()
    .populate("creator")
    .then((places) => {
      res.render("places/map", { places });
    })
    .catch((error) => {
      next(error);
    });
});

//SINGLE PLACE VIEW
placesRouter.get("/:id", routeGuard, (req, res, next) => {
  const id = req.params.id;

  let isOwner;

  Place.findById(id)
    .populate("creator")
    .then((place) => {
      if (req.user && place.creator._id.toString() === req.user._id.toString()) {
        isOwner = true;
      }
      res.render("places/single", { place, isOwner });
    })
    .catch((error) => {
      next(error);
    });
});

//UPDATE PLACE
placesRouter.get("/update/:id", routeGuard, (req, res, next) => {
  const id = req.params.id;

  Place.findById(id)
    .then((place) => {
      res.render("places/update", { place });
    })
    .catch((error) => {
      next(error);
    });
});

placesRouter.post("/update/:id", routeGuard, uploader.single("picture"), (req, res, next) => {
  const id = req.params.id;
  const name = req.body.name;
  const description = req.body.description;
  const latitude = req.body.latitude;
  const longitude = req.body.longitude;

  //const pictureUrl= '';
  let pictureUrl = "";

  //Issue: req.file is not defined, therefore its impossible to acces the .url property
  let updatedDocument = {};
  if (req.file) {
    pictureUrl = req.file.url;
    updatedDocument = {
      name,
      description,
      location: {
        coordinates: [longitude, latitude]
      },
      pictureUrl
    };
  } else {
    updatedDocument = {
      name,
      description,
      location: {
        coordinates: [longitude, latitude]
      }
    };
  }

  /*const query = {
    name,
    description,
    location: {
      coordinates: [longitude, latitude]
    },
    pictureUrl
  };*/

  Place.findOneAndUpdate({ _id: id }, updatedDocument)
    .then((place) => {
      res.redirect("/places/my-list");
    })
    .catch((error) => {
      next(error);
    });
});

//Like System
placesRouter.post("/like/:id", routeGuard, (req, res, next) => {
  const postId = req.params.id;
  const userId = req.user._id;

  //FIND ID USER IN LIKED ARRAY
  Place.findOne({
    _id: postId,
    user_liked: userId
  })
    //.populate(user_liked)
    .then((thruty) => {
      if (!thruty) {
        //IF DON'T EXISTS INCREMENT 1 AND PUSH A USER TO THE ARRAY
        Place.findByIdAndUpdate(
          { _id: postId },
          { $inc: { like_count: 1 }, $push: { user_liked: userId } }
        )
          .then((place) => {
            res.redirect(`/places/${place._id}`);
          })
          .catch((error) => {
            next(error);
          });
      }
      //IF USER EXIST DECREMENT 1 AND SLICE THE USER FROM THE ARRAY
      else {
        Place.findByIdAndUpdate(
          { _id: postId },
          { $inc: { like_count: -1 }, $pull: { user_liked: userId } }
        )
          .then((place) => {
            res.redirect(`/places/${place._id}`);
          })
          .catch((error) => {
            next(error);
          });
      }
    })
    .catch((error) => {
      next(error);
    });
});

//DELETE PLACE
placesRouter.post("/delete/:id", routeGuard, (req, res, next) => {
  const id = req.params.id;

  Place.findOneAndDelete({
    _id: id,
    creator: req.user._id
  })
    .then((place) => {
      res.redirect("/");
    })
    .catch((error) => {
      next(error);
    });
});

//DIRECTIONS

placesRouter.get("/directions/:id", routeGuard, (req, res, next) => {
  const id = req.params.id;

  Place.findById(id)
    .then((place) => {
      res.render("places/directions", { place });
    })
    .catch((error) => {
      next(error);
    });
});

module.exports = placesRouter;

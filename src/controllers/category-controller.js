import { db } from "../models/db.js";
import { PlaceSpec } from "../models/joi-schemas.js";

export const categoryController = {
  index: {
    handler: async function (request, h) {
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      console.log("Inside dashboard; user: ");
      console.log(currentUser);
      const category = await db.categoryStore.getCategoryById(request.params.id);
      const privatePlaces = await db.placeStore.getPrivatePlacesByUserIdByCategoryId(currentUser._id, category._id);

      let publicPlaces = [];

      if (currentUser.admin) {
        // For admins, all places of a category are considered "public", except those private to the admin
        publicPlaces = category.places.filter((place) => !privatePlaces.some((privatePlace) => privatePlace._id.toString() === place._id.toString()));
      } else {
        // For normal users, only public places are considered "public", except those private to the user
        publicPlaces = await db.placeStore.getPublicPlacesByCategoryId(category._id);
        publicPlaces = publicPlaces.filter((place) => !privatePlaces.some((privatePlace) => privatePlace._id.toString() === place._id.toString()));
      }

      for (let i = 0; i < privatePlaces.length; i++) {
        const ratings = privatePlaces[i].ratings || [];
        let averageRating = 0;
        if (ratings.length > 0) {
          let sum = 0;
          for (let j = 0; j < ratings.length; j++) {
            sum += ratings[j].rating;
          }
          averageRating = (sum / ratings.length).toFixed(1);
        }
        privatePlaces[i].averageRating = averageRating;
      }

      for (let i = 0; i < publicPlaces.length; i++) {
        const ratings = publicPlaces[i].ratings || [];
        let averageRating = 0;
        if (ratings.length > 0) {
          let sum = 0;
          for (let j = 0; j < ratings.length; j++) {
            sum += ratings[j].rating;
          }
          averageRating = (sum / ratings.length).toFixed(1);
        }
        publicPlaces[i].averageRating = averageRating;
      }

      const viewData = {
        title: category.categoryName,
        privatePlaces: privatePlaces,
        publicPlaces: publicPlaces,
        categoryId: category._id,
      };
      return h.view("category-view", viewData);
    },
  },

  addPlace: {
    validate: {
      payload: PlaceSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("category-view", { title: "Add place error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      const newPlace = {
        name: request.payload.name,
        description: request.payload.description,
        latitude: Number(request.payload.latitude),
        longitude: Number(request.payload.longitude),
        userId: currentUser._id,
      };
      if (request.payload._private) {
        newPlace._private = true;
      }
      console.log(newPlace);
      await db.placeStore.addPlace(request.params.id, newPlace);
      return h.redirect("/category/" + request.params.id);
    },
  },

  deletePlace: {
    handler: async function (request, h) {
      await db.placeStore.deletePlace(request.params.id);
      return h.redirect("/category/" + request.params.categoryId);
    },
  },
};

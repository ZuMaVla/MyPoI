import { db } from "../models/db.js";
import { PlaceSpec } from "../models/joi-schemas.js";

export const categoryController = {
  index: {
    handler: async function (request, h) {
      const category = await db.categoryStore.getCategoryById(request.params.id);

      for (let i = 0; i < category.places.length; i++) {
        const place = category.places[i];
        const ratings = place.ratings || [];

        let averageRating = 0;
        if (ratings.length > 0) {
          let sum = 0;
          for (let j = 0; j < ratings.length; j++) {
            sum += ratings[j].rating;
          }
          averageRating = (sum / ratings.length).toFixed(1);
        }

        place.averageRating = averageRating;
      }

      const viewData = {
        title: category.categoryName,
        places: category.places,
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

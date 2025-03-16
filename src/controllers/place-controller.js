import { db } from "../models/db.js";
import { PlaceSpec } from "../models/joi-schemas.js";

export const placeController = {
  index: {
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const viewData = {
        title: currentPlace.name,
        place: currentPlace,
      };
      return h.view("place-view", viewData);
    },
  },

  addPhoto: {
    validate: {
      payload: PlaceSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("category-view", { title: "Add place error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const newPlace = {
        name: request.payload.name,
        description: request.payload.description,
        latitude: Number(request.payload.latitude),
        longitude: Number(request.payload.longitude),
      };
      await db.placeStore.addPlace(request.params.id, newPlace);
      return h.redirect("/category/" + request.params.id);
    },
  },

  addComment: {
    validate: {
      payload: PlaceSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("category-view", { title: "Add place error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const newPlace = {
        name: request.payload.name,
        description: request.payload.description,
        latitude: Number(request.payload.latitude),
        longitude: Number(request.payload.longitude),
      };
      await db.placeStore.addPlace(request.params.id, newPlace);
      return h.redirect("/category/" + request.params.id);
    },
  },

  requestDeletePlace: {
    handler: async function (request, h) {
      await db.placeStore.deletePlace(request.params.id);
      return h.redirect("/category/" + request.params.categoryId);
    },
  },
};

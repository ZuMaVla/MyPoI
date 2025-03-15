import { v4 } from "uuid";
import { db } from "./store-utils.js";

export const placeJsonStore = {
  async getAllPlaces() {
    await db.read();
    return db.data.places;
  },

  async addPlace(categoryId, place) {
    await db.read();
    place._id = v4();
    place.categoryId = categoryId;
    db.data.places.push(place);
    await db.write();
    return place;
  },

  async getPlacesByCategoryId(id) {
    await db.read();
    let foundPlaces = db.data.places.filter((place) => place.categoryId === id);
    if (!foundPlaces) {
      foundPlaces = null;
    }
    return foundPlaces;
  },

  async getPlaceById(id) {
    await db.read();
    let foundPlace = db.data.places.find((place) => place._id === id);
    if (!foundPlace) {
      foundPlace = null;
    }
    return foundPlace;
  },

  async getCategoryPlaces(categoryId) {
    await db.read();
    let foundPlaces = places.filter((place) => place.categoryId === categoryId);
    if (!foundPlaces) {
      foundPlaces = null;
    }
    return foundPlaces;
  },

  async deletePlace(id) {
    await db.read();
    const index = db.data.places.findIndex((place) => place._id === id);
    if (index !== -1) db.data.places.splice(index, 1);
    await db.write();
  },

  async deleteAllPlaces() {
    db.data.places = [];
    await db.write();
  },

  async updatePlace(place, updatedPlace) {
    place.name = updatedPlace.name;
    place.description = updatedPlace.description;
    place.latitude = updatedPlace.latitude;
    place.longitude = updatedPlace.longitude;
    await db.write();
  },
};

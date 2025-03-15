import { v4 } from "uuid";

let places = [];

export const placeMemStore = {
  async getAllPlaces() {
    return places;
  },

  async addPlace(categoryId, place) {
    place._id = v4();
    place.categoryId = categoryId;
    places.push(place);
    return place;
  },

  async getPlacesByCategoryId(id) {
    return places.filter((place) => place.categoryId === id);
  },

  async getPlaceById(id) {
    let foundPlace = places.find((place) => place._id === id);
    if (!foundPlace) {
      foundPlace = null;
    }
    return foundPlace;
  },

  async getCategoryPlaces(categoryId) {
    let foundPlaces = places.filter((place) => place.categoryId === categoryId);
    if (!foundPlaces) {
      foundPlaces = null;
    }
    return foundPlaces;
  },

  async deletePlace(id) {
    const index = places.findIndex((place) => place._id === id);
    if (index !== -1) places.splice(index, 1);
  },

  async deleteAllPlaces() {
    places = [];
  },

  async updatePlace(place, updatedPlace) {
    place.name = updatedPlace.name;
    place.description = updatedPlace.description;
    place.latitude = updatedPlace.latitude;
    place.longitude = updatedPlace.longitude;
  },
};

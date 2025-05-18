import Mongoose from "mongoose";
import { Place } from "./place.js";

export const placeMongoStore = {
  async getAllPlaces() {
    const places = await Place.find().lean();
    return places;
  },

  async addPlace(categoryId, place) {
    place.categoryId = categoryId;
    const newPlace = new Place(place);
    const placeObj = await newPlace.save();
    return this.getPlaceById(placeObj._id);
  },

  async getPlacesByCategoryId(id) {
    const places = await Place.find({ categoryId: id }).lean();
    return places;
  },

  async getPublicPlacesByCategoryId(id) {
    const publicPlaces = await Place.find({ categoryId: id, $or: [{ _private: { $exists: false } }, { _private: false }] }).lean();
    return publicPlaces;
  },

  async getPlaceById(id) {
    if (Mongoose.isValidObjectId(id)) {
      const place = await Place.findOne({ _id: id }).lean();
      return place;
    }
    return null;
  },

  async getPrivatePlacesByUserIdByCategoryId(userId, categoryId) {
    const privatePlaces = await Place.find({ categoryId: categoryId, userId: userId, _private: { $exists: true } }).lean();
    return privatePlaces;
  },

  async deletePlace(id) {
    try {
      await Place.deleteOne({ _id: id });
    } catch (error) {
      console.log("bad id");
    }
  },

  async deleteAllPlaces() {
    await Place.deleteMany({});
  },

  async updatePlace(place, updatedPlace) {
    await Place.updateOne({ _id: place._id }, updatedPlace);
  },

  async addRating(user, place, rating) {
    const ratings = place.ratings;
    if (ratings.length === 0) {
      place.ratings.push({ rating: rating, userId: user._id });
    } else {
      let newRating = true;
      for (let i = 0; i < ratings.length; i++) {
        if (ratings[i].userId.toString() === user._id.toString()) {
          newRating = false;
          ratings[i].rating = rating;
        }
      }
      if (newRating) {
        place.ratings.push({ rating: rating, userId: user._id });
      }
    }
    await this.updatePlace(place, place);
  },
};

import Mongoose from "mongoose";

const { Schema } = Mongoose;

const placeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: false,
    trim: true,
  },
  latitude: {
    type: Number,
    required: true, // Latitude is required
    min: 51.3, // Min latitude for Ireland
    max: 55.5, // Max latitude for Ireland
  },
  longitude: {
    type: Number,
    required: true, // Longitude is required
    min: -10.5, // Min longitude for Ireland
    max: -5.5, // Max longitude for Ireland
  },
  photos: {
    type: [
      {
        link: {
          type: String,
          required: true, // link is always required (if a photo is attempted to be added)
        },
        caption: {
          type: String,
          required: true, // caption is always required
        },
        show: {
          type: Boolean,
          default: false, // Set default to false (not approved to be shown by default)
        },
      },
    ],
    default: [], // Default value for the photos array is an empty array
  },
  comments: {
    type: [
      {
        comment: {
          type: String,
          required: true,
        },
        commentDate: {
          type: Date,
          default: Date.now,
        },
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    default: [],
  },
  ratings: {
    type: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5, // or whatever your rating range is
        },
      },
    ],
    default: [],
  },
  deleteRequests: {
    type: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: {
          type: String,
          required: true,
        },
        view: {
          type: Boolean,
          default: false, // not yet reviewed by admin
        },
        createdAt: {
          type: Date,
          default: Date.now, // optional, useful for tracking request age
        },
      },
    ],
    default: [], // start with an empty array
  },

  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category",
  },
});
export const Place = Mongoose.model("Place", placeSchema);

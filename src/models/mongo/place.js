import Mongoose from "mongoose";

const { Schema } = Mongoose;

const placeSchema = new Schema({
  name: String,
  description: String,
  latitude: Number,
  longitude: Number,
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category",
  },
});

export const Place = Mongoose.model("Place", placeSchema);

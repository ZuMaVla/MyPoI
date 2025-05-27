import Mongoose from "mongoose";

const { Schema } = Mongoose;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 4,
  },
  admin: {
    type: Boolean,
    required: false,
  },
  favouritePlaces: {
    type: [String], // <- store _ids as strings
    required: false,
  },
});
export const User = Mongoose.model("User", userSchema);

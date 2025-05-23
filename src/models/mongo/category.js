import Mongoose from "mongoose";

const { Schema } = Mongoose;

const categorySchema = new Schema({
  categoryName: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export const Category = Mongoose.model("Category", categorySchema);

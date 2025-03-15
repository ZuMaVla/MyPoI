import { v4 } from "uuid";
import { placeMemStore } from "./place-mem-store.js";

let categories = [];

export const categoryMemStore = {
  async getAllCategories() {
    return categories;
  },

  async getUserCategories(userid) {
    return categories.filter((category) => category.userid === userid);
  },

  async addCategory(category) {
    category._id = v4();
    categories.push(category);
    return category;
  },

  async getCategoryById(id) {
    let list = categories.find((category) => category._id === id);
    if (list) {
      list.places = await placeMemStore.getPlacesByCategoryId(list._id);
    } else {
      list = null;
    }
    return list;
  },

  async deleteCategoryById(id) {
    let list = categories.filter((category) => category._id !== id);
    categories = list;
  },

  async deleteAllCategories() {
    categories = [];
  },
};

import { db } from "../models/db.js";
import { CategorySpec } from "../models/joi-schemas.js";
import sanitizeHtml from "sanitize-html";

export const dashboardController = {
  index: {
    auth: "session",
    handler: async function (request, h) {
      const loggedInUser = request.auth.credentials;
      console.log("Inside dashboard-controller: ", loggedInUser);
      const categories = await db.categoryStore.getAllCategories();
      console.log(categories);
      const viewData = {
        title: "My Point of Interest Dashboard",
        user: loggedInUser,
        categoriesToView: categories,
      };
      return h.view("dashboard-view", viewData);
    },
  },

  addCategory: {
    validate: {
      payload: CategorySpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("dashboard-view", { title: "Add Category error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const loggedInUser = request.auth.credentials;

      const cleanCategoryName = sanitizeHtml(request.payload.categoryName, {
        allowedTags: [],
        allowedAttributes: {},
      });
      const newCategory = {
        userId: loggedInUser._id,
        categoryName: cleanCategoryName,
      };

      //  const newCategory = {
      //    userId: loggedInUser._id,
      //    categoryName: request.payload.categoryName,
      //  };
      await db.categoryStore.addCategory(newCategory);
      return h.redirect("/dashboard");
    },
  },

  deleteCategory: {
    handler: async function (request, h) {
      await db.categoryStore.deleteCategoryById(request.params.id);
      return h.redirect("/dashboard");
    },
  },
};

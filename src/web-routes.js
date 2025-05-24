import { accountsController } from "./controllers/accounts-controller.js";
import { dashboardController } from "./controllers/dashboard-controller.js";
import { categoryController } from "./controllers/category-controller.js";
import { placeController } from "./controllers/place-controller.js";
import { aboutController } from "./controllers/about-controller.js";

export const webRoutes = [
  { method: "GET", path: "/", config: accountsController.index },
  { method: "GET", path: "/signup", config: accountsController.showSignup },
  { method: "GET", path: "/login", config: accountsController.showLogin },
  { method: "GET", path: "/logout", config: accountsController.logout },
  { method: "POST", path: "/register", config: accountsController.signup },
  { method: "POST", path: "/authenticate", config: accountsController.login },
  { method: ["GET", "POST"], path: "/oauth2/redirect/google", config: accountsController.googleLogin },
  { method: "GET", path: "/about", config: aboutController.index },
  { method: "GET", path: "/dashboard", config: dashboardController.index },
  { method: "POST", path: "/dashboard/addcategory", config: dashboardController.addCategory },
  { method: "GET", path: "/category/{id}", config: categoryController.index },
  { method: "POST", path: "/category/{id}/addplace", config: categoryController.addPlace },
  { method: "GET", path: "/delete_category/{id}", config: dashboardController.deleteCategory },
  { method: "GET", path: "/category/{categoryId}/place/{id}", config: placeController.index },
  { method: "GET", path: "/category/{categoryId}/delete_place/{id}", config: categoryController.deletePlace },
  { method: "POST", path: "/category/{categoryId}/place/{id}/addphoto", config: placeController.addPhoto },
  { method: "GET", path: "/category/{categoryId}/place/{id}/toggleprivacy", config: placeController.togglePrivacy },
  { method: "POST", path: "/category/{categoryId}/place/{id}/addcomment", config: placeController.addComment },
  { method: "GET", path: "/category/{categoryId}/place/{id}/editcomment/{commentId}", config: placeController.editComment },
  { method: "POST", path: "/category/{categoryId}/place/{id}/editcomment/{commentId}", config: placeController.replaceComment },
  { method: "GET", path: "/category/{categoryId}/place/{id}/deletecomment/{commentId}", config: placeController.deleteComment },
  { method: "POST", path: "/category/{categoryId}/place/{id}/requestdelete", config: placeController.requestDeletePlace },
  { method: "POST", path: "/category/{categoryId}/place/{id}/addvote", config: placeController.addVote },
];

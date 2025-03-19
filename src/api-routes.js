import { userApi } from "./api/user-api.js";
//import { categoryApi } from "./api/category-api.js";
//import { placeApi } from "./api/place-api.js";

export const apiRoutes = [
  { method: "POST", path: "/api/users/authenticate", config: userApi.authenticate },

  { method: "POST", path: "/api/users", config: userApi.create },
  { method: "GET", path: "/api/users/{id}", config: userApi.findOne },
  { method: "GET", path: "/api/users", config: userApi.find },
  { method: "DELETE", path: "/api/users/{id}", config: userApi.deleteOne },
  { method: "DELETE", path: "/api/users", config: userApi.deleteAll },

  //  { method: "POST", path: "/api/categories", config: categoryApi.create },                // not yet realised (future release(s) perhaps)
  //  { method: "GET", path: "/api/categories/{id}", config: categoryApi.findOne },
  //  { method: "GET", path: "/api/categories", config: categoryApi.find },
  //  { method: "DELETE", path: "/api/categories/{id}", config: categoryApi.deleteOne },

  //  { method: "POST", path: "/api/categories/{id}/places", config: placeApi.create },
  //  { method: "POST", path: "/api/places/{id}/comment", config: placeApi.comment },
  //  { method: "POST", path: "/api/places/{id}/rate", config: placeApi.rate },
  //  { method: "GET", path: "/api/places/{id}", config: placeApi.findOne },
  //  { method: "GET", path: "/api/categories/{id}/places", config: placeApi.find },
  //  { method: "DELETE", path: "/api/places/{id}", config: placeApi.deleteOne },
  //  { method: "DELETE", path: "/api/categories/{id}/places", config: placeApi.deleteAll },
];

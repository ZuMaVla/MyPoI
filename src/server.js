import Hapi from "@hapi/hapi";
import HapiAuthJwt2 from "hapi-auth-jwt2";
import Vision from "@hapi/vision";
import Handlebars from "handlebars";
import path from "path";
import { fileURLToPath } from "url";
import { webRoutes } from "./web-routes.js";
import { apiRoutes } from "./api-routes.js";
import { db } from "./models/db.js";
import Cookie from "@hapi/cookie";
import { accountsController } from "./controllers/accounts-controller.js";
import dotenv from "dotenv";
import Joi from "joi";
import { validate } from "./api/jwt-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function init() {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: "0.0.0.0",
  });
  await server.register(Vision);
  await server.register(Cookie);
  await server.register(HapiAuthJwt2);

  server.auth.strategy("jwt", "jwt", {
    // Authentification for API
    key: process.env.cookie_password,
    validate: validate,
    verifyOptions: { algorithms: ["HS256"] },
  });

  server.auth.strategy("session", "cookie", {
    // Authentification for Web
    cookie: {
      name: process.env.cookie_name,
      password: process.env.cookie_password,
      isSecure: false,
    },
    redirectTo: "/",
    validate: accountsController.validate,
  });
  server.auth.default("session");

  server.validator(Joi);

  server.views({
    engines: {
      hbs: Handlebars,
    },
    relativeTo: __dirname,
    path: "./views",
    layoutPath: "./views/layouts",
    partialsPath: "./views/partials",
    layout: "layout",
    isCached: false,
  });
  Handlebars.registerHelper("eq", (a, b) => a === b);
  db.init("mongo");
  server.route(webRoutes);
  server.route(apiRoutes);
  await server.start();
  console.log("Server running on %s", server.info.uri);
  return server;
}

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

if (process.env.NODE_ENV !== "production") {
  const result = dotenv.config({ path: path.resolve(__dirname, "../.env") });
  if (result.error) {
    console.log("Warning: .env file not found.");
  }
}

if (process.env.NODE_ENV !== "test") {
  // Only run the server if NOT in test mode
  init();
}

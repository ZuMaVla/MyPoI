import Boom from "@hapi/boom";
import { db } from "../models/db.js";
import { UserSpec, UserCredentialsSpec, IdSpec, UserArray, UserSpecPlus, JwtAuth } from "../models/joi-schemas.js";
import { validationError } from "./logger.js";
import { createToken, isAdmin } from "./jwt-utils.js";

export const userApi = {
  authenticate: {
    auth: false,
    tags: ["api"],
    description: "User Authenticate",
    notes: "For a user with a valid email/password pair, create and return a JWT token",
    validate: { payload: UserCredentialsSpec, failAction: validationError },
    response: { schema: JwtAuth, failAction: validationError },
    handler: async function (request, h) {
      try {
        const user = await db.userStore.getUserByEmail(request.payload.email);
        if (!user) {
          return Boom.unauthorized("User not found");
        }
        if (user.password !== request.payload.password) {
          return Boom.unauthorized("Password does not match!");
        }
        const token = createToken(user);
        return h.response({ success: true, token: token }).code(201);
      } catch (err) {
        return Boom.serverUnavailable("Database Error");
      }
    },
  },

  // To report amount of connected users
  reportStat: {
    auth: false,
    tags: ["api"],
    description: "Users logged in count",
    notes: "For anyone: returns amount of users currently logged in",
    handler: async function (request, h) {
      return db.userCount;
    },
  },

  create: {
    auth: false,
    tags: ["api"],
    validate: { payload: UserSpec, failAction: validationError },
    description: "Creates a new user",
    notes: "Returns the newly created user",
    response: { schema: UserSpecPlus, failAction: validationError },
    handler: async function (request, h) {
      const user = request.payload;
      try {
        const newUser = await db.userStore.addUser(user);
        return h.response(newUser).code(201);
      } catch (err) {
        return Boom.serverUnavailable("Database Error");
      }
    },
  },

  findOne: {
    auth: { strategy: "jwt" },
    tags: ["api"],
    description: "Gets a specific user",
    notes: "Returns user details",
    validate: { params: { id: IdSpec }, failAction: validationError },
    response: { schema: UserSpecPlus, failAction: validationError },
    handler: async function (request, h) {
      try {
        const user = await db.userStore.getUserById(request.params.id);
        if (!user) {
          return Boom.notFound("No user with this id");
        }
        return user;
      } catch (err) {
        return Boom.serverUnavailable("Database Error");
      }
    },
  },

  find: {
    auth: { strategy: "jwt" },
    tags: ["api"],
    description: "Gets all users of this service",
    notes: "Returns details of all users",
    response: { schema: UserArray, failAction: validationError },
    handler: async function (request, h) {
      try {
        const loggedInUser = await db.userStore.getUserByEmail(request.auth.credentials.email);
        if (await isAdmin(loggedInUser.email)) {
          const users = await db.userStore.getAllUsers();
          return users;
        }
        console.log("NOT an admin!");
        return h.response({ error: "Unauthorized: Admin role required" }).code(403);
      } catch (err) {
        return Boom.serverUnavailable("Database Error:", err);
      }
    },
  },

  deleteOne: {
    auth: { strategy: "jwt" },
    tags: ["api"],
    validate: { params: { id: IdSpec }, failAction: validationError },
    description: "Delete specified user",
    notes: "Single user removed from the service",
    handler: async function (request, h) {
      try {
        const loggedInUser = await db.userStore.getUserByEmail(request.auth.credentials.email);
        const userToDeleteId = request.params.id;

        const admin = await isAdmin(loggedInUser.email);
        const isSelf = loggedInUser._id.toString() === userToDeleteId;

        if (admin || isSelf) {
          console.log(`Authorized delete attempt by ${loggedInUser.email} | Admin: ${admin} | Same user: ${isSelf}`);
          await db.userStore.deleteUserById(userToDeleteId);
          return h.response().code(204);
        }

        console.log(`Unauthorized delete attempt by ${loggedInUser.email} | Admin: ${admin} | Same user: ${isSelf}`);
        return h.response({ status: "ignored", message: "Not authorized to delete this user" }).code(200);
      } catch (err) {
        return Boom.serverUnavailable("Database Error");
      }
    },
  },

  deleteAll: {
    auth: { strategy: "jwt" },
    tags: ["api"],
    description: "Delete all users",
    notes: "All users removed from the service",
    handler: async function (request, h) {
      try {
        const loggedInUser = await db.userStore.getUserByEmail(request.auth.credentials.email);
        if (await isAdmin(loggedInUser.email)) {
          await db.userStore.deleteAll();
          return h.response().code(204);
        }
        return h.response({ error: "Unauthorized: Admin role required" }).code(403);
      } catch (err) {
        return Boom.serverUnavailable("Database Error");
      }
    },
  },
};

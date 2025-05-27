import { db } from "../models/db.js";
import { UserSpec, UserCredentialsSpec } from "../models/joi-schemas.js";
import fs from "fs";
import bcrypt from "bcrypt";

export const accountsController = {
  index: {
    auth: false,
    handler: function (request, h) {
      const serverId = fs.readFileSync("./server_id.txt", "utf8").trim();
      const query = {};
      query.next = request.query.next;
      const viewData = {
        query: query,
        serverId: serverId, //for AWS: to store instance ID
        title: "Welcome to MyPoI",
      };
      return h.view("main", viewData);
    },
  },

  showSignup: {
    auth: false,
    handler: function (request, h) {
      const query = {};
      query.next = request.query.next;
      const viewData = {
        query: query,
        title: "Sign up for MyPoI",
      };

      return h.view("signup-view", viewData);
    },
  },

  signup: {
    auth: false,
    validate: {
      payload: UserSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("signup-view", { title: "Sign up error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const user = request.payload;
      const saltRounds = 10;
      user.password = await bcrypt.hash(user.password, saltRounds);
      await db.userStore.addUser(user);
      let next = request.query.next ? `/login?next=${request.query.next}` : "/login";
      return h.redirect(next);
    },
  },

  showLogin: {
    auth: false,
    handler: function (request, h) {
      const query = {};
      query.next = request.query.next;
      const viewData = {
        query: query,
        title: "Login to MyPoI",
      };
      return h.view("login-view", viewData);
    },
  },

  login: {
    auth: false,
    validate: {
      payload: UserCredentialsSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h
          .view("login-view", {
            title: "Log in error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      const { email, password } = request.payload;
      const user = await db.userStore.getUserByEmail(email);
      const passwordsMatch = user ? await bcrypt.compare(password, user.password) : false;

      if (!passwordsMatch) {
        return h.redirect("/login"); // Redirect to login page again
      }

      request.cookieAuth.set({ id: user._id });

      console.log("=== Cookie Auth Set ===");
      console.log("User ID:", user._id);
      console.log("Request.auth:", request.auth);
      console.log("Request.state:", request.state);
      console.log("Cookie (via request.headers.cookie):", request.headers.cookie);
      console.log("=======================");

      db.userCount += 1; // To document the amount of users logged in

      let next = decodeURIComponent(request.query.next || "/dashboard");

      const redirectTo = next || "/dashboard";
      return h.redirect(redirectTo);
    },
  },

  googleLogin: {
    auth: {
      strategies: ["google", "session"],
      mode: "try",
    },
    //    auth: "google",
    handler: async function (request, h) {
      if (!request.auth.isAuthenticated) {
        return h.redirect("/");
      }

      const googleProfile = request.auth.credentials.profile;
      let user = await db.userStore.getUserByEmail(googleProfile.email);
      console.log("Google response:", googleProfile);
      if (!user) {
        // Create a new user if not exists
        const newUser = {
          firstName: googleProfile.name.given_name,
          lastName: googleProfile.name.family_name,
          email: googleProfile.email,
          password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), //random password (not in use anyways)
        };
        user = await db.userStore.addUser(newUser);
        console.log("Added user: ", user);
      }

      request.cookieAuth.clear();
      h.state(
        process.env.cookie_name,
        { id: user._id },
        {
          isSecure: false, // match my cookie config
          path: "/",
        }
      );

      console.log("=== Cookie Auth Set ===");
      console.log("User ID:", user._id);
      console.log("Request.auth:", request.auth);
      console.log("Request.state:", request.state);
      console.log("Cookie (via request.headers.cookie):", request.headers.cookie);
      console.log("=======================");

      db.userCount += 1; // To document the amount of users logged in
      return h.redirect("/dashboard");
    },
  },

  logout: {
    auth: false,
    handler: function (request, h) {
      request.cookieAuth.clear();
      db.userCount -= 1; // To document the amount of users logged in
      return h.redirect("/");
    },
  },

  addFavourite: {
    auth: "session",
    handler: async function (request, h) {
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      if (!currentUser) {
        console.log("Unidentified user");
      } else {
        const place = await db.placeStore.getPlaceById(request.params.id);
        if (!place) {
          console.log("Incorrect place");
        } else {
          if (!currentUser.favouritePlaces) {
            currentUser.favouritePlaces = [];
          }
          currentUser.favouritePlaces.push(place._id.toString());
          await db.userStore.updateUser(currentUser, currentUser);
        }
      }
      return h.redirect(`/category/${request.params.categoryId}`);
    },
  },

  removeFavourite: {
    auth: "session",
    handler: async function (request, h) {
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      if (!currentUser) {
        console.log("Unidentified user");
      } else {
        const place = await db.placeStore.getPlaceById(request.params.id);
        if (!place) {
          console.log("Incorrect place");
        } else {
          const placeIdToRemove = place._id.toString();
          currentUser.favouritePlaces = currentUser.favouritePlaces.filter((strId) => strId !== placeIdToRemove);
          await db.userStore.updateUser(currentUser, currentUser);
        }
      }
      return h.redirect(`/category/${request.params.categoryId}`);
    },
  },

  async validate(request, session) {
    const user = await db.userStore.getUserById(session.id);
    console.log("Inside validate: ", user._id);
    if (!user) {
      return { isValid: false };
    }
    return { isValid: true, credentials: user };
  },
};

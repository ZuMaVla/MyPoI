import { db } from "../models/db.js";
import { UserSpec, UserCredentialsSpec } from "../models/joi-schemas.js";
import fs from "fs";
import bcrypt from "bcrypt";

export const accountsController = {
  index: {
    auth: false,
    handler: function (request, h) {
      const serverId = fs.readFileSync("./server_id.txt", "utf8").trim();
      const viewData = {
        serverId: serverId,
        title: "Welcome to MyPoI",
      };
      return h.view("main", viewData);
      //return h.view("main", { title: "Welcome to MyPoI " });
    },
  },

  showSignup: {
    auth: false,
    handler: function (request, h) {
      return h.view("signup-view", { title: "Sign up for MyPoI" });
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
      return h.redirect("/");
    },
  },

  showLogin: {
    auth: false,
    handler: function (request, h) {
      return h.view("login-view", { title: "Login to MyPoI" });
    },
  },

  login: {
    auth: false,
    validate: {
      payload: UserCredentialsSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("login-view", { title: "Log in error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const { email, password } = request.payload;
      const user = await db.userStore.getUserByEmail(email);
      const passwordsMatch = user ? await bcrypt.compare(password, user.password) : false;
      if (!passwordsMatch) {
        return h.redirect("/");
      }
      console.log(user._id);
      request.cookieAuth.set({ id: user._id });

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

  async validate(request, session) {
    const user = await db.userStore.getUserById(session.id);
    console.log("Inside validate: ", user._id);
    if (!user) {
      return { isValid: false };
    }
    return { isValid: true, credentials: user };
  },
};

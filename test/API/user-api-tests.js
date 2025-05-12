import { assert } from "chai";
import { assertSubset } from "../test-utils.js";
import { maggie, testUsers } from "../fixtures.js";
import { db } from "../../src/models/db.js";
import { createTestServer } from "./_test-helpers.js";
import { createToken, decodeToken } from "../../src/api/jwt-utils.js"; // Make sure decodeToken is imported
import axios from "axios";
import "../../src/api/user-api.js"; // path relative to the test file

let server;
let request;

suite("User API tests", () => {
  let existingUsers;
  console.log("🚀 Test file loaded"); // top-level
  // suiteSetup - Save existing users before tests start
  suiteSetup(async () => {
    console.log("🚀 suitSetup entered"); // top-level
    // Create and start test server
    server = await createTestServer();
    console.log("🚀 Server started"); // top-level
    const address = server.info.uri;

    console.log("server is runnung on the address:", address);

    // Setup Axios instance
    request = axios.create({ baseURL: address });

    // Fetch existing users from the production database
    existingUsers = await db.userStore.getAllUsers();

    // Remove all users to prepare for the tests
    await db.userStore.deleteAll();

    // Insert test users directly to DB
    for (const user of testUsers) {
      await db.userStore.addUser(user);
    }
  });

  setup(async () => {
    await db.userStore.deleteAll();
    for (let i = 0; i < testUsers.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      testUsers[i] = await db.userStore.addUser(testUsers[i]);
    }
  });

  // Test: User Registration
  test("create a user with API", async () => {
    const user_ = maggie;
    const res = await request.post("/api/users", user_);
    const newUser = res.data;
    assert.equal(res.status, 201);
    assert.exists(res.data._id);
    assert.equal(assertSubset(user_, newUser), true);
  });

  // Test: User Authentication
  test("should authenticate a user and return JWT", async () => {
    const credentials = {
      email: testUsers[0].email,
      password: testUsers[0].password,
    };
    const res = await request.post("/api/users/authenticate", credentials);
    assert.equal(res.status, 201);
    assert.exists(res.data.token);
    const decodedToken = decodeToken(res.data.token);
    assert.equal(decodedToken.email, credentials.email);
  });

  // Test: Fetch All Users (admin-only)
  test("should fetch a list of users for admin", async () => {
    const credentials = {
      email: testUsers[0].email,
      password: testUsers[0].password,
    };
    const authRes = await request.post("/api/users/authenticate", credentials);
    const token = authRes.data.token;
    const res = await request.get(`/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    assert.isArray(res.data);
    assert.equal(res.data.length, testUsers.length);
  });

  // Test: Fetch Single User by ID
  test("should fetch a specific user", async () => {
    const credentials = {
      email: testUsers[1].email,
      password: testUsers[1].password,
    };
    const authRes = await request.post("/api/users/authenticate", credentials);
    const token = authRes.data.token;
    const allUsers = await db.userStore.getAllUsers();
    const targetUser = allUsers[0];
    const res = await request.get(`/api/users/${targetUser._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    assert.exists(res.data._id);
    assert.equal(res.data._id, targetUser._id);
  });

  // Test: Delete All Users (admin-only)
  test("should delete all users (admin-only)", async () => {
    const credentials = {
      email: testUsers[0].email,
      password: testUsers[0].password,
    };
    const authRes = await request.post("/api/users/authenticate", credentials);
    const token = authRes.data.token;
    const res = await request.delete("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 204);
    const usersAfterDeletion = await db.userStore.getAllUsers();
    assert.equal(usersAfterDeletion.length, 0);
  });

  //Test: Delete another user by admin
  test("Admin can delete another user", async () => {
    const credentials = {
      email: testUsers[0].email, // Assumed admin
      password: testUsers[0].password,
    };
    const authRes = await request.post("/api/users/authenticate", credentials);
    const token = authRes.data.token;
    const userToDelete = testUsers[1]; // Non-admin user
    const res = await request.delete(`/api/users/${userToDelete._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const deletedUser = await db.userStore.getUserById(userToDelete._id);
    assert.isNull(deletedUser);
    assert.equal(res.status, 204);
  });

  //Tect: Delete another user by non-admin(fail)
  test("Non-admin cannot delete another user", async () => {
    const credentials = {
      email: testUsers[1].email, // Normal user
      password: testUsers[1].password,
    };
    const authRes = await request.post("/api/users/authenticate", credentials);
    const token = authRes.data.token;
    const userToDelete = testUsers[0]; // Another user
    const res = await request.delete(`/api/users/${userToDelete._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const allUsers = await db.userStore.getAllUsers();
    assert.equal(testUsers.length, allUsers.length);
    assert.equal(res.status, 200); // Expect a rejection with status 200 and a message
    assert.equal(res.data.status, "ignored");
    assert.equal(res.data.message, "Not authorized to delete this user");
  });

  //Test: Delete user by him(her)self
  test("User can delete themselves", async () => {
    const credentials = {
      email: testUsers[1].email, // normal user
      password: testUsers[1].password,
    };
    // Authenticate the user
    const authRes = await request.post("/api/users/authenticate", credentials);
    const token = authRes.data.token;
    const userToDelete = testUsers[1]; // same user
    // Attempt self-deletion
    const res = await request.delete(`/api/users/${userToDelete._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const deletedUser = await db.userStore.getUserById(userToDelete._id);
    assert.isNull(deletedUser);
    // Log response details
    assert.equal(res.status, 204); // Expect successful deletion
  });

  // suiteTeardown - Restore original users after tests complete
  suiteTeardown(async () => {
    await db.userStore.deleteAll(); // Remove test users
    // Restore original users
    for (const user of existingUsers) {
      await db.userStore.addUser(user);
    }

    if (server) {
      console.log("Stopping server...");
      await server.stop();
      console.log("Server stopped - OK.");
    }
  });
});

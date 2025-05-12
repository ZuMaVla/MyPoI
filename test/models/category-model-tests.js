import { assert } from "chai";
import { assertSubset } from "../test-utils.js";
import { db } from "../../src/models/db.js";
import { testCategories, nature, maggie } from "../fixtures.js";

suite("Category Model tests", () => {
  let existingCategories; // Variable to save existing categories from DB before testing
  let defaultUser; // Creating variable for a default user on behalf of which all tests will be run

  suiteSetup(async () => {
    // Initialisation subroutine (once before all tests)
    db.init("mongo");
    existingCategories = await db.categoryStore.getAllCategories(); // Saving existing DB content (categories) to the variable
    defaultUser = await db.userStore.addUser(maggie);
    nature.userId = defaultUser._id;
    for (let i = 0; i < testCategories.length; i++) {
      testCategories[i].userId = defaultUser._id;
    }
  });

  setup(async () => {
    // Reset suroutine (before each test)
    await db.categoryStore.deleteAllCategories();
    for (let i = 0; i < testCategories.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      testCategories[i] = await db.categoryStore.addCategory(testCategories[i]);
    }
  });

  test("create a category", async () => {
    const category = await db.categoryStore.addCategory(nature);
    assertSubset(nature, category);
    assert.isDefined(category._id);
  });

  test("delete all categories", async () => {
    let returnedCategories = await db.categoryStore.getAllCategories();
    assert.equal(returnedCategories.length, testCategories.length);
    await db.categoryStore.deleteAllCategories();
    returnedCategories = await db.categoryStore.getAllCategories();
    assert.equal(returnedCategories.length, 0);
  });

  test("get a category - success", async () => {
    const category = await db.categoryStore.addCategory(nature);
    const returnedCategory = await db.categoryStore.getCategoryById(category._id);
    assertSubset(nature, returnedCategory);
  });

  test("delete One Category - success", async () => {
    const id = testCategories[0]._id;
    await db.categoryStore.deleteCategoryById(id);
    const returnedCategories = await db.categoryStore.getAllCategories();
    assert.equal(returnedCategories.length, testCategories.length - 1);
    const deletedCategory = await db.categoryStore.getCategoryById(id);
    assert.isNull(deletedCategory);
  });

  test("get a category - bad params", async () => {
    assert.isNull(await db.categoryStore.getCategoryById(""));
    assert.isNull(await db.categoryStore.getCategoryById());
  });

  test("delete One Category - fail", async () => {
    await db.categoryStore.deleteCategoryById("bad-id");
    const allCategories = await db.categoryStore.getAllCategories();
    assert.equal(testCategories.length, allCategories.length);
  });

  suiteTeardown(async () => {
    // Restore original data after all tests
    await db.categoryStore.deleteAllCategories();
    await db.userStore.deleteUserById(defaultUser._id);
    for (const category of existingCategories) {
      await db.categoryStore.addCategory(category);
    }
    db.close();
  });
});

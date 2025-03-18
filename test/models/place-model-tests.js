import { assert } from "chai";
import { db } from "../../src/models/db.js";
import { maggie, testPlaces, nature, food, fourStars } from "../fixtures.js";
import { assertSubset } from "../test-utils.js";

suite("Place Model tests", () => {
  let existingCategories; // Variable to save existing categories from DB before testing
  let existingPlaces; // Variable to save existing plces from DB before testing
  let defaultUser; // Creating variable for a default user on behalf of which all tests will be run
  let defaultCategory; // Creating variable for a default category for which all tests will be run

  suiteSetup(async () => {
    // Initialisation subroutine (once before all tests)
    db.init("mongo");
    existingCategories = await db.categoryStore.getAllCategories(); // Saving existing DB content (categories) to the variable
    existingPlaces = await db.placeStore.getAllPlaces(); // Saving existing DB content (places) to the variable
    defaultUser = await db.userStore.addUser(maggie);
    nature.userId = defaultUser._id;
    food.userId = defaultUser._id;
    fourStars.userId = defaultUser._id;
    for (let i = 0; i < testPlaces.length; i++) {
      testPlaces[i].userId = defaultUser._id;
    }
  });

  setup(async () => {
    db.init("mongo");
    await db.categoryStore.deleteAllCategories();
    await db.placeStore.deleteAllPlaces();
    defaultCategory = await db.categoryStore.addCategory(nature);
    for (let i = 0; i < testPlaces.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      testPlaces[i] = await db.placeStore.addPlace(defaultCategory._id, testPlaces[i]);
    }
  });

  test("create single place", async () => {
    const testCategory = await db.categoryStore.addCategory(food);
    const testPlace = await db.placeStore.addPlace(testCategory._id, fourStars);
    assert.isNotNull(testPlace._id);
    assertSubset(fourStars, testPlace);
  });

  test("get multiple places", async () => {
    const places = await db.placeStore.getPlacesByCategoryId(defaultCategory._id);
    assert.equal(places.length, testPlaces.length);
  });

  test("delete all places", async () => {
    const places = await db.placeStore.getAllPlaces();
    assert.equal(testPlaces.length, places.length);
    await db.placeStore.deleteAllPlaces();
    const newPlaces = await db.placeStore.getAllPlaces();
    assert.equal(0, newPlaces.length);
  });

  test("get a place - success", async () => {
    const testCategory = await db.categoryStore.addCategory(food);
    const place = await db.placeStore.addPlace(testCategory._id, fourStars);
    const newPlace = await db.placeStore.getPlaceById(place._id);
    assertSubset(fourStars, newPlace);
  });

  test("delete One Place - success", async () => {
    await db.placeStore.deletePlace(testPlaces[0]._id);
    const places = await db.placeStore.getAllPlaces();
    assert.equal(places.length, testPlaces.length - 1);
    const deletedPlace = await db.placeStore.getPlaceById(testPlaces[0]._id);
    assert.isNull(deletedPlace);
  });

  test("get a place - bad params", async () => {
    assert.isNull(await db.placeStore.getPlaceById(""));
    assert.isNull(await db.placeStore.getPlaceById());
  });

  test("delete one place - fail", async () => {
    await db.placeStore.deletePlace("bad-id");
    const places = await db.placeStore.getAllPlaces();
    assert.equal(places.length, testPlaces.length);
  });

  test("add rating - once", async () => {
    const ratingCount = testPlaces[0].ratings.length;
    await db.placeStore.addRating(defaultUser, testPlaces[0], 3);
    const ratedPlace = await db.placeStore.getPlaceById(testPlaces[0]._id);
    assert.equal(ratedPlace.ratings.length, ratingCount + 1);
  });

  test("add rating - two times (update rating)", async () => {
    await db.placeStore.addRating(defaultUser, testPlaces[0], 3);
    const ratedPlace = await db.placeStore.getPlaceById(testPlaces[0]._id);
    await db.placeStore.addRating(defaultUser, testPlaces[0], 5);
    const reratedPlace = await db.placeStore.getPlaceById(testPlaces[0]._id);
    assert.equal(reratedPlace.ratings.length, ratedPlace.ratings.length); //test one: number of votes did not change
    let newRating = 0;
    for (let i = 0; i < reratedPlace.ratings.length; i++) {
      if (reratedPlace.ratings[i].userId.toString() === defaultUser._id.toString()) {
        newRating = reratedPlace.ratings[i].rating;
      }
    }
    assert.equal(newRating, 5); // test two: latest rating is in effect
  });

  suiteTeardown(async () => {
    // Restore original data after all tests
    await db.categoryStore.deleteAllCategories();
    await db.placeStore.deleteAllPlaces();
    await db.userStore.deleteUserById(defaultUser._id);
    for (const category of existingCategories) {
      await db.categoryStore.addCategory(category);
    }
    for (const place of existingPlaces) {
      await db.placeStore.addPlace(place.categoryId, place);
    }
    db.close();
  });
});

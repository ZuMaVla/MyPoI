import { assert } from "chai";
import { db } from "../../src/models/db.js";
import { testCategories, testPlaces, nature, services, FourStars } from "../fixtures.js";
import { assertSubset } from "../test-utils.js";

suite("Place Model tests", () => {
  let defaultCategory = null;

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
    const testCategory = await db.categoryStore.addCategory(services);
    const place = await db.placeStore.addPlace(testCategory._id, FourStars);
    assert.isNotNull(place._id);
    assertSubset(FourStars, place);
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
    const mozartList = await db.categoryStore.addCategory(services);
    const place = await db.placeStore.addPlace(mozartList._id, FourStars);
    const newPlace = await db.placeStore.getPlaceById(place._id);
    assertSubset(FourStars, newPlace);
  });

  test("delete One Place - success", async () => {
    await db.placeStore.deletePlace(testPlaces[0]._id);
    const places = await db.placeStore.getAllPlaces();
    assert.equal(places.length, testCategories.length - 1);
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
    assert.equal(places.length, testCategories.length);
  });
});

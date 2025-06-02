import { db } from "../models/db.js";

export const aboutController = {
  index: {
    handler: async function (request, h) {
      let recentPlace = {};
      let popularPlace = {};
      let discussedPlace = {};
      const places = await db.placeStore.getAllPlaces();
      const publicPlaces = places.filter((place) => !place._private); // filtering out private places
      if (publicPlaces.length > 0) {
        recentPlace = publicPlaces[publicPlaces.length - 1];
        let index = 0;
        let rating = 0;
        for (let i = 0; i < publicPlaces.length; i++) {
          const place = averageRating(publicPlaces[i]);
          if (place.averageRating > rating) {
            rating = place.averageRating;
            index = i;
          }
        }
        popularPlace = publicPlaces[index];
        index = 0;
        let reviews = 0;
        for (let i = 0; i < publicPlaces.length; i++) {
          if (publicPlaces[i].reviews.length > reviews) {
            reviews = publicPlaces[i].reviews.length;
            index = i;
          }
        }
        discussedPlace = publicPlaces[index];
      }

      const topReviewer = getTopReviewer(places);
      const activeReviewer = await db.userStore.getUserById(topReviewer.id);
      const activeReviewerName = activeReviewer.firstName + " " + activeReviewer.lastName;
      const viewData = {
        recentPlace: averageRating(recentPlace),
        popularPlace: averageRating(popularPlace),
        discussedPlace: averageRating(discussedPlace),
        topReviewer: activeReviewerName,
        reviews: topReviewer.count,
        title: "About MyPoI/Noticeboard",
      };

      return h.view("about-view", viewData);
    },
  },
};

function averageRating(place) {
  const ratings = place.ratings || [];
  let averageRating = 0;
  let votes = ratings.length;
  if (votes > 0) {
    let sum = 0;
    for (let j = 0; j < ratings.length; j++) {
      if (ratings[j].rating === 0) {
        votes -= 1;
      }
      sum += ratings[j].rating;
    }
    if (votes !== 0) {
      averageRating = (sum / ratings.length).toFixed(1);
    } else {
      averageRating = 0;
    }
    place.averageRating = parseFloat(averageRating);
  } else {
    place.averageRating = 0;
  }
  return place;
}

function getTopReviewer(places) {
  // Create an empty "dictionary" to count reviews per userId
  const reviewCounts = {};
  for (const place of places) {
    for (const review of place.reviews || []) {
      const userId = review.userId.toString();
      if (reviewCounts[userId]) {
        reviewCounts[userId]++;
      } else {
        reviewCounts[userId] = 1;
      }
    }
  }
  let maxUserId = null;
  let maxCount = 0;
  // Find userId with the maximum review count
  for (const [userId, count] of Object.entries(reviewCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxUserId = userId;
    }
  }
  return { id: maxUserId, count: maxCount };
}

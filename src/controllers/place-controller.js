import { db } from "../models/db.js";
import { ReviewSpec, PhotoSpec, RequestDeletePlaceSpec, VoteSpec } from "../models/joi-schemas.js";
import sanitizeHtml from "sanitize-html";

export const placeController = {
  index: {
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      currentUser._idStr = currentUser._id.toString();
      let placeReviews = currentPlace.reviews;
      let i, _user;
      const reviewCount = placeReviews.length;
      if (reviewCount > 0) {
        for (i = 0; i < reviewCount; i++) {
          _user = await db.userStore.getUserById(placeReviews[i].userId);
          if (!_user) {
            _user = {};
            _user.firstName = "Deleted";
            _user.lastName = "user";
          }
          placeReviews[i].author = _user.firstName + " " + _user.lastName;
          placeReviews[i].dateTime =
            "[" + placeReviews[i].reviewDate.toLocaleString("en-IE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + "]";
          placeReviews[i].userIdStr = placeReviews[i].userId.toString();
          placeReviews[i].vote = "⭐".repeat(personalRating(currentPlace, _user._id));
        }
      }
      const viewData = {
        user: currentUser,
        title: currentPlace.name,
        place: currentPlace,
        reviews: placeReviews,
      };
      console.log(viewData);
      return h.view("place-view", viewData);
    },
  },

  addPhoto: {
    validate: {
      payload: PhotoSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("place-view", { title: "Add photo error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      currentPlace.photos.push({ link: request.payload.link, caption: request.payload.caption, show: true });
      await db.placeStore.updatePlace(currentPlace, currentPlace);
      return h.redirect("/category/" + request.params.categoryId + "/place/" + request.params.id);
    },
  },

  togglePrivacy: {
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      if (currentUser._id.toString() === currentPlace.userId.toString() || currentUser.admin === true) {
        currentPlace._private = !currentPlace._private;
        await db.placeStore.updatePlace(currentPlace, currentPlace);
      }
      return h.redirect("/category/" + request.params.categoryId);
    },
  },

  addReview: {
    validate: {
      payload: ReviewSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("place-view", { title: "Add review error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      const sanitisedReview = sanitizeHtml(request.payload.review, {
        allowedTags: ["b", "i"],
        allowedAttributes: {},
      });
      currentPlace.reviews.push({ review: sanitisedReview, userId: currentUser._id });

      await db.placeStore.updatePlace(currentPlace, currentPlace);
      return h.redirect("/category/" + request.params.categoryId + "/place/" + request.params.id);
    },
  },

  editReview: {
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);

      let textReview = null;

      for (let i = 0; i < currentPlace.reviews.length; i++) {
        if (currentPlace.reviews[i]._id.toString() === request.params.reviewId) {
          textReview = currentPlace.reviews[i].review;
          break;
        }
      }

      if (!textReview) {
        return h.view("error-view", {
          message: "Review not found",
        });
      }

      const viewData = {
        title: `${currentPlace.name} - Editing review`,
        text: textReview,
        categoryId: request.params.categoryId,
        placeId: request.params.id,
        reviewId: request.params.reviewId,
      };

      return h.view("review-view", viewData);
    },
  },

  replaceReview: {
    validate: {
      payload: ReviewSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("place-view", { title: "Add review error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const reviewId = request.params.reviewId;
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      const editorName = currentUser.firstName + " " + currentUser.lastName;
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const dateStamp = new Date()
        .toLocaleString("en-IE", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(",", "");
      const timeStamp = new Date()
        .toLocaleString("en-IE", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(",", "");

      let editedReview = sanitizeHtml(request.payload.review, {
        allowedTags: ["b", "i"],
        allowedAttributes: {},
      });

      // Send back if the edited review is empty
      if (!editedReview || !editedReview.trim()) {
        return h.redirect(`/category/${request.params.categoryId}/place/${request.params.id}/editreview/${reviewId}`);
      }

      editedReview += `\n_______________________________________\n Edited by ${editorName} on ${dateStamp} at ${timeStamp}`;

      for (let i = 0; i < currentPlace.reviews.length; i++) {
        if (currentPlace.reviews[i]._id.toString() === reviewId) {
          currentPlace.reviews[i].review = editedReview;
          break;
        }
      }

      await db.placeStore.updatePlace(currentPlace, currentPlace);

      return h.redirect(`/category/${request.params.categoryId}/place/${request.params.id}`);
    },
  },

  deleteReview: {
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const reviewId = request.params.reviewId;
      currentPlace.reviews = currentPlace.reviews.filter((review) => review._id.toString() !== reviewId);
      await db.placeStore.updatePlace(currentPlace, currentPlace);
      return h.redirect(`/category/${request.params.categoryId}/place/${request.params.id}`);
    },
  },

  addVote: {
    validate: {
      payload: VoteSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("place-view", { title: "Voting error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      const rating = request.payload.vote;
      db.placeStore.addRating(currentUser, currentPlace, rating);
      return h.redirect("/category/" + request.params.categoryId);
    },
  },

  requestDeletePlace: {
    validate: {
      payload: RequestDeletePlaceSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("place-view", { title: "Error requesting to delete the place", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      currentPlace.deleteRequests.push({ reason: request.payload.reason, userId: currentUser._id });
      await db.placeStore.updatePlace(currentPlace, currentPlace);
      return h.redirect("/category/" + currentPlace.categoryId + "/place/" + currentPlace._id);
    },
  },
};

function personalRating(place, userId) {
  let vote = 0;

  if (place.ratings.length > 0) {
    for (let i = 0; i < place.ratings.length; i++) {
      if (place.ratings[i].userId.toString() === userId.toString()) {
        vote = place.ratings[i].rating;
      }
    }
  }
  return vote;
}

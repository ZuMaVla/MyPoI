import { db } from "../models/db.js";
import { CommentSpec, PhotoSpec, RequestDeletePlaceSpec, VoteSpec } from "../models/joi-schemas.js";

export const placeController = {
  index: {
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      let placeComments = currentPlace.comments;
      let i, _user;
      const commentCount = placeComments.length;
      if (commentCount > 0) {
        for (i = 0; i < commentCount; i++) {
          _user = await db.userStore.getUserById(placeComments[i].userId);
          placeComments[i].author = _user.firstName + " " + _user.lastName;
          placeComments[i].dateTime =
            "[" + placeComments[i].commentDate.toLocaleString("en-IE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + "]";
        }
      }
      const viewData = {
        title: currentPlace.name,
        place: currentPlace,
        comments: placeComments,
      };
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

  addComment: {
    validate: {
      payload: CommentSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("place-view", { title: "Add comment error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      currentPlace.comments.push({ comment: request.payload.comment, userId: currentUser._id });
      await db.placeStore.updatePlace(currentPlace, currentPlace);
      return h.redirect("/category/" + request.params.categoryId + "/place/" + request.params.id);
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
      const ratings = currentPlace.ratings;
      if (ratings.length === 0) {
        currentPlace.ratings.push({ rating: request.payload.vote, userId: currentUser._id });
      } else {
        let newRating = true;
        for (let i = 0; i < ratings.length; i++) {
          if (ratings[i].userId.toString() === currentUser._id.toString()) {
            newRating = false;
            ratings[i].rating = request.payload.vote;
          }
        }
        if (newRating) {
          currentPlace.ratings.push({ rating: request.payload.vote, userId: currentUser._id });
        }
      }

      await db.placeStore.updatePlace(currentPlace, currentPlace);
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
      return h.redirect("/category/" + request.params.categoryId + "/place/" + request.params.id);
    },
  },
};

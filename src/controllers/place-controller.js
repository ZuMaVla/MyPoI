import { db } from "../models/db.js";
import { CommentSpec, PhotoSpec, RequestDeletePlaceSpec, VoteSpec } from "../models/joi-schemas.js";

export const placeController = {
  index: {
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const currentUser = await db.userStore.getUserById(request.auth.credentials._id);
      currentUser._idStr = currentUser._id.toString();
      let placeComments = currentPlace.comments;
      let i, _user;
      const commentCount = placeComments.length;
      if (commentCount > 0) {
        for (i = 0; i < commentCount; i++) {
          _user = await db.userStore.getUserById(placeComments[i].userId);
          placeComments[i].author = _user.firstName + " " + _user.lastName;
          placeComments[i].dateTime =
            "[" + placeComments[i].commentDate.toLocaleString("en-IE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + "]";
          placeComments[i].userIdStr = placeComments[i].userId.toString();
        }
      }
      const viewData = {
        user: currentUser,
        title: currentPlace.name,
        place: currentPlace,
        comments: placeComments,
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

  editComment: {
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);

      let textComment = null;

      for (let i = 0; i < currentPlace.comments.length; i++) {
        if (currentPlace.comments[i]._id.toString() === request.params.commentId) {
          textComment = currentPlace.comments[i].comment;
          break;
        }
      }

      if (!textComment) {
        return h.view("error-view", {
          message: "Comment not found",
        });
      }

      const viewData = {
        title: `${currentPlace.name} - Editing comment`,
        text: textComment,
        categoryId: request.params.categoryId,
        placeId: request.params.id,
        commentId: request.params.commentId,
      };

      return h.view("comment-view", viewData);
    },
  },

  replaceComment: {
    validate: {
      payload: CommentSpec,
      options: { abortEarly: false },
      failAction: function (request, h, error) {
        return h.view("place-view", { title: "Add comment error", errors: error.details }).takeover().code(400);
      },
    },
    handler: async function (request, h) {
      const commentId = request.params.commentId;
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

      let editedComment = request.payload.comment;

      // Send back if the edited comment is empty
      if (!editedComment || !editedComment.trim()) {
        return h.redirect(`/category/${request.params.categoryId}/place/${request.params.id}/editcomment/${commentId}`);
      }

      editedComment += `\n_______________________________________\n Edited by ${editorName} on ${dateStamp} at ${timeStamp}`;

      for (let i = 0; i < currentPlace.comments.length; i++) {
        if (currentPlace.comments[i]._id.toString() === commentId) {
          currentPlace.comments[i].comment = editedComment;
          break;
        }
      }

      await db.placeStore.updatePlace(currentPlace, currentPlace);

      return h.redirect(`/category/${request.params.categoryId}/place/${request.params.id}`);
    },
  },

  deleteComment: {
    handler: async function (request, h) {
      const currentPlace = await db.placeStore.getPlaceById(request.params.id);
      const commentId = request.params.commentId;
      currentPlace.comments = currentPlace.comments.filter((comment) => comment._id.toString() !== commentId);
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

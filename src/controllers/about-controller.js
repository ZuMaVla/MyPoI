export const aboutController = {
  index: {
    handler: function (request, h) {
      return h.view("about-view", { title: "About MyPoI" });
    },
  },
};

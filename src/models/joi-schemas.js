import Joi from "joi";

export const UserSpec = {
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
};

export const UserCredentialsSpec = {
  email: Joi.string().email().required(),
  password: Joi.string().required(),
};

export const PlaceSpec = {
  name: Joi.string().required(),
  description: Joi.string().required(),
  latitude: Joi.number().allow("").optional(),
  longitude: Joi.number().allow("").optional(),
};

export const VoteSpec = {
  vote: Joi.number().required(),
};

export const PhotoSpec = {
  link: Joi.string()
    .uri()
    .pattern(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)
    .required(),
  caption: Joi.string().required(),
};

export const CommentSpec = {
  comment: Joi.string().required(),
};

export const RequestDeletePlaceSpec = {
  reason: Joi.string().required(),
};

export const CategorySpec = {
  categoryName: Joi.string().required(),
};

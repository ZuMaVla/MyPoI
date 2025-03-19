import Joi from "joi";

export const IdSpec = Joi.alternatives().try(Joi.string(), Joi.object()).description("a valid ID");

export const UserCredentialsSpec = Joi.object()
  .keys({
    email: Joi.string().email().example("homer@simpson.com").required(),
    password: Joi.string().example("secret").required(),
  })
  .label("UserCredentials");

export const UserSpec = UserCredentialsSpec.keys({
  firstName: Joi.string().example("Homer").required(),
  lastName: Joi.string().example("Simpson").required(),
}).label("UserDetails");

export const UserSpecPlus = UserSpec.keys({
  _id: IdSpec,
  __v: Joi.number(),
}).label("UserDetailsPlus");

export const UserArray = Joi.array().items(UserSpecPlus).label("UserArray");

export const JwtAuth = Joi.object()
  .keys({
    success: Joi.boolean().required(),
    token: Joi.string().required(),
  })
  .label("JwtAuth");

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

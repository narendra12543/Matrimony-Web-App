import User from "../models/User.js";

export const getAllUsersService = async () => {
  return await User.find({}, "-password -verificationDocuments");
};

export const getUserByIdService = async (id) => {
  return await User.findById(id, "-password -verificationDocuments");
};

export const updateUserService = async (id, updates) => {
  if (updates.password) delete updates.password;
  return await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
    select: "-password -verificationDocuments",
  });
};

export const deleteUserService = async (id) => {
  return await User.findByIdAndDelete(id);
};

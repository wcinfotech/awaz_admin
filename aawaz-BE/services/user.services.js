import UserModel from "../models/user.model.js";

const find = async (filter) => {
  return UserModel.find(filter);
};

const findOne = async (filter) => {
  return UserModel.findOne(filter);
};

const findById = async (id) => {
  return UserModel.findById(id);
};

const findByIdAndUpdate = async (id, data) => {
  return UserModel.findByIdAndUpdate(
    id,
    {
      $set: data,
    },
    { new: true }
  );
};

const findOneAndUpdate = async (filter, data) => {
  return UserModel.findOneAndUpdate(
    filter,
    {
      $set: data,
    },
    {
      new: true,
    }
  );
};

const countDocuments = async (filter) => {
  return UserModel.countDocuments(filter);
};

const create = async (data) => {
  return UserModel.create(data);
};

const findByIdAndDelete = async (id) => {
  return UserModel.findByIdAndDelete(id);
};

export default {
  find,
  findOne,
  findById,
  create,
  findByIdAndUpdate,
  countDocuments,
  findOneAndUpdate,
  findByIdAndDelete
};

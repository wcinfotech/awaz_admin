import AdminUserModel from "../models/admin-user.model.js";

const find = async (filter) => {
  return AdminUserModel.find(filter);
};

const findOne = async (filter) => {
  return AdminUserModel.findOne(filter);
};

const findById = async (id) => {
  return AdminUserModel.findById(id);
};

const findByIdAndUpdate = async (id, data) => {
  return AdminUserModel.findByIdAndUpdate(
    id,
    {
      $set: data,
    },
    { new: true }
  );
};

const findOneAndUpdate = async (filter, data) => {
  return AdminUserModel.findOneAndUpdate(
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
  return AdminUserModel.countDocuments(filter);
};

const create = async (data) => {
  return AdminUserModel.create(data);
};

const findByIdAndDelete = async (id) => {
  return AdminUserModel.findByIdAndDelete(id);
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

import { ObjectId } from "mongodb";
import {
  columnUpdated,
  columnCreated,
  InvalidId,
  fetched,
  serverError,
  tryAgain,
  deleted,
  notExist,
} from "../Utils/Messages.js";
import CategoryModel from "../Models/Category.js";
import collections from "../Utils/Collection.js";

const categoryModel = new CategoryModel();

class Category {
  constructor() { }

  // Get all Categories with pagination
  async getCategories(page, limit) {
    let skip = parseInt(page) * limit;
    try {
      const result = await collections
        .categories()
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();

      return result.length > 0
        ? { ...fetched("Categories"), data: result }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new Category
  async createCategory(body) {
    const category = categoryModel.fromJson(body);
    try {
      const result = await collections.categories().insertOne(category.toDatabaseJson());
      return result?.insertedId
        ? { ...columnCreated("Category"), data: { id: result.insertedId } }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get Category by ID
  async getCategoryById(id) {
    try {
      const result = await collections.categories().findOne({ _id: new ObjectId(id) });
      return result
        ? { ...fetched("Category"), data: categoryModel.fromJson(result) }
        : InvalidId("Category Detail");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Update Category
  async updateCategoryById(body) {
    try {
      const { id } = body;
      const updateData = categoryModel.toUpdateJson(body);
      const result = await collections.categories().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );

      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Category") }
        : InvalidId("Category");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Delete Category
  async deleteCategoryById(id) {
    try {
      const result = await collections.categories().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Category") } : InvalidId("Category");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Category;

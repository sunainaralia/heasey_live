import { ObjectId } from "mongodb";
import {
  columnUpdated,
  columnCreated,
  InvalidId,
  fetched,
  serverError,
  tryAgain,
  deleted
} from "../Utils/Messages.js";
import AppReviewModel from "../Models/AppReview.js";
import collections from "../Utils/Collection.js";

const appReviewModel = new AppReviewModel();

class AppReview {
  constructor() { }

  // Get all product reviews with pagination
  async getReviews(page, limit) {
    let skip = parseInt(page) * limit;
    try {
      let result = await collections.appReview().find({}).skip(skip).limit(limit).toArray();
      return result.length > 0 ? { ...fetched("Reviews"), data: result } : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get review by ID
  async getReviewById(id) {
    try {
      const result = await collections.appReview().findOne({ _id: new ObjectId(id) });
      return result ? { ...fetched("Review"), data: result } : InvalidId("Review");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new review
  async createReview(body) {
    const review = appReviewModel.fromJson(body);
    try {
      const result = await collections.appReview().insertOne(review.toDatabaseJson());
      console.log(result)
      return result?.insertedId
        ? { ...columnCreated("Review"), data: { id: result.insertedId } }
        : tryAgain;
    } catch (err) {
      console.log(err)
      return { ...serverError };
    }
  }

  // Update review by ID
  async updateReviewById(body) {
    try {
      const { id } = body;
      const updateData = appReviewModel.toUpdateJson(body);
      const result = await collections.appReview().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );
      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Review") }
        : InvalidId("Review");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Delete review by ID
  async deleteReviewById(id) {
    try {
      const result = await collections.appReview().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Review") } : InvalidId("Review");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default AppReview;

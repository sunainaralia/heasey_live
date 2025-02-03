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
import collections from "../Utils/Collection.js";
import FeedbackModel from "../Models/Feedback.js";
const feedbackModel = new FeedbackModel();

class Feedbacks {
  constructor() { }

  // Get all Feedbacks with pagination
  async getFeedbacks(page, limit) {
    let skip = parseInt(page) * limit;
    try {
      const result = await collections
        .feedbacks()
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();

      return result.length > 0
        ? { ...fetched("Feedbacks"), data: result }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new Feedback
  async createFeedback(body) {
    const feedback = feedbackModel.fromJson(body);
    try {
      const result = await collections.feedbacks().insertOne(feedback.toDatabaseJson());
      return result?.insertedId
        ? { ...columnCreated("Feedback"), data: { id: result.insertedId } }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get Feedback by ID
  async getFeedbackById(id) {
    try {
      const result = await collections.feedbacks().findOne({ _id: new ObjectId(id) });
      return result
        ? { ...fetched("Feedback"), data: feedbackModel.fromJson(result) }
        : InvalidId("Feedback Detail");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Update Feedback
  async updateFeedbackById(body) {
    try {
      const { id } = body;
      const updateData = feedbackModel.toUpdateJson(body);
      const result = await collections.feedbacks().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );

      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Feedback") }
        : InvalidId("Feedback");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Delete Feedback
  async deleteFeedbackById(id) {
    try {
      const result = await collections.feedbacks().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Feedback") } : InvalidId("Feedback");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get Feedbacks by User ID
  async getFeedbacksByUserId(userId) {
    try {
      const result = await collections.feedbacks().find({ userId: userId }).toArray();
      return result.length > 0
        ? { ...fetched("Feedbacks for User"), data: result }
        : notExist("Feedbacks for this User");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Feedbacks;

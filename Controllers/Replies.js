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
import ReplyModel from "../Models/Reply.js";
import collections from "../Utils/Collection.js";

const replyModel = new ReplyModel();

class Replies {
  constructor() { }

  // Get all Replies with pagination
  async getReplies(page, limit) {
    let skip = parseInt(page) * limit;
    try {
      const result = await collections
        .replies()
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();

      return result.length > 0
        ? { ...fetched("Replies"), data: result }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new Reply
  async createReply(body) {
    const reply = replyModel.fromJson(body);
    try {
      const result = await collections.replies().insertOne(reply.toDatabaseJson());
      return result?.insertedId
        ? { ...columnCreated("Reply"), data: { id: result.insertedId } }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get Reply by ID
  async getReplyById(id) {
    try {
      const result = await collections.replies().findOne({ _id: new ObjectId(id) });
      return result
        ? { ...fetched("Reply"), data: replyModel.fromJson(result) }
        : InvalidId("Reply Detail");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Update Reply
  async updateReplyById(body) {
    try {
      const { id } = body;
      const updateData = replyModel.toUpdateJson(body);
      const result = await collections.replies().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );

      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Reply") }
        : InvalidId("Reply");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Delete Reply
  async deleteReplyById(id) {
    try {
      const result = await collections.replies().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Reply") } : InvalidId("Reply");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get Replies by Review ID
  async getRepliesByReviewId(reviewId) {
    try {
      const result = await collections.replies().find({ reviewId: reviewId }).toArray();
      return result.length > 0
        ? { ...fetched("Replies for Review"), data: result }
        : notExist("Replies for this Review");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Replies;

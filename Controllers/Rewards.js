import { ObjectId } from "mongodb";
import { columnUpdated, columnCreated, InvalidId, fetched, serverError, tryAgain, deleted, notExist } from "../Utils/Messages.js";
import RewardsModel from "../Models/Rewards.js";
import collections from "../Utils/Collection.js";

const rewardsModel = new RewardsModel();

class Rewards {
  constructor() { }

  // Get all rewards with pagination
  async getRewards(page, limit) {
    let skip = parseInt(page) * limit;
    try {
      let result = await collections.rewards().find({}).skip(skip).limit(limit).toArray();
      return result.length > 0 ? { ...fetched("Rewards"), data: result } : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get reward by ID
  async getRewardById(id) {
    try {
      const result = await collections.rewards().findOne({ _id: new ObjectId(id) });
      return result ? { ...fetched("Reward"), data: result } : InvalidId("Reward");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new reward
  async createReward(body) {
    const reward = rewardsModel.fromJson(body);
    try {
      const result = await collections.rewards().insertOne(reward.toDatabaseJson());
      return result?.insertedId
        ? { ...columnCreated("Reward"), data: { id: result.insertedId } }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Update reward by ID
  async updateRewardById(body) {
    try {
      const { id } = body;
      const updateData = rewardsModel.toUpdateJson(body);
      const result = await collections.rewards().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );
      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Reward") }
        : InvalidId("Reward");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Delete reward by ID
  async deleteRewardById(id) {
    try {
      const result = await collections.rewards().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Reward") } : InvalidId("Reward");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Rewards;

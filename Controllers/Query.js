import { ObjectId } from "mongodb";
import { columnUpdated, columnCreated, InvalidId, fetched, serverError, tryAgain, deleted } from "../Utils/Messages.js";
import QueryModel from "../Models/Query.js";
import collections from "../Utils/Collection.js";

const queryModel = new QueryModel();

class Query {
  constructor() { }

  // Get all queries with pagination
  async getQueries(page, limit) {
    let skip = parseInt(page) * limit;
    try {
      let result = await collections.queries().find({}).skip(skip).limit(limit).toArray();
      return result.length > 0 ? { ...fetched("Queries"), data: result } : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get query by ID
  async getQueryById(id) {
    try {
      const result = await collections.queries().findOne({ _id: new ObjectId(id) });
      return result ? { ...fetched("Query"), data: result } : InvalidId("Query");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new query
  async createQuery(body) {
    const query = queryModel.fromJson(body);
    try {
      const result = await collections.queries().insertOne(query.toDatabaseJson());
      return result?.insertedId
        ? { ...columnCreated("Query"), data: { id: result.insertedId } }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Update query by ID
  async updateQueryById(body) {
    try {
      const { id } = body;
      const updateData = queryModel.toUpdateJson(body);
      const result = await collections.queries().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );
      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Query") }
        : InvalidId("Query");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Delete query by ID
  async deleteQueryById(id) {
    try {
      const result = await collections.queries().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Query") } : InvalidId("Query");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Query;
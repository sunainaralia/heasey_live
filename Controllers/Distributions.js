import { ObjectId } from "mongodb";
import { client } from "../Db.js";
import {
  columnUpdated,
  columnCreated,
  InvalidId,
  fetched,
  serverError,
  tryAgain,
  deleted,
  notExist, } from "../Utils/Messages.js";
import DistributionModel from "../Models/Distribution.js";
import collections from "../Utils/Collection.js";

class Distribution {
  constructor() { }

  // Get all Distributions
  async getDistributions(page, limit) {
    const skip = parseInt(page) * limit;

    try {
      const result = await collections
        .distribution()
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();

      if (result.length > 0) {
        return {
          ...fetched("Distributions"),
          data: result,
        };
      } else {
        return notExist("Distributions");
      }
    } catch (err) {
      console.log(err);

      return {
        ...serverError,
        err,
      };
    }
  }

  // Filter Distributions based on query
  async filterDistributions(query, page, limit) {
    const skip = (page) * limit;

    try {
      const result = await collections
        .distribution()
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();

      if (result.length > 0) {
        return {
          ...fetched("Distributions"),
          data: result,
        };
      } else {
        return tryAgain;
      }
    } catch (err) {
      return {
        ...serverError,
        err,
      };
    }
  }
  // Create new Distribution
  async createDistribution(body) {
    const newDistribution = DistributionModel.fromJson(body);
    try {
      const session = client.startSession();
      const result = await collections
        .distribution()
        .insertOne(newDistribution.toDatabaseJson(), { session });
      if (result && result.insertedId) {
        return {
          ...columnCreated("Distribution"),
          data: {
            id: result.insertedId,
          },
        };
      } else {
        return tryAgain;
      }
    } catch (error) {
      console.log(error);
      return serverError;
    }
  }

  // Get Distribution by Id
  async getDistributionById(id) {
    try {
      const result = await collections
        .distribution()
        .findOne({
          _id: new ObjectId(id),
        });

      if (result) {
        const data = DistributionModel.fromJson(result);
        return {
          ...fetched("Distribution"),
          data: data,
        };
      } else {
        return InvalidId("Distribution");
      }
    } catch (err) {
      return {
        ...serverError,
        err,
      };
    }
  }
  // Update Distribution by Id
  async updateDistributionById(body) {
    try {
      const updateFields = new DistributionModel().toUpdateJson(body);
      const { id } = body;
      const result = await collections
        .distribution()
        .updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              ...updateFields,
            },
          }
        );

      if (result.modifiedCount > 0) {
        return {
          ...columnUpdated("Distribution"),
        };
      } else {
        return InvalidId("Distribution");
      }
    } catch (err) {
      return {
        ...serverError,
        err,
      };
    }
  }

  // Delete Distribution by Id
  async deleteDistributionById(id) {
    try {
      const result = await collections
        .distribution()
        .deleteOne({
          _id: new ObjectId(id),
        });

      if (result.deletedCount > 0) {
        return {
          ...deleted("Distribution"),
          data: {},
        };
      } else {
        return InvalidId("Distribution");
      }
    } catch (err) {
      return {
        ...serverError,
        err,
      };
    }
  }
}

export default Distribution;

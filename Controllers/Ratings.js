import { ObjectId } from "mongodb";
import RatingModel from "../Models/Ratings.js";
import collections from "../Utils/Collection.js";
import {
  columnCreated,
  columnUpdated,
  InvalidId,
  fetched,
  serverError,
  tryAgain,
  deleted,
  notExist,
  notFound
} from "../Utils/Messages.js";

// Instantiate RatingModel
const ratingModel = new RatingModel();

class Ratings {
  constructor() { }

  // Create new Rating
  async createRating(body) {
    const rating = ratingModel.fromJson(body);
    try {
      if (rating.userId) {
        const user = await collections.users().findOne({ _id: new ObjectId(rating?.userId) })
        if (!user) {
          return notFound("User")
        }
      }
      if (rating.reviewId) {
        const review = await collections.reviews().findOne({ _id: new ObjectId(rating?.reviewId) })
        if (!review) {
          return notFound("Review")
        }
      }

      const product = await collections.products().findOne({ _id: new ObjectId(rating?.productId) })
      console.log(product)
      if (!product) {
        return notFound("Product")
      }

      const result = await collections.rating().insertOne(rating.toDatabaseJson());
      if (result?.insertedId) {
        const productUpdateResult = await collections.products().findOneAndUpdate(
          { _id: new ObjectId(rating.productId) },
          {
            $addToSet: { ratings: result.insertedId }
          },
          { returnDocument: 'after' }
        );
        if (productUpdateResult) {
          return { ...columnCreated("Rating"), data: { id: result.insertedId } };
        } else {
          return notFound("Product");
        }
      } else {
        return tryAgain;
      }
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get Rating by ID
  async getRatingById(id) {
    try {
      const result = await collections.rating().findOne({ _id: new ObjectId(id) });
      return result
        ? { ...fetched("Rating"), data: ratingModel.fromJson(result) }
        : InvalidId("Rating");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get Ratings by Product ID
  async getRatingsByProductId(productId) {
    try {
      const result = await collections.rating().find({ productId: productId }).toArray();
      return result.length > 0
        ? { ...fetched("Ratings for Product"), data: result }
        : notExist("Ratings for this Product");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Update Rating by ID
  async updateRatingById(body) {
    try {
      const { id } = body;
      const updateData = ratingModel.toUpdateJson(body);
      const result = await collections.rating().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );

      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Rating") }
        : InvalidId("Rating");
    } catch (err) {
      return { ...serverError, err };
    }
  };


  // Delete Rating by ID
  async deleteRatingById(id) {
    try {
      const result = await collections.rating().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Rating") } : InvalidId("Rating");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Ratings;

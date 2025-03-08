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
  notFound,
} from "../Utils/Messages.js";
import ReviewsModel from "../Models/Reviews.js";
import collections from "../Utils/Collection.js";

const reviewsModel = new ReviewsModel();

class Reviews {
  constructor() { }

  // Get all Reviews with pagination
  async getReviews(page, limit) {
    let skip = parseInt(page) * limit;
    try {
      const result = await collections
        .reviews()
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();

      return result.length > 0
        ? { ...fetched("Reviews"), data: result }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new Review
  async createReview(body) {
    const review = reviewsModel.fromJson(body);
    try {
      if (review.userId) {
        const user = await collections.users().findOne({ _id: new ObjectId(review.userId) })
        if (!user) {
          return notFound("User")
        }
      }
      const result = await collections.reviews().insertOne(review.toDatabaseJson());
      if (result?.insertedId) {
        const productUpdateResult = await collections.products().findOneAndUpdate(
          { _id: new ObjectId(review.productId) },
          {
            $addToSet: { reviews: result.insertedId }
          },
          { returnDocument: 'after' }
        )
        console.log(productUpdateResult)
        if (productUpdateResult) {
          return { ...columnCreated("Review"), data: { id: result.insertedId } };
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

  // Get Review by ID
  async getReviewById(id) {
    try {
      const result = await collections.reviews().findOne({ _id: new ObjectId(id) });
      return result
        ? { ...fetched("Review"), data: reviewsModel.fromJson(result) }
        : InvalidId("Review Detail");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Update Review
  async updateReviewById(body) {
    try {
      const { id } = body;
      const updateData = reviewsModel.toUpdateJson(body);
      const result = await collections.reviews().updateOne(
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

  //add like on review Review
  async addLikeOnReview(body) {
    try {
      const { id, userId } = body;

      const review = await collections.reviews().findOne({ _id: new ObjectId(id) });

      if (!review) {
        return InvalidId("Review");
      }
      const isLiked = review.likes && review.likes.includes(userId);

      const updateQuery = isLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } };

      const result = await collections.reviews().updateOne(
        { _id: new ObjectId(id) },
        updateQuery
      );

      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Review") }
        : InvalidId("Review");
    } catch (err) {
      return { ...serverError, err };
    }
  }


  // Delete Review
  async deleteReviewById(id) {
    try {
      const result = await collections.reviews().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Review") } : InvalidId("Review");
    } catch (err) {
      return { ...serverError, err };
    }
  };
  // Get Reviews by Product ID
  async getReviewsByProductId(productId) {
    try {
      const result = await collections.reviews().find({ productId: productId }).toArray();
      return result.length > 0
        ? { ...fetched("Reviews for Product"), data: result }
        : notExist("Reviews for this Product");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Reviews;

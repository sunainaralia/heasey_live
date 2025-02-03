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
import CarouselModel from "../Models/Carousel.js";
import collections from "../Utils/Collection.js";

const carouselModel = new CarouselModel();

class Carousel {
  constructor() { }

  // Get all Carousels with pagination
  async getCarousels(page, limit) {
    let skip = parseInt(page) * limit;
    try {
      const result = await collections
        .carousels()
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();

      return result.length > 0
        ? { ...fetched("Carousels"), data: result }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new Carousel
  async createCarousel(body) {
    const carousel = carouselModel.fromJson(body);
    try {
      const result = await collections.carousels().insertOne(carousel.toDatabaseJson());
      return result?.insertedId
        ? { ...columnCreated("Carousel"), data: { id: result.insertedId } }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get Carousel by ID
  async getCarouselById(id) {
    try {
      const result = await collections.carousels().findOne({ _id: new ObjectId(id) });
      return result
        ? { ...fetched("Carousel"), data: carouselModel.fromJson(result) }
        : InvalidId("Carousel Detail");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Update Carousel
  async updateCarouselById(body) {
    try {
      const { id } = body;
      const updateData = carouselModel.toUpdateJson(body);
      const result = await collections.carousels().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );

      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Carousel") }
        : InvalidId("Carousel");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Delete Carousel
  async deleteCarouselById(id) {
    try {
      const result = await collections.carousels().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Carousel") } : InvalidId("Carousel");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Carousel;

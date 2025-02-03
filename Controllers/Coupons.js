import { ObjectId } from "mongodb";
import { columnUpdated, columnCreated, InvalidId, fetched, serverError, tryAgain, deleted, notExist } from "../Utils/Messages.js";
import CouponsModel from "../Models/Coupons.js";
import collections from "../Utils/Collection.js";

const couponsModel = new CouponsModel();

class Coupons {
  constructor() { }

  // Get all coupons with pagination
  async getCoupons(page, limit) {
    let skip = parseInt(page) * limit;
    try {
      let result = await collections.coupons().find({}).skip(skip).limit(limit).toArray();
      return result.length > 0 ? { ...fetched("Coupons"), data: result } : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get coupon by ID
  async getCouponById(id) {
    try {
      const result = await collections.coupons().findOne({ _id: new ObjectId(id) });
      return result ? { ...fetched("Coupon"), data: result } : InvalidId("Coupon");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new coupon
  async createCoupon(body) {
    const coupon = couponsModel.fromJson(body);
    try {
      const result = await collections.coupons().insertOne(coupon.toDatabaseJson());
      return result?.insertedId
        ? { ...columnCreated("Coupon"), data: { id: result.insertedId } }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Update coupon by ID
  async updateCouponById(body) {
    try {
      const { id } = body;
      const updateData = couponsModel.toUpdateJson(body);
      const result = await collections.coupons().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );
      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Coupon") }
        : InvalidId("Coupon");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Delete coupon by ID
  async deleteCouponById(id) {
    try {
      const result = await collections.coupons().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Coupon") } : InvalidId("Coupon");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Coupons;
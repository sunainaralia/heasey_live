import { ObjectId } from "mongodb";
import {
  columnUpdated,
  columnCreated,
  InvalidId,
  fetched,
  serverError,
  tryAgain,
  deleted,
  notFound,
} from "../Utils/Messages.js";
import OrdersModel from "../Models/Orders.js";
import collections from "../Utils/Collection.js";
import { client } from "../Db.js";
const ordersModel = new OrdersModel();

class Order {
  constructor() { }

  // Get all Orders with pagination
  async getOrders(page, limit) {
    let skip = parseInt(page) * limit;
    try {
      const result = await collections
        .orders()
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();

      return result.length > 0
        ? { ...fetched("Orders"), data: result }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new Order
  async createOrder(body) {
    const session = client.startSession();
    let sessionActive = false;

    try {
      await session.startTransaction();
      sessionActive = true;

      const product = await collections.products().findOne(
        { _id: new ObjectId(body.productId) },
        { session }
      );
      if (!product) {
        await session.abortTransaction();
        sessionActive = false;
        return notFound("Product");
      };
      const user = await collections.users().findOne({ _id: new ObjectId(body.userId) });
      if (!user) {
        await session.abortTransaction();
        sessionActive = false;
        return notFound("User");
      };

      const checkCoupan = await collections.coupons()
        .find({
          $or: [
            { productId: new ObjectId(body.productId), status: true },
            { productId: null, status: true },
            { productId: "", status: true }
          ]
        }, { session })
        .toArray();

      const platformSettings = await collections.settings().findOne(
        { type: "platformFee" },
        { session }
      );

      const shippingFees = parseFloat(product?.shippingFees || 0);
      const platformFees = parseFloat(platformSettings?.value || 0);
      const productImage = Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : "";
      const price = product.price ?? 0;

      let discount = 0;
      if (product.discount && Array.isArray(product.discount) && product.discount.length > 0) {
        discount = product.discount[0].type === "percentage"
          ? parseFloat(price * (product.discount[0].value / 100))
          : parseFloat(product.discount[0].value);
      }

      let finalAmount = price + shippingFees + platformFees - discount;
      let appliedCoupan = 0;
      let appliedCoupons = [];

      if (checkCoupan.length > 0) {
        checkCoupan.forEach((coupan) => {
          appliedCoupons.push(coupan._id.toString());
          appliedCoupan += coupan.type === "percentage"
            ? parseFloat(finalAmount * (coupan.percent / 100))
            : parseFloat(coupan.amount ?? 0);
        });
      }

      let amountToPay = Math.max(0, finalAmount - appliedCoupan);

      const order = new OrdersModel(
        null,
        body.userId,
        product.title,
        body.productId,
        body.type ?? "pending",
        false,
        amountToPay,
        discount,
        productImage,
        product.vendorId,
        new Date(),
        new Date(),
        body.orderId || "",
        shippingFees,
        appliedCoupons,
        platformFees,
        price,
        "",
        user.sponsorId.toString()

      );

      const result = await collections.orders().insertOne(order.toDatabaseJson(), { session });

      if (!result || !result.insertedId) {
        await session.abortTransaction();
        sessionActive = false;
        return tryAgain;
      }

      await session.commitTransaction();
      sessionActive = false;

      return {
        ...columnCreated("Order"),
        data: { id: result.insertedId, orderId: body.orderId }
      };
    } catch (err) {
      console.log(err);
      if (sessionActive) {
        await session.abortTransaction();
        sessionActive = false;
      }
      return { ...serverError, err };
    } finally {
      if (sessionActive) {
        console.warn("Session was not closed properly. Ending session.");
        session.abortTransaction();
      }
      session.endSession();
    }
  }

  // Get Order by ID
  async getOrderById(id) {
    try {
      const result = await collections.orders().findOne({ _id: new ObjectId(id) });
      return result
        ? { ...fetched("Order"), data: ordersModel.fromJson(result) }
        : InvalidId("Order Detail");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Update Order
  async updateOrderById(body) {
    try {
      const { id } = body;
      const updateData = ordersModel.toUpdateJson(body);
      const result = await collections.orders().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );

      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Order") }
        : InvalidId("Order");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Delete Order
  async deleteOrderById(id) {
    try {
      const result = await collections.orders().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Order") } : InvalidId("Order");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Order;

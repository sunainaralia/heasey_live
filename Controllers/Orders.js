import { ObjectId } from "mongodb";
import {
  columnUpdated,
  columnCreated,
  InvalidId,
  fetched,
  serverError,
  tryAgain,
  deleted,
} from "../Utils/Messages.js";
import OrdersModel from "../Models/Orders.js";
import collections from "../Utils/Collection.js";

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
    const product = await collections.products().findOne({ _id: new ObjectId(body.productId) });
    if (!product) {
      return { ...serverError, err: "Product not found" };
    }

    // Get the first image from the product image array
    const productImage = Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : "";
    const productDiscount = product.discount ?? 0;
    const price = product.price ?? 0;
    body.image = productImage;
    body.discount = productDiscount;
    body.price = price;

    const order = new OrdersModel(
      body.userId,
      body.title,
      body.productId,
      body.type,
      body.status ?? false,
      body.amount,
      body.discount,
      body.image,
      body.vendorId,
      body.createdAt ?? new Date(),
      body.updatedAt ?? new Date(),
      body.orderId
    );

    try {
      const result = await collections.orders().insertOne(order.toDatabaseJson());
      return result?.insertedId
        ? { ...columnCreated("Order"), data: { id: result.insertedId, orderId: body.orderId } }
        : tryAgain;
    } catch (err) {
      console.log(err)
      return { ...serverError, err };
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

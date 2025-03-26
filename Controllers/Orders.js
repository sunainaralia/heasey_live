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
import ProductsModel from "../Models/Products.js";
import { readFile } from "../Utils/FileReader.js";
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

      const user = await collections.users().findOne({ _id: new ObjectId(body.userId) });
      if (!user) {
        await session.abortTransaction();
        sessionActive = false;
        return notFound("User");
      }

      if (body?.products?.length > 0) {
        let totalPrice = 0;
        let totalTaxValue = 0;
        let totalDiscountValue = 0;
        let totalCoupanValue = 0;
        let appliedCoupons = [];
        let productImage;

        for (const products of body.products) {
          const product = await collections.products().findOne(
            { _id: new ObjectId(products.productId) },
            { session }
          );

          if (!product) {
            await session.abortTransaction();
            sessionActive = false;
            return notFound("Product");
          }

          productImage = Array.isArray(product.image) && product.image.length > 0 ? product.image[0] : "";

          const quantity = parseInt(products.quantity) || 0;
          const pricePerUnit = parseFloat(product.price) || 0;
          const taxRate = parseFloat(product.tax) || 0;
          const discountValuePerUnit = parseFloat(product.discountValue) || 0;
          const finalPricePerUnit = parseFloat(product.finalPrice) || 0;

          let price = pricePerUnit * quantity;
          let taxValue = ((pricePerUnit * taxRate) / 100) * quantity;
          let discountValue = discountValuePerUnit * quantity;

          totalPrice += price;
          totalTaxValue += taxValue;
          totalDiscountValue += discountValue;

          const coupons = await collections.coupons().find(
            { productId: products.productId, status: true }
          ).toArray();

          let amount = 0;
          if (coupons.length > 0) {
            coupons.forEach((coupon) => {
              appliedCoupons.push(coupon._id.toString());
              if (parseFloat(coupon.percent) > 0) {
                amount += (parseFloat(coupon.percent) / 100) * (finalPricePerUnit * quantity);
              } else {
                amount += parseFloat(coupon.amount || 0);
              }
            });
          }

          totalCoupanValue += amount;
        }

        const amountBeforeGenCoupon = totalPrice + totalTaxValue - totalDiscountValue - totalCoupanValue;

        const checkCoupan = await collections.coupons().find({
          $or: [
            { productId: null, status: true },
            { productId: "", status: true }
          ]
        }, { session }).toArray();

        let appliedCoupan = 0;
        if (checkCoupan.length > 0) {
          checkCoupan.forEach((coupan) => {
            appliedCoupons.push(coupan._id.toString());
            if (coupan.type === "percentage") {
              appliedCoupan += amountBeforeGenCoupon * (parseFloat(coupan.percent) / 100);
            } else {
              appliedCoupan += parseFloat(coupan.amount ?? 0);
            }
          });
        }

        const platformSettings = await collections.settings().findOne(
          { type: "platformFee" },
          { session }
        );
        const shippingSettings = await collections.settings().findOne(
          { type: "shippingFee" },
          { session }
        );

        const shippingFees = parseFloat(shippingSettings?.value || 0);
        const platformFees = parseFloat(platformSettings?.value || 0);

        let amountToPay = Math.max(0, amountBeforeGenCoupon - appliedCoupan + shippingFees + platformFees);

        const order = new OrdersModel(
          null,
          body.userId,
          body.products,
          body.type ?? "pending",
          false,
          parseFloat(amountToPay),
          parseFloat(totalDiscountValue),
          productImage,
          new Date(),
          new Date(),
          body.orderId || "",
          shippingFees,
          appliedCoupons,
          platformFees,
          parseFloat(totalPrice),
          "",
          user.sponsorId?.toString() || "",
          parseFloat(appliedCoupan + totalCoupanValue),
          parseFloat(totalTaxValue)
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
      } else {
        return notFound("products");
      }

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

      if (!result) {
        return InvalidId("Order Detail");
      }

      // Enrich products with full product details
      const enrichedProducts = await Promise.all(
        (result.products ?? []).map(async (item) => {
          const productData = await collections.products().findOne({ _id: new ObjectId(item.productId) });
          if (productData.images && productData.images.length > 0) {
            productData.images = productData.images.map((imgPath) => readFile(imgPath) ?? "");
          }
          return {
            ...productData,
            quantity: item.quantity
          };
        })
      );

      const orderData = OrdersModel.fromJson(result);
      orderData.products = enrichedProducts;

      return { ...fetched("Order"), data: orderData };
    } catch (err) {
      console.error(err);
      return { ...serverError, err };
    }
  }

  // get order by userId
  async getOrderByUserId(id) {
    try {
      const [activeOrders, cancelledOrders] = await Promise.all([
        collections.orders().find({ userId: id }).toArray(),
        collections.cancelledOrders().find({ userId: id }).toArray()
      ]);
      let allOrderProducts = [];
      for (const order of activeOrders) {
        for (const product of order.products || []) {
          allOrderProducts.push({
            productId: product.productId,
            quantity: product.quantity,
            orderId: order._id,
            status: order.status || 'pending'

          });
        }
      }
      for (const cancelled of cancelledOrders) {
        for (const product of cancelled.products || []) {
          allOrderProducts.push({
            productId: product.productId,
            quantity: product.quantity,
            orderId: cancelled.originalOrderId || cancelled._id,
            status: 'cancelled',
          });
        }
      }
      const uniqueProductIds = [...new Set(allOrderProducts.map(p => p.productId))];
      const productDocs = await collections.products()
        .find({ _id: { $in: uniqueProductIds.map(id => new ObjectId(id)) } })
        .toArray();
      const fullProductsMap = {};
      for (const doc of productDocs) {
        const fullProduct = new ProductsModel().fromJson(doc);
        if (fullProduct.images && fullProduct.images.length > 0) {
          fullProduct.images = fullProduct.images.map((imgPath) => readFile(imgPath) ?? "");
        }

        fullProductsMap[doc._id.toString()] = fullProduct;
      }
      const combinedResults = allOrderProducts.map(orderProduct => {
        const fullProduct = fullProductsMap[orderProduct.productId];
        return {
          ...fullProduct,
          quantityOrdered: orderProduct.quantity,
          orderId: orderProduct.orderId,
          status: orderProduct.status
        };
      });

      return combinedResults.length
        ? { ...fetched("products"), data: combinedResults }
        : InvalidId("User");

    } catch (err) {
      console.log(err);
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

import { ObjectId } from "mongodb";
import {
  columnCreated,
  columnUpdated,
  InvalidId,
  fetched,
  serverError,
  tryAgain,
  notFound,
  deleted
} from "../Utils/Messages.js";
import CancelledOrdersModel from "../Models/CancelOrder.js";
import collections from "../Utils/Collection.js";
import { client } from "../Db.js";
const cancelledOrdersModel = new CancelledOrdersModel();

class CancelledOrder {
  constructor() { }

  // Cancel an order
  async cancelOrder(body) {
    const { orderId, cancellationReason, productId } = body;
    const session = client.startSession();
    let sessionActive = false;

    try {
      session.startTransaction();
      sessionActive = true;

      const order = await collections.orders().findOne({ _id: new ObjectId(orderId) }, { session });

      if (!order) {
        await session.abortTransaction();
        sessionActive = false;
        return InvalidId("Order");
      }

      const currentProducts = order.products || [];
      let cancelledProducts = [];
      let remainingProducts = [...currentProducts];
      let productImage = order.image;
      let totalPrice = 0;
      let totalTaxValue = 0;
      let totalDiscountValue = 0;
      let totalCoupanValue = 0;

      // PARTIAL CANCELLATION
      if (productId) {
        const productToCancel = currentProducts.find(p => p.productId === productId);
        if (!productToCancel) {
          await session.abortTransaction();
          sessionActive = false;
          return notFound("Product in order");
        }

        const product = await collections.products().findOne({ _id: new ObjectId(productId) }, { session });
        if (!product) {
          await session.abortTransaction();
          sessionActive = false;
          return notFound("Product");
        }

        // Remove product from order
        remainingProducts = currentProducts.filter(p => p.productId !== productId);

        // Prepare cancelled product info
        cancelledProducts.push(productToCancel);

        const price = product.price * productToCancel.quantity;
        const taxValue = ((product.price * product.tax) / 100) * productToCancel.quantity;
        const discountValue = product.discountValue * productToCancel.quantity;

        totalPrice = price;
        totalTaxValue = taxValue;
        totalDiscountValue = discountValue;

        // Coupon calculation
        let finalCoupan = order.coupan ?? [];
        const coupons = await collections.coupons().find({ productId, status: true }).toArray();

        coupons.forEach(coupon => {
          // Remove coupon._id from the finalCoupan
          finalCoupan = finalCoupan.filter(c => c !== coupon._id.toString());

          if (parseFloat(coupon.percent) > 0) {
            totalCoupanValue += (parseFloat(coupon.percent) / 100) * (product.finalPrice * productToCancel.quantity);
          } else {
            totalCoupanValue += parseFloat(coupon.amount || 0);
          }
        });

        // Handle global coupons (with no productId)
        const genCoupan = await collections.coupons()
          .find({
            $or: [
              { productId: null, status: true },
              { productId: "", status: true }
            ]
          }, { session })
          .toArray();

        let calculatedAmt = order.amount - order.shippingFee - order.platformFee;
        let appliedCoupan = 0;
        if (genCoupan.length > 0) {
          genCoupan.forEach((coupan) => {
            appliedCoupan += coupan.type === "percentage"
              ? (parseFloat(coupan.percent) / 100) * calculatedAmt
              : parseFloat(coupan.amount ?? 0);
          });
        }

        // Apply general coupon
        const generalCouponPercent = (price / order.price) * 100;
        if (appliedCoupan > 0) {
          totalCoupanValue += (generalCouponPercent * appliedCoupan) / 100;
        }

        // Create Cancelled Order document
        const cancelledOrder = new CancelledOrdersModel(
          null,
          order._id.toString(),
          order.userId,
          cancelledProducts,
          parseFloat(totalPrice + totalTaxValue - totalDiscountValue - totalCoupanValue),
          totalDiscountValue,
          totalPrice,
          totalCoupanValue,
          totalTaxValue,
          cancellationReason,
          productImage,
          new Date(),
          new Date(),
          order.transactionId,
          order.sponsorId
        );
        await collections.cancelledOrders().insertOne(cancelledOrder.toDatabaseJson(), { session });
        if (remainingProducts.length == 0) {
          await collections.orders().updateOne(
            { _id: new ObjectId(orderId) },
            {
              $set: {
                type: false,
                status: "cancelled",
                updatedAt: new Date()
              }
            }, { session }
          );
        } else {
          await collections.orders().updateOne(
            { _id: new ObjectId(orderId) },
            {
              $set: {
                products: remainingProducts,
                totalPrice: parseFloat(order.price - totalPrice),
                couponAmount: parseFloat(order.couponAmount - totalCoupanValue),
                taxValue: parseFloat(order.taxValue - totalTaxValue),
                coupan: finalCoupan,
                discount: parseFloat(order.discount - totalDiscountValue),
                updatedAt: new Date(),
                amount: parseInt(order.amount - totalPrice + totalCoupanValue + totalDiscountValue - totalTaxValue)
              }
            }, { session }
          );
        }

        // Commit transaction
        await session.commitTransaction();
        sessionActive = false;

        return columnUpdated("Order with Partial Cancellation");

      }

      // FULL CANCELLATION
      else {
        const cancelledOrder = new CancelledOrdersModel({
          id: null,
          orderId: order._id.toString(),
          userId: order.userId,
          products: order.products,
          amount: order.amount,
          discount: order.discount,
          price: order.price,
          couponAmount: order.couponAmount,
          taxValue: order.taxValue,
          cancellationReason: cancellationReason,
          image: order.image,
          createdAt: order.createdAt,
          updatedAt: new Date(),
          transactionId: order.transactionId,
          sponsorId: order.sponsorId
        });

        await collections.cancelledOrders().insertOne(cancelledOrder.toDatabaseJson(), { session });

        await collections.orders().updateOne(
          { _id: new ObjectId(orderId) },
          {
            $set: {
              type: false,
              status: "cancelled",
              updatedAt: new Date()
            }
          }, { session }
        );

        await session.commitTransaction();
        sessionActive = false;

        return columnUpdated("Order Fully Cancelled");
      }

    } catch (err) {
      if (sessionActive) {
        await session.abortTransaction();
        sessionActive = false;
      }
      console.log(err);
      return { ...serverError };
    } finally {
      if (sessionActive) {
        await session.abortTransaction();
      }
      session.endSession();
    }
  }


  // Get all cancelled orders (paginated)
  async getCancelledOrders(page, limit) {
    const skip = parseInt(page) * limit;

    try {
      const result = await collections
        .cancelledOrders()
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();

      return result.length > 0
        ? { ...fetched("Cancelled Orders"), data: result }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get a single cancelled order by ID
  async getCancelledOrderById(id) {
    try {
      const result = await collections.cancelledOrders().findOne({ _id: new ObjectId(id) });

      return result
        ? { ...fetched("Cancelled Order"), data: CancelledOrdersModel.fromJson(result) }
        : InvalidId("Cancelled Order");
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default CancelledOrder;

import CartModel from "../Models/Cart.js";
import collections from "../Utils/Collection.js";
import { ObjectId } from "mongodb";
import { updateCartFailed, failedToCreate, columnUpdated, serverError, notFound, updateProductQuantity, productRemoved, fetched } from "../Utils/Messages.js";
class Cart {
  // Add product to the cart
  async addToCart({ userId, products }) {
    try {
      const userObjectId = userId.toString();
      for (const product of products) {
        const existingCart = await collections.cart().findOne({
          userId: userObjectId,
          productId: product.productId,
        });
        if (existingCart) {
          const updatedQuantity = existingCart.quantity + (product.quantity || 1);
          const result = await collections.cart().updateOne(
            { userId: userObjectId, productId: product.productId },
            { $set: { quantity: updatedQuantity, updatedAt: new Date() } }
          );

          if (result.modifiedCount === 0) {
            return updateCartFailed;
          }
        } else {
          const newCart = {
            userId: userObjectId,
            productId: product.productId,
            quantity: product.quantity || 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          const result = await collections.cart().insertOne(newCart);
          if (!result.insertedId) {
            return failedToCreate;
          }
        }
      }
      return columnUpdated("cart");
    } catch (error) {
      console.error("Error in addToCart:", error);
      return serverError;
    }
  }

  // Update product quantity in the cart
  async updateProductQuantity(userId, productId, quantity) {
    try {
      const cart = await collections.cart().findOne({
        userId: userId.toString(),
        productId: productId.toString()
      });

      if (!cart) {
        return notFound("Cart");
      }
      const result = await collections.cart().updateOne(
        { userId: userId.toString(), productId: productId.toString() },
        { $set: { quantity } }
      );

      return result.modifiedCount > 0
        ? updateProductQuantity
        : updateCartFailed;

    } catch (error) {
      console.error("Error in updateProductQuantity:", error);
      return serverError;
    }
  }

  // Remove product from the cart
  async removeFromCart(userId, productId) {
    try {
      const result = await collections.cart().deleteOne({
        userId: userId.toString(),
        productId: productId.toString()
      });

      return result.deletedCount > 0
        ? productRemoved
        : notFound("Cart");

    } catch (error) {
      console.error("Error in removeFromCart:", error);
      return serverError;
    }
  }

  // Remove expired products from the cart
  async removeExpiredItems(userId) {
    try {
      const cart = await collections.cart().findOne({ userId: new ObjectId(userId) });

      if (!cart) {
        notFound("Cart");
      }

      const cartModel = new CartModel(userId);
      const cartData = cartModel.fromJson(cart);

      // Remove expired products
      cartData.removeExpiredProducts();

      // Save the updated cart to the database
      const result = await collections.cart().updateOne(
        { userId: new ObjectId(userId) },
        { $set: cartData.toDatabaseJson() }
      );

      return result.modifiedCount > 0
        ? { status: 200, message: "Expired products removed from cart" }
        : { status: 500, message: "Failed to remove expired products" };
    } catch (error) {
      console.error("Error in removeExpiredItems:", error);
      return { status: 500, message: "Server error", error };
    }
  }

  // Get cart items for the user
  async getCartItems(userId) {
    try {
      let cartItems = await collections.cart().find({ userId: userId.toString() }).toArray();
      let user=await collections.users().findOne({_id:new ObjectId(userId)});
      if (!cartItems || cartItems.length === 0) {
        return notFound("Cart");
      }

      let totalPrice = 0;
      let totalTaxValue = 0;
      let totalDiscountValue = 0;
      let totalCoupanValue = 0;
      let appliedCoupons = [];
      let coupons;

      const cartItemsWithProducts = await Promise.all(
        cartItems.map(async (cart) => {
          let product = await collections.products().findOne({ _id: new ObjectId(cart.productId) });

          if (!product) {
            return { ...cart, productDetails: null };
          }
          if (product.images && product.images.length > 0) {
            product.images = product.images.map((imgPath) => readFile(imgPath) ?? "");
          }

          let price = product.price * cart.quantity;
          let taxValue = ((product.price * product.tax) / 100) * cart.quantity;
          let discountValue = product.discountValue * cart.quantity;

          totalPrice += price;
          totalTaxValue += taxValue;
          totalDiscountValue += discountValue;

          coupons = await collections.coupons().find(
            { productId: cart.productId, status: true }
          ).toArray();

          if (coupons.length > 0) {
            coupons.forEach((coupon) => {
              appliedCoupons.push(coupon._id.toString());
              if (parseFloat(coupon.percent) > 0) {
                totalCoupanValue += (parseFloat(coupon.percent) / 100) * (product.finalPrice * cart.quantity);
              } else {
                totalCoupanValue += parseFloat(coupon.amount || 0);
              }
            });
          }

          product.finalPrice = product.finalPrice * cart.quantity;
          product.discountValue = product.discountValue * cart.quantity;

          return {
            ...cart,
            productDetails: product,
          };
        })
      );

      const amountBeforeGenCoupon = totalPrice + totalTaxValue - totalDiscountValue - totalCoupanValue;

      const checkCoupan = await collections.coupons()
        .find({
          $or: [
            { productId: null, status: true },
            { productId: "", status: true }
          ]
        })
        .toArray();

      let appliedCoupan = 0;

      if (checkCoupan.length > 0) {
        checkCoupan.forEach((coupan) => {
          appliedCoupons.push(coupan._id.toString());
          appliedCoupan += coupan.type === "percentage"
            ? parseFloat(amountBeforeGenCoupon * (coupan.percent / 100))
            : parseFloat(coupan.amount ?? 0);
        });
      }

      const platformSettings = await collections.settings().findOne({ type: "platformFee" });
      const shippingSettings = await collections.settings().findOne({ type: "shippingFee" });

      const shippingFees = parseFloat(shippingSettings?.value || 0);
      const platformFees = parseFloat(platformSettings?.value || 0);

      let amountToPay = Math.max(0, amountBeforeGenCoupon - appliedCoupan + shippingFees + platformFees);
      return {
        ...fetched("cart"),
        data: {
          products: cartItemsWithProducts,
          totalPrice: parseFloat(totalPrice.toFixed(2)),
          totalDiscount: parseFloat(totalDiscountValue.toFixed(2)),
          totalCoupon: parseFloat((totalCoupanValue + appliedCoupan).toFixed(2)),
          shippingFee: parseFloat(shippingFees.toFixed(2)),
          platformFee: parseFloat(platformFees.toFixed(2)),
          finalAmount: parseFloat(amountToPay.toFixed(2)),
          appliedCoupans: [...coupons, ...checkCoupan],
          userName: user.fullName,
          phoneNo: user.phone
        }
      };

    } catch (error) {
      console.error("Error in getCartItems:", error);
      return serverError;
    }
  }


  // Get cart summary 
  async getCartSummary() {
    try {
      const carts = await collections.cart().find({}).toArray();
      if (!carts || carts.length === 0) {
        return notFound("Cart");
      };
      return { ...fetched("Cart Details"), data: carts };
    } catch (error) {
      console.error("Error in getCartSummary:", error);
      return serverError;
    }
  }
};

export default Cart;

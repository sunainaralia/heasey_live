import CartModel from "../Models/Cart.js";
import collections from "../Utils/Collection.js";
import { ObjectId } from "mongodb";
import { updateCartFailed, failedToCreate, columnUpdated, serverError, notFound, updateProductQuantity, productRemoved } from "../Utils/Messages.js";
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

      if (!cartItems || cartItems.length === 0) {
        return notFound("Cart");
      }

      const cartItemsWithProducts = await Promise.all(
        cartItems.map(async (cart) => {
          let product = await collections.products().findOne({ _id: new ObjectId(cart.productId) });

          if (!product) {
            return { ...cart, productDetails: null };
          }

          // Fetch platform fee
          const settings = await collections.settings().findOne({ type: "platformFee" });
          let platformFees = settings?.value ? parseFloat(settings.value) : 0;

          // Fetch applicable coupons
          const coupons = await collections.coupons().find({
            $or: [{ productId: new ObjectId(cart.productId), status: true }, { productId: null, status: true }, { productId: "", status: true }]
          }).toArray();

          // Calculate discount
          let discount = 0;
          if (product.discount && Array.isArray(product.discount) && product.discount.length > 0) {
            discount = product.discount[0].type === "percentage"
              ? parseFloat(product.price * (product.discount[0].value / 100))
              : parseFloat(product.discount[0].value);
          }

          // Calculate coupon discount
          let amount = 0;
          coupons.forEach((coupon) => {
            if (parseFloat(coupon.percent) > 0) {
              amount += (parseFloat(coupon.percent) / 100) * (product.price + product.shippingFee + platformFees - discount);
            } else {
              amount += parseFloat(coupon.amount || 0);
            }
          });

          // Set product.coupon AFTER loop
          product.coupon = amount;

          console.log("Coupon for product:", product._id, "=>", product.coupon);

          return {
            ...cart,
            productDetails: product,
          };
        })
      );

      return {
        status: 200,
        data: cartItemsWithProducts,
      };
    } catch (error) {
      console.error("Error in getCartItems:", error);
      return serverError;
    }
  }


  // Get cart summary (total quantity and price)
  async getCartSummary() {
    try {
      const carts = await collections.cart().find({}).toArray();

      if (!carts || carts.length === 0) {
        return notFound("Cart");
      }

      return {
        status: 200,
        data: carts,
      };
    } catch (error) {
      console.error("Error in getCartSummary:", error);
      return serverError;
    }
  }
}

export default Cart;

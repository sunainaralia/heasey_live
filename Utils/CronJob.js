import cron from "node-cron";
import { ObjectId } from "mongodb";
import { serverError } from "./Messages.js";
import CartModel from "../Models/Cart.js";
import collections from "./Collection.js";

// Create a cron job that runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const allCarts = await collections.cart().find({}).toArray();
    for (let cart of allCarts) {
      const cartModel = new CartModel(cart.userId, cart.products);
      cartModel.removeExpiredProducts();
      // If there are expired products, update the cart
      if (cartModel.products.length < cart.products.length) {
        await collections.cart().updateOne(
          { userId: new ObjectId(cart.userId) },
          { $set: { products: cartModel.products } }
        );
        console.log(`Expired products removed for user ${cart.userId}`);
      }
    }
    console.log("Expired products cleaned up from all carts.");
  } catch (error) {
    console.error("Error during cron job execution:", error);
  }
});

export default cron;

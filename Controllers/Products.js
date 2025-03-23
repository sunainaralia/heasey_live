import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";
import {
  columnUpdated,
  columnCreated,
  InvalidId,
  fetched,
  serverError,
  tryAgain,
  deleted,
  notExist,
  productLiked,
  notFound,
  productDisliked,
  invalidId
} from "../Utils/Messages.js";
import ProductsModel from "../Models/Products.js";
import collections from "../Utils/Collection.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFile } from "../Utils/FileReader.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const productsModel = new ProductsModel();

class Products {
  constructor() { }

  // Get all Products with pagination
  async getProducts(page, limit) {
    let skip = parseInt(page) * limit;

    try {
      let products = await collections.products().find({}).skip(skip).limit(limit).toArray();

      if (products.length === 0) {
        return tryAgain;
      }
      products = await Promise.all(products.map(async (product) => {
        if (product.images && product.images.length > 0) {
          product.images = product.images.map((imgPath) => readFile(imgPath) ?? "");
        };

        return product;
      }));

      return { ...fetched("Products"), data: products };

    } catch (err) {
      console.error("Error in getProducts:", err);
      return { ...serverError, err };
    }
  }

  // Get Products by Category ID
  async getProductsByCategoryId(categoryId) {
    try {
      let result = await collections.products().find({ categoryId: categoryId }).toArray();

      if (result.length > 0) {
        result = await Promise.all(
          result.map(async (product) => {
            if (product.images && product.images.length > 0) {
              product.images = product.images.map((imgPath) => readFile(imgPath) ?? "");
            }
            return product;
          })
        );
        return { ...fetched("Products by Category"), data: result };
      } else {
        return notExist("Products for this Category");
      }
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new Product
  async createProduct(body) {
    try {
      let price = body?.price || 0;
      let tax = body?.tax || 0;
      let discount = body?.discount;
      let totalPrice = parseFloat(price + ((tax) * (price) / 100));
      let totalDiscount = 0;
      if (discount.length > 0) {
        discount.map((discount) => {
          if (discount.type == "percentage") {
            totalDiscount += parseFloat((totalPrice * discount.value) / 100)
          } else {
            totalDiscount += parseFloat(discount.value)
          }
        })
      };
      const product = new ProductsModel(null, body.title, body.description, body.vendorId, body.categoryId, body.discount, [], body.quantity, body.sku, true, new Date(), new Date(), body.price, [], [], body.tax, parseInt(totalPrice - totalDiscount), parseFloat(totalDiscount));
      const result = await collections.products().insertOne(product.toDatabaseJson());
      return result?.insertedId
        ? { ...columnCreated("Product"), data: { id: result.insertedId } }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get Product by ID
  async getProductById(id) {
    try {
      const result = await collections.products().findOne({ _id: new ObjectId(id) });

      if (!result) {
        return InvalidId("Product Detail");
      }
      const platformSettings = await collections.settings().findOne({ type: "platformFee" });
      const shippingSettings = await collections.settings().findOne({ type: "shippingFee" });
      let platformFees = platformSettings?.value ? parseFloat(platformSettings.value) : 0;
      let shippingFees = shippingSettings?.value ? parseFloat(shippingSettings.value) : 0;
      const coupons = await collections.coupons().find({
        $or: [{ productId: id, status: true }, { productId: null, status: true }, { productId: "", status: true }]
      }).toArray();
      let amount = 0;
      if (coupons.length > 0) {
        coupons.forEach((coupon) => {
          if (parseFloat(coupon.percent) > 0) {
            amount += (parseFloat(coupon.percent) / 100) * (result.finalPrice);
          } else {
            amount += parseFloat(coupon.amount || 0);
          }
        });
      };
      result.coupon = coupons
      result.couponAmount = amount;
      result.shippingFees = shippingFees;
      result.platformFees = platformFees;
      result.orderAmount = parseInt(result.finalPrice + shippingFees + platformFees - amount);
      if (result.images && result.images.length > 0) {
        result.images = result.images.map((imgPath) => readFile(imgPath) ?? "");
      };
      if (result.reviews && result.reviews.length > 0) {
        result.reviews = await Promise.all(
          result.reviews.map(reviewId =>
            collections.reviews().findOne({ _id: new ObjectId(reviewId) })
          )
        );
      };

      return { ...fetched("Product"), data: result };
    } catch (err) {
      console.error("Error in getProductById:", err);
      return { ...serverError };
    }
  }

  // Update Product
  async updateProductById(body) {
    try {
      const { id } = body;
      const updateData = productsModel.toUpdateJson(body);
      const result = await collections.products().updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData } }
      );

      return result.acknowledged && result.modifiedCount > 0
        ? { ...columnUpdated("Product") }
        : InvalidId("Product");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Delete Product
  async deleteProductById(id) {
    try {
      const result = await collections.products().deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0 ? { ...deleted("Product") } : InvalidId("Product");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Change Product Image
  async changeProductImages(id, images) {
    try {
      if (!ObjectId.isValid(id)) {
        return { status: 400, message: "Invalid Product ID" };
      }

      const productFolder = path.join(__dirname, '../', 'uploads', id);
      if (!fs.existsSync(productFolder)) {
        fs.mkdirSync(productFolder, { recursive: true });
      }

      const imagePaths = [];
      for (const image of images) {
        const imagePath = path.join(productFolder, image.originalname);
        fs.writeFileSync(imagePath, image.buffer);
        imagePaths.push(imagePath);
      }

      const result = await collections.products().updateOne(
        { _id: new ObjectId(id) },
        { $set: { images: imagePaths } }
      );

      return result.acknowledged && result.modifiedCount > 0
        ? columnUpdated("Product Images")
        : tryAgain;
    } catch (err) {
      console.error("Error updating product images:", err);
      return serverError;
    }
  }
  // like products
  async likeOrUnlikeProduct(req) {
    try {
      const userId = req.headers.userid || req.headers.userId;
      const productId = req.params.id;
      const user = await collections.users().findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return notFound("User");
      }
      const product = await collections.products().findOne({ _id: new ObjectId(productId) });
      if (!product) {
        return notFound("Product");
      }
      const isLiked = user.likedProducts && user.likedProducts.some(id => id == productId);

      const updateAction = isLiked
        ? { $pull: { likedProducts: productId } }
        : { $addToSet: { likedProducts: productId } };

      const updatedUser = await collections.users().findOneAndUpdate(
        { _id: new ObjectId(userId) },
        updateAction,
        { returnDocument: "after" }
      );

      if (!updatedUser) {
        return serverError;
      }

      return isLiked ? productDisliked : productLiked;

    } catch (err) {
      console.log(err);
      return serverError;
    }
  }
  // find latest products
  async getLatestProducts(page, limit) {
    const skip = parseInt(page) * limit;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      let latestProducts = await collections.products()
        .find({ createdAt: { $gte: thirtyDaysAgo } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      let remainingProducts = await collections.products()
        .find({ createdAt: { $lt: thirtyDaysAgo } })
        .sort({ createdAt: -1 })
        .toArray();

      let allProducts = [...latestProducts, ...remainingProducts];
      allProducts = await Promise.all(allProducts.map(async (product) => {
        if (product.images && product.images.length > 0) {
          try {
            product.images = product.images.map((imgPath) => readFile(imgPath) ?? "");
          } catch (err) {
            console.error(`Error reading image ${imgPath}:`, err);
            product.images = [];
          }
        }
        return product;
      }));

      if (allProducts.length > 0) {
        return { ...fetched("Latest Products"), data: allProducts };
      } else {
        return tryAgain;
      }

    } catch (err) {
      console.error("Error fetching latest products:", err);
      return { ...serverError, err };
    }
  }

  // find popular products
  async getPopularProducts(req) {
    try {
      const orderedProducts = await collections.orders().distinct("productId");

      let existingOrderedProducts = [];
      let remainingProducts = [];

      if (orderedProducts && orderedProducts.length > 0) {
        existingOrderedProducts = await collections.products().find({
          _id: { $in: orderedProducts.map(id => new ObjectId(id)) }
        }).toArray();

        remainingProducts = await collections.products().find({
          _id: { $nin: orderedProducts.map(id => new ObjectId(id)) }
        }).toArray();
      } else {
        remainingProducts = await collections.products().find({}).toArray();
      }

      let allProducts = [...existingOrderedProducts, ...remainingProducts];
      allProducts = await Promise.all(allProducts.map(async (product) => {
        if (product.images && product.images.length > 0) {
          try {
            product.images = product.images.map((imgPath) => readFile(imgPath) ?? "");
          } catch (err) {
            console.error(`Error reading image ${imgPath}:`, err);
            product.images = [];
          }
        }

        return product;
      }));

      return { ...fetched("Popular product"), data: allProducts };

    } catch (err) {
      console.error("Error fetching popular products:", err);
      return serverError;
    }
  }

  // wishlist product
  async getWishlistProducts(req) {
    try {
      const userId = req.headers.userid || req.headers.userId;

      if (!ObjectId.isValid(userId)) {
        return invalidId("User");
      }
      const user = await collections.users().findOne(
        { _id: new ObjectId(userId) },
        { projection: { likedProducts: 1 } }
      );

      if (!user || !user.likedProducts || user.likedProducts.length === 0) {
        return notFound("Liked products");
      }
      let likedProducts = await collections.products().find({
        _id: { $in: user.likedProducts.map(id => new ObjectId(id)) }
      }).toArray();

      if (likedProducts.length === 0) {
        return notFound("Wishlist products");
      };
      likedProducts = await Promise.all(likedProducts.map(async (product) => {
        if (product.images && product.images.length > 0) {
          try {
            product.images = product.images.map((imgPath) => readFile(imgPath) ?? "");
          } catch (err) {
            console.error(`Error reading image ${imgPath}:`, err);
            product.images = [];
          }
        };
        return product;
      }));

      return { ...fetched("Liked Products"), data: likedProducts };

    } catch (err) {
      console.error("Error fetching liked products:", err);
      return serverError;
    }
  }

};

export default Products;

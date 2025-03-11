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
  productDisliked
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
      const settings = await collections.settings().findOne({ type: "platformFee" });
      let platformFee = settings?.value ? parseFloat(settings.value) : 0;
      products = await Promise.all(products.map(async (product) => {
        let discount = 0;
        if (product.discount && Array.isArray(product.discount) && product.discount.length > 0) {
          discount = product.discount[0].type === "percentage"
            ? parseFloat(product.price * (product.discount[0].value / 100))
            : parseFloat(product.discount[0].value);
        }
        const coupons = await collections.coupons().find({
          $or: [
            { productId: new ObjectId(product._id), status: true },
            { productId: null, status: true },
            { productId: "", status: true }
          ]
        }).toArray();

        let couponAmount = 0;
        if (coupons.length > 0) {
          coupons.forEach((coupon) => {
            if (parseFloat(coupon.percent) > 0) {
              couponAmount += (parseFloat(coupon.percent) / 100) * (product.price + (product.shippingFee ?? 0) + platformFee - discount);
            } else {
              couponAmount += parseFloat(coupon.amount || 0);
            }
          });
        }
        product.coupon = couponAmount;
        product.platformFee = platformFee;
        if (product.images && product.images.length > 0) {
          product.images = product.images.map((imgPath) => readFile(imgPath) ?? "");
        }

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
      const platformSettings = await collections.settings().findOne({ type: "platformFee" });
      const platformFees = parseFloat(platformSettings?.value || 0);
      const product = new ProductsModel(null, body.title, body.description, body.vendorId, body.categoryId, body.discount, [], body.quantity, body.sku, false, new Date(), new Date(), body.price, [], [], body.shippingFee, platformFees);
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
      const settings = await collections.settings().findOne({ type: "platformFee" });
      let platformFees = settings?.value ? parseFloat(settings.value) : 0;

      const coupons = await collections.coupons().find({
        $or: [{ productId: new ObjectId(id), status: true }, { productId: null, status: true }, { productId: "", status: true }]
      }).toArray();

      let discount = 0;
      if (result.discount && Array.isArray(result.discount) && result.discount.length > 0) {
        discount = result.discount[0].type === "percentage"
          ? parseFloat(result.price * (result.discount[0].value / 100))
          : parseFloat(result.discount[0].value);
      }

      let amount = 0;
      if (coupons.length > 0) {
        coupons.forEach((coupon) => {
          if (parseFloat(coupon.percent) > 0) {
            amount += (parseFloat(coupon.percent) / 100) * (result.price + result.shippingFee + platformFees - discount);
          } else {
            amount += parseFloat(coupon.amount || 0);
          }
        });
      }

      result.coupon = amount;
      if (result.images && result.images.length > 0) {
        result.images = result.images.map((imgPath) => readFile(imgPath) ?? "");
      }

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
      const settings = await collections.settings().findOne({ type: "platformFee" });
      let platformFee = settings?.value ? parseFloat(settings.value) : 0;
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
        let discount = 0;
        if (product.discount && Array.isArray(product.discount) && product.discount.length > 0) {
          discount = product.discount[0].type === "percentage"
            ? parseFloat(product.price * (product.discount[0].value / 100))
            : parseFloat(product.discount[0].value);
        };
        const coupons = await collections.coupons().find({
          $or: [
            { productId: new ObjectId(product._id), status: true },
            { productId: null, status: true },
            { productId: "", status: true }
          ]
        }).toArray();

        let couponAmount = 0;
        if (coupons.length > 0) {
          coupons.forEach((coupon) => {
            if (parseFloat(coupon.percent) > 0) {
              couponAmount += (parseFloat(coupon.percent) / 100) *
                (product.price + parseFloat(product.shippingFee ?? 0) + platformFee - discount);
            } else {
              couponAmount += parseFloat(coupon.amount || 0);
            }
          });
        };
        product.coupon = couponAmount;
        product.platformFee = platformFee;
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
      const settings = await collections.settings().findOne({ type: "platformFee" });
      let platformFee = settings?.value ? parseFloat(settings.value) : 0;
      allProducts = await Promise.all(allProducts.map(async (product) => {
        let discount = 0;
        if (product.discount && Array.isArray(product.discount) && product.discount.length > 0) {
          discount = product.discount[0].type === "percentage"
            ? parseFloat(product.price * (product.discount[0].value / 100))
            : parseFloat(product.discount[0].value);
        }
        const coupons = await collections.coupons().find({
          $or: [
            { productId: new ObjectId(product._id), status: true },
            { productId: null, status: true },
            { productId: "", status: true }
          ]
        }).toArray();

        let couponAmount = 0;
        if (coupons.length > 0) {
          coupons.forEach((coupon) => {
            if (parseFloat(coupon.percent) > 0) {
              couponAmount += (parseFloat(coupon.percent) / 100) *
                (product.price + (product.shippingFee ?? 0) + platformFee - discount);
            } else {
              couponAmount += parseFloat(coupon.amount || 0);
            }
          });
        }
        product.coupon = couponAmount;
        product.platformFee = platformFee;
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

      return { status: 200, message: "Popular products retrieved", data: allProducts };

    } catch (err) {
      console.error("Error fetching popular products:", err);
      return { status: 500, message: "Internal Server Error", error: err.toString() };
    }
  }

  // wishlist product
  async getWishlistProducts(req) {
    try {
      const userId = req.headers.userid || req.headers.userId;

      if (!ObjectId.isValid(userId)) {
        return { status: 400, message: "Invalid User ID" };
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
      }
      const settings = await collections.settings().findOne({ type: "platformFee" });
      let platformFee = settings?.value ? parseFloat(settings.value) : 0;
      likedProducts = await Promise.all(likedProducts.map(async (product) => {
        let discount = 0;
        if (product.discount && Array.isArray(product.discount) && product.discount.length > 0) {
          discount = product.discount[0].type === "percentage"
            ? parseFloat(product.price * (product.discount[0].value / 100))
            : parseFloat(product.discount[0].value);
        }
        const coupons = await collections.coupons().find({
          $or: [
            { productId: new ObjectId(product._id), status: true },
            { productId: null, status: true },
            { productId: "", status: true }
          ]
        }).toArray();

        let couponAmount = 0;
        if (coupons.length > 0) {
          coupons.forEach((coupon) => {
            if (parseFloat(coupon.percent) > 0) {
              couponAmount += (parseFloat(coupon.percent) / 100) *
                (product.price + (product.shippingFee ?? 0) + platformFee - discount);
            } else {
              couponAmount += parseFloat(coupon.amount || 0);
            }
          });
        }
        product.coupon = couponAmount;
        product.platformFee = platformFee;
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

      return { status: 200, message: "Liked products retrieved", data: likedProducts };

    } catch (err) {
      console.error("Error fetching liked products:", err);
      return { status: 500, message: "Internal Server Error", error: err.toString() };
    }
  }

};

export default Products;

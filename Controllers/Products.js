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
      let result = await collections.products().find({}).skip(skip).limit(limit).toArray();
      if (result.length > 0) {
        result = await Promise.all(
          result.map(async (product) => {
            if (product.images && product.images.length > 0) {
              product.images = product.images.map((imgPath) => readFile(imgPath) ?? "");
            }
            return product;
          })
        );
        return { ...fetched("Products"), data: result };
      } else {
        return tryAgain;
      }
    } catch (err) {
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
    const product = productsModel.fromJson(body);
    try {
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

      if (result.images && result.images.length > 0) {
        result.images = result.images.map((imgPath) => readFile(imgPath) ?? "");
      }

      return { ...fetched("Product"), data: result };
    } catch (err) {
      return { ...serverError, err };
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
};

export default Products;

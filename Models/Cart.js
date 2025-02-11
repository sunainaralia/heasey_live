class CartModel {
  constructor(userId, products = [], createdAt, updatedAt) {
    this.userId = userId;
    this.products = products;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  fromJson(jsonData) {
    const products = jsonData.products?.map(product => ({
      productId: product.productId,
      quantity: product.quantity,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt)
    })) || [];
    return new CartModel(jsonData.userId, products, new Date(jsonData.createdAt), new Date(jsonData.updatedAt));
  }

  toDatabaseJson() {
    return {
      userId: this.userId,
      products: this.products.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      })),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }


  addProduct(product) {
    const existingProduct = this.products.find(item => item.productId === product.productId);
    if (existingProduct) {
      existingProduct.quantity += product.quantity;
      existingProduct.updatedAt = new Date();
    } else {
      this.products.push({ ...product, createdAt: new Date(), updatedAt: new Date() });
    }
  }

  // Function to update the quantity of a product in the cart
  updateProductQuantity(productId, quantity) {
    const product = this.products.find(item => item.productId === productId);
    if (product) {
      product.quantity = quantity;
      product.updatedAt = new Date();
    }
  }

  // Function to remove product from the cart
  removeProduct(productId) {
    this.products = this.products.filter(item => item.productId !== productId);
  }

  // Function to remove expired products from the cart
  removeExpiredProducts() {
    this.products = this.products.filter(product => !this.isExpired(product));
  }

  // Function to check if a product is expired (7 days old)
  isExpired(product) {
    const currentDate = new Date();
    const expirationDate = new Date(product.createdAt);
    expirationDate.setDate(expirationDate.getDate() + 7); createdAt
    return currentDate > expirationDate;
  }

  // Function to get the total quantity of products in the cart
  getTotalQuantity() {
    return this.products.reduce((total, product) => total + product.quantity, 0);
  }

  // Function to get the total price of products in the cart
  getTotalPrice(productsData) {
    return this.products.reduce((total, product) => {
      const productInfo = productsData.find(item => item.productId === product.productId);
      return total + (productInfo ? productInfo.price * product.quantity : 0);
    }, 0);
  }
}

export default CartModel;

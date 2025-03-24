class CancelledOrdersModel {
  constructor(
    id,
    originalOrderId,
    userId,
    products,
    type,
    amount,
    discount,
    shippingFee,
    platformFee,
    price,
    couponAmount,
    taxValue,
    cancellationReason,
    cancelledBy,
    cancelledAt,
    image,
    createdAt,
    transactionId,
    sponsorId
  ) {
    this.id = id;
    this.originalOrderId = originalOrderId; 
    this.userId = userId;
    this.products = products;
    this.type = type;
    this.amount = amount;
    this.discount = discount;
    this.shippingFee = shippingFee;
    this.platformFee = platformFee;
    this.price = price;
    this.couponAmount = couponAmount;
    this.taxValue = taxValue;
    this.cancellationReason = cancellationReason;
    this.cancelledBy = cancelledBy; 
    this.cancelledAt = cancelledAt;
    this.image = image;
    this.createdAt = createdAt;
    this.transactionId = transactionId;
    this.sponsorId = sponsorId;
  }

  static fromJson(jsonData) {
    return new CancelledOrdersModel(
      jsonData.id ?? null,
      jsonData.originalOrderId,
      jsonData.userId,
      jsonData.products ?? [],
      jsonData.type,
      jsonData.amount,
      jsonData.discount,
      jsonData.shippingFee ?? 0,
      jsonData.platformFee ?? 0,
      jsonData.price ?? 0,
      jsonData.couponAmount ?? 0,
      jsonData.taxValue ?? 0,
      jsonData.cancellationReason ?? "",
      jsonData.cancelledBy ?? "user",
      jsonData.cancelledAt ?? new Date(),
      jsonData.image ?? null,
      jsonData.createdAt ?? new Date(),
      jsonData.transactionId ?? "",
      jsonData.sponsorId ?? ""
    );
  }

  toDatabaseJson() {
    return {
      originalOrderId: this.originalOrderId,
      userId: this.userId,
      products: this.products,
      type: this.type,
      amount: this.amount,
      discount: this.discount,
      shippingFee: this.shippingFee,
      platformFee: this.platformFee,
      price: this.price,
      couponAmount: this.couponAmount,
      taxValue: this.taxValue,
      cancellationReason: this.cancellationReason,
      cancelledBy: this.cancelledBy,
      cancelledAt: this.cancelledAt,
      image: this.image,
      createdAt: this.createdAt,
      transactionId: this.transactionId,
      sponsorId: this.sponsorId
    };
  }

  toUpdateJson(body) {
    const updateJson = {};

    for (const key in body) {
      if (key !== "id" && this.hasOwnProperty(key) && body[key] !== undefined && body[key] !== "") {
        let value = body[key];

        // Boolean conversion
        if (value === "true" || value === "false") {
          value = value === "true";
        }

        // Numeric conversion
        const parsedNumber = parseFloat(value);
        if (!isNaN(parsedNumber)) {
          value = parsedNumber;
        }

        // Date conversion
        if (key === "cancelledAt" || key === "createdAt") {
          value = new Date(value);
        }

        updateJson[key] = value;
      }
    }

    updateJson.updatedAt = new Date();
    return updateJson;
  }
}

export default CancelledOrdersModel;

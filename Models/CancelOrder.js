class CancelledOrdersModel {
  constructor(
    id,
    orderId,
    userId,
    products,
    amount,
    discount,
    price,
    couponAmount,
    taxValue,
    cancellationReason,
    image,
    createdAt,
    updatedAt,
    transactionId,
    sponsorId
  ) {
    this.id = id;
    this.orderId = orderId;
    this.userId = userId;
    this.products = products;
    this.amount = amount;
    this.discount = discount;
    this.price = price;
    this.couponAmount = couponAmount;
    this.taxValue = taxValue;
    this.cancellationReason = cancellationReason;
    this.image = image;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.transactionId = transactionId;
    this.sponsorId = sponsorId;
  }

  static fromJson(jsonData) {
    return new CancelledOrdersModel(
      jsonData.id ?? null,
      jsonData.orderId,
      jsonData.userId,
      jsonData.products ?? [],
      jsonData.amount,
      jsonData.discount,
      jsonData.price ?? 0,
      jsonData.couponAmount ?? 0,
      jsonData.taxValue ?? 0,
      jsonData.cancellationReason ?? "",
      jsonData.image ?? null,
      jsonData.createdAt ?? new Date(),
      jsonData.updatedAt ?? new Date(),
      jsonData.transactionId ?? "",
      jsonData.sponsorId ?? ""
    );
  }

  toDatabaseJson() {
    return {
      orderId: this.orderId,
      userId: this.userId,
      products: this.products,
      amount: this.amount,
      discount: this.discount,
      price: this.price,
      couponAmount: this.couponAmount,
      taxValue: this.taxValue,
      cancellationReason: this.cancellationReason,
      image: this.image,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
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
        if (key === "createdAt" || key === "updatedAt") {
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

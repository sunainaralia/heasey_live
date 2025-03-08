class RatingModel {
  constructor(
    id,
    userId,
    reviewId,
    status,
    createdAt,
    updatedAt,
    rating,
    productId,
    anonymous
  ) {
    this.id = id;
    this.userId = userId;
    this.reviewId = reviewId;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.rating = rating;
    this.productId = productId;
    this.anonymous = anonymous;
  }

  fromJson(jsonData) {
    return new RatingModel(
      jsonData._id ?? null,
      jsonData.userId ?? "",
      jsonData.reviewId ?? "",
      jsonData.status != null ? JSON.parse(jsonData.status) : true,
      jsonData.createdAt ?? new Date(),
      jsonData.updatedAt ?? new Date(),
      jsonData.rating ?? 0,
      jsonData.productId ?? "",
      jsonData.anonymous ?? ""
    );
  }

  toDatabaseJson() {
    return {
      userId: this.userId,
      reviewId: this.reviewId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      rating: this.rating,
      productId: this.productId,
      anonymous: this.anonymous
    };
  }

  toUpdateJson(body) {
    const updateJson = {};

    for (const key in body) {
      if (key !== "id" && this.hasOwnProperty(key) && body[key] !== null && body[key] !== undefined && body[key] !== "") {
        let value = body[key];

        // Convert string representation of boolean to actual boolean
        if (value === "true" || value === "false") {
          value = value === "true";
        }

        // Convert string representation of number to actual number
        const parsedNumber = parseFloat(value);
        if (!isNaN(parsedNumber)) {
          value = parsedNumber;
        }

        if (key == "createdAt") {
          value = new Date(value);
        }

        updateJson[key] = value;
      }
    }

    updateJson.updatedAt = new Date();
    return updateJson;
  }
}

export default RatingModel;

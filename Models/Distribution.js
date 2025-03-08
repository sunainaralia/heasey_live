class DistributionModel {
  constructor(
    id,
    adminId,
    level,
    rate,
    type,
    status,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.adminId = adminId;
    this.level = level;
    this.rate = rate;
    this.type = type;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromJson(jsonData) {
    return new DistributionModel(
      jsonData._id ?? null,
      jsonData.adminId ?? "",
      parseInt(jsonData.level) ?? 0,
      parseInt(jsonData.rate) ?? 0,
      jsonData.type ?? "regular",
      jsonData.status !== undefined ? JSON.parse(jsonData.status) : false,
      jsonData.createdAt ?? new Date(),
      jsonData.updatedAt ?? new Date()
    );
  }

  toDatabaseJson() {
    return {
      adminId: this.adminId,
      level: this.level,
      rate: this.rate,
      type: this.type,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  toClientJson() {
    return {
      id: this.id,
      adminId: this.adminId,
      level: this.level,
      rate: this.rate,
      type: this.type,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  toUpdateJson(body) {
    const updateJson = {};

    for (const key in body) {
      if (key !== "id" && this.hasOwnProperty(key) && body[key] !== null && body[key] !== undefined && body[key] !== "") {
        let value = body[key];

        if (value === "true" || value === "false") {
          value = value === "true";
        }

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

export default DistributionModel;

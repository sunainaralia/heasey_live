class AdminModel {
  constructor(
    initial,
    fullName,
    password,
    email,
    phone,
    image,
    dob,
    status,
    type,
    auth,
    attempt,
    isVerified,
    designation,
    referral_key,
    createdAt,
    updatedAt,
  ) {
    this.initial = initial;
    this.fullName = fullName;
    this.password = password;
    this.email = email;
    this.phone = phone;
    this.image = image;
    this.dob = dob;
    this.status = status;
    this.type = type;
    this.auth = auth;
    this.attempt = attempt;
    this.isVerified = isVerified;
    this.designation = designation;
    this.referral_key = referral_key;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Static method to create AdminModel from JSON data
  static fromJson(jsonData) {
    return new AdminModel(
      jsonData.initial ?? "",
      jsonData.fullName ?? "Admin",
      jsonData.password ?? "",
      jsonData.email ?? "",
      jsonData.phone ?? 0,
      jsonData.image ?? "",
      jsonData.dob ? new Date(jsonData.dob) : "1970-01-01",
      jsonData.status !== undefined ? JSON.parse(jsonData.status) : false,
      jsonData.type ?? "admin",
      jsonData.auth ?? "view",
      jsonData.attempt ?? 5,
      jsonData.isVerified !== undefined ? JSON.parse(jsonData.isVerified) : false,
      jsonData.designation ?? "",
      jsonData.referral_key ?? "",
      jsonData.createdAt ? new Date(jsonData.createdAt) : new Date(),
      jsonData.updatedAt ? new Date(jsonData.updatedAt) : new Date()
    );
  }

  // Method to convert AdminModel to a database-compatible format
  toDatabaseJson() {
    return {
      initial: this.initial,
      fullName: this.fullName,
      password: this.password,
      email: this.email,
      phone: this.phone,
      image: this.image,
      dob: this.dob,
      status: this.status,
      type: this.type,
      auth: this.auth,
      attempt: this.attempt,
      isVerified: this.isVerified,
      designation: this.designation,
      referral_key: this.referral_key,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Method to convert AdminModel to a client-facing format
  toClientJson() {
    return {
      initial: this.initial,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      image: this.image,
      isVerified: this.isVerified,
      status: this.status,
      dob: this.dob,
      type: this.type,
      auth: this.auth,
      attempt: this.attempt,
      designation: this.designation,
      referral_key: this.referral_key,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }



  // Method to update AdminModel with data from request body
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

export default AdminModel;

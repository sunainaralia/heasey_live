export const reqFields = {
    // user fields
    user: [
        "fullName",
        "password",
        "email",
        "dob",
        "phone"
    ],

    // Transactions Fields
    transactions: ["amount", "type"],

    // TDS Fields
    tds: ["userId", "type", "typeId", "amount"],

    // Routes Fields
    routes: ["name", "key", "route", "auth", "type", "noCollapse"],

    // Source fields
    src: ["title", "type", "rule", "range"],

    // Connection Fields
    con: ["userId", "storage", "transactionId"],

    // Slabs Fields
    slab: ["range", "space", "rent", "basicAmt", "tax", "type"],

    // Royality
    royality: ["range", "level", "rate", "rule", "status", "designation"],

    // Rewards Fields
    rewards: ["range", "rule", "type", "reward", "salary"],

    // Rent Fields
    rent: ["userId", "level", "storage", "amount", "connectionId", "status"],

    // Notifications Fields
    notifications: ["userId", "title", "description", "type", "link", "route", "icon"],

    // LimitRewards Fields
    claims: ["range", "rule", "type"],

    // KYC Fields
    kyc: [
        "userId",
        "bankName",
        "accountNo",
        "IFSC",
        "holder",
        "aadharNo",
        "panNo",
        "nomineeName",
        "nomineeRel",
        "nomineeAge",
    ],

    kycFiles: ["aadharFront", "aadharBack", "panFile", "sign"],

    // Income Fields
    income: ["userId", "amount", "type", "status"],

    // Business Transaction
    bussTransaction: ["amount", "type", "userId"],

    // Address Fields
    address: [
        "userId",
        "street",
        "city",
        "state",
        "country",
        "landmark",
        "zipcode",
    ],
    admin: [
        "initial", "fullName", "password", "email", "phone", "type"
    ],
    settings: ["title", "type", "value", "adminId"],
    category: ["title", "icon", "description", "type"],
    product: ["title", "description", "vendorId", "categoryId", "quantity", "sku", "price"],
    carousel: [
        "title",
        "path",
        "link",
        "route",
        "type",
        "size"
    ],
    review: ["review", "productId"],
    order: [
        "userId",
        "products"
    ],
    reward: [
        "range", "rule", "type", "title"
    ],
    coupon: ["title", "couponCode"],
    query: ["userId", "subject", "description", "severity"],
    reply: [
        "reply",
        "reviewId"
    ],
    feedback: [
        "userId",
        "data",
        "type",
        "description"
    ],
    cart: [
        "userId",
        "products"
    ],
    rating: [
        "productId",
        "rating"
    ], distribution: [
        "adminId", "rate", "level"
    ],
    transactions: ["amount", "type"],
    appReview: [
        "userId",
        "review",
        "rating"]
};

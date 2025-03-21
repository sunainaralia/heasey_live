
import {
    client
} from "../Db.js";

const collections = {
    // Admin Collection
    admins: () => client.db(process.env.MONGO_DATABASE).collection("admin"),
    // Transaction Collection
    transactions: () => client.db(process.env.MONGO_DATABASE).collection("transactions"),
    // User Collection
    users: () => client.db(process.env.MONGO_DATABASE).collection("users"),
    // Income Collection
    incomes: () => client.db(process.env.MONGO_DATABASE).collection("incomes"),
    // Consultation Collection
    consultaions: () => client.db(process.env.MONGO_DATABASE).collection("consultations"),
    // Address Collection
    address: () => client.db(process.env.MONGO_DATABASE).collection("address"),
    // Kyc Collection
    kyc: () => client.db(process.env.MONGO_DATABASE).collection("kyc"),
    // Limit Rewards Collection
    claims: () => client.db(process.env.MONGO_DATABASE).collection("claims"),
    // Notification Collection
    notification: () => client.db(process.env.MONGO_DATABASE).collection("notifications"),
    // Slab Collection
    products: () => client.db(process.env.MONGO_DATABASE).collection("products"),
    // Rent Collection
    salary: () => client.db(process.env.MONGO_DATABASE).collection("salary"),
    // Rewads Collection
    rewards: () => client.db(process.env.MONGO_DATABASE).collection("rewards"),
    // Royality Collection
    royality: () => client.db(process.env.MONGO_DATABASE).collection("royalities"),
    // Connection Collection
    orders: () => client.db(process.env.MONGO_DATABASE).collection("orders"),
    // Source Collection
    settings: () => client.db(process.env.MONGO_DATABASE).collection("settings"),
    // Routes Collection
    routes: () => client.db(process.env.MONGO_DATABASE).collection("routes"),
    // TDS Collection
    deduction: () => client.db(process.env.MONGO_DATABASE).collection("deduction"),
    // verification collection
    veriCollection: () => client.db(process.env.MONGO_DATABASE).collection("verification"),
    // settings collection
    settingsCollection: () => client.db(process.env.MONGO_DATABASE).collection("settings"),
    // categories collection
    categories: () => client.db(process.env.MONGO_DATABASE).collection("categories"),
    // carousel collection
    carousels: () => client.db(process.env.MONGO_DATABASE).collection("carousel"),
    //reviews collection
    reviews: () => client.db(process.env.MONGO_DATABASE).collection("reviews"),
    // coupons collection
    coupons: () => client.db(process.env.MONGO_DATABASE).collection("coupons"),
    // queries collection
    queries: () => client.db(process.env.MONGO_DATABASE).collection("queries"),
    // replies collection
    replies: () => client.db(process.env.MONGO_DATABASE).collection("replies"),
    // feedbacks collection
    feedbacks: () => client.db(process.env.MONGO_DATABASE).collection("feedbacks"),
    // cart collection
    cart: () => client.db(process.env.MONGO_DATABASE).collection("cart"),
    // rating collection
    rating: () => client.db(process.env.MONGO_DATABASE).collection("rating"),
    // distribution colleciton
    distribution: () => client.db(process.env.MONGO_DATABASE).collection("distribuiton"),
    // transaction collection
    transactions: () => client.db(process.env.MONGO_DATABASE).collection("transactions"),
    // product review collection 
    appReview: () => client.db(process.env.MONGO_DATABASE).collection("appReview"),
}

export default collections;
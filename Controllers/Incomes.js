import { ObjectId } from "mongodb";
import {
  columnCreated,
  fetched,
  InvalidId,
  serverError,
  tryAgain
} from "../Utils/Messages.js";
import collections from "../Utils/Collection.js";
import IncomeModel from "../Models/Incomes.js";

const incomeModel = new IncomeModel();

class Incomes {
  constructor() { }

  // Get all incomes
  async getAllIncome() {
    try {
      const result = await collections.incomes().find({}).toArray();
      return result.length
        ? { ...fetched("Incomes"), data: result.map(item => incomeModel.fromJson(item)) }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Get income by user ID
  async getIncomeByUserId(userId) {
    try {
      const result = await collections.incomes().find({ userId }).toArray();
      return result.length
        ? { ...fetched("User Incomes"), data: result.map(item => incomeModel.fromJson(item)) }
        : InvalidId("User");
    } catch (err) {
      return { ...serverError, err };
    }
  }

  // Create new income
  async createIncome(body) {
    const income = incomeModel.fromJson(body);
    try {
      const result = await collections.incomes().insertOne(income.toDatabaseJson());
      return result?.insertedId
        ? { ...columnCreated("Income"), data: { id: result.insertedId } }
        : tryAgain;
    } catch (err) {
      return { ...serverError, err };
    }
  }
}

export default Incomes;

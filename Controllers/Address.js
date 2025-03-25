import { ObjectId } from "mongodb";
import {
    columnCreated,
    columnUpdated,
    fetched,
    deleted,
    InvalidId,
    serverError,
    tryAgain
} from "../Utils/Messages.js";
import collections from "../Utils/Collection.js";
import AddressModel from "../Models/Address.js";

const addressModel = new AddressModel();

class Address {
    constructor() { }

    // Get all addresses
    async getAllAddresses() {
        try {
            const result = await collections.address().find({}).toArray();
            return result.length
                ? { ...fetched("Addresses"), data: result.map(addr => addressModel.fromJson(addr)) }
                : tryAgain;
        } catch (err) {
            return { ...serverError, err };
        }
    }

    // Get addresses by userId
    async getAddressesByUserId(userId) {
        try {
            const result = await collections.address().find({ userId }).toArray();
            return result.length
                ? { ...fetched("User Addresses"), data: result.map(addr => addressModel.fromJson(addr)) }
                : InvalidId("User");
        } catch (err) {
            return { ...serverError, err };
        }
    }

    // Create new address
    async createAddress(body) {
        const address = addressModel.fromJson(body);
        try {
            const result = await collections.address().insertOne(address.toDatabaseJson());
            return result?.insertedId
                ? { ...columnCreated("Address"), data: { id: result.insertedId } }
                : tryAgain;
        } catch (err) {
            return { ...serverError, err };
        }
    }

    // Update address by ID
    async updateAddressById(body) {
        try {
            const { id } = body;
            const updateData = addressModel.toUpdateJson(body);
            const result = await collections.address().updateOne(
                { _id: new ObjectId(id) },
                { $set: { ...updateData } }
            );

            return result.acknowledged && result.modifiedCount > 0
                ? { ...columnUpdated("Address") }
                : InvalidId("Address");
        } catch (err) {
            return { ...serverError, err };
        }
    }

    // Delete address by ID
    async deleteAddressById(id) {
        try {
            const result = await collections.address().deleteOne({ _id: new ObjectId(id) });
            return result.deletedCount > 0
                ? { ...deleted("Address") }
                : InvalidId("Address");
        } catch (err) {
            return { ...serverError, err };
        }
    }
}

export default Address;

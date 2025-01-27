class AddressModel {
    constructor(
        userId,
        street,
        city,
        state,
        country,
        landmark,
        zipcode,
        createdAt,
        updatedAt
    ) {
        this.userId = userId;
        this.street = street;
        this.city = city;
        this.state = state;
        this.country = country;
        this.landmark = landmark;
        this.zipcode = zipcode;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new AddressModel(
            jsonData.userId,
            jsonData.street,
            jsonData.city,
            jsonData.state,
            jsonData.country,
            jsonData.landmark,
            jsonData.zipcode,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }


    // Function to convert User instance to a JSON object suitable for database insertion
    toDatabaseJson() {
        return {
            userId: this.userId,
            street: this.street,
            city: this.city,
            state: this.state,
            country: this.country,
            landmark: this.landmark,
            zipcode: this.zipcode,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }



    toUpdateJson(body) {
        const updateJson = {};

        for (const key in body) {
            if (key !== "id" && this.hasOwnProperty(key) && body[key] !== undefined && body[key] !== "") {
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

export default AddressModel;

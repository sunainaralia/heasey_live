class FeedbackModel {
    constructor(
        id,
        userId,
        data,
        type,
        status,
        description,
        name,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.data = data;
        this.type = type;
        this.status = status;
        this.description = description;
        this.name = name;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new FeedbackModel(
            jsonData._id ?? null,
            jsonData.userId != undefined && jsonData.userId != null && !isNaN(parseInt(jsonData.userId)) ? parseInt(jsonData.userId) : jsonData.userId ?? 0,
            jsonData.data != undefined && jsonData.data != null && !isNaN(parseInt(jsonData.data)) ? parseFloat(jsonData.data) : jsonData.data ?? 0,
            jsonData.type ?? "lifetime",
            jsonData.status != undefined ? JSON.parse(jsonData.status) : false,
            jsonData.description ?? "",
            jsonData.name != undefined && jsonData.name != null && !isNaN(parseInt(jsonData.name)) ? parseFloat(jsonData.name) : jsonData.name ?? "",
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }

    toDatabaseJson() {
        return {
            userId: this.userId,
            data: this.data,
            type: this.type,
            status: this.status,
            description: this.description,
            name: this.name,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    toUpdateJson(body) {
        const updateJson = {};

        for (const key in body) {
            if (key != "id" && this.hasOwnProperty(key) && body[key] !== null && body[key] !== undefined && body[key] !== "") {
                let value = body[key];

                // Convert string representation of boolean to actual boolean
                if (value === "true" || value === "false") {
                    value = value === "true";
                }

                // Convert string representation of number to actual number
                const parsedNumber = parseInt(value);
                if (!isNaN(parsedNumber)) {
                    value = parsedNumber;
                }

                updateJson[key] = value;
            }
        }

        updateJson.updatedAt = new Date();
        return updateJson;
    }
}

export default FeedbackModel;
class ClaimModel {
    constructor(id, userId, rewardId, reward, type, status, createdAt, updatedAt) {
        this.id = id;
        this.userId = userId;
        this.rewardId = rewardId;
        this.title = title;
        this.type = type;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new ClaimModel(
            jsonData._id ?? null,
            jsonData.userId ?? "",
            jsonData.rewardId ?? "",
            jsonData.title ?? "",
            jsonData.type ?? "",
            jsonData.status ?? false,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }

    toDatabaseJson() {

        return {
            userId: this.userId,
            rewardId: this.rewardId,
            title: this.title,
            type: this.type,
            status: this.status,
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

export default ClaimModel;
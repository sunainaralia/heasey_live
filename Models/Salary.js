class endDateModel {
    constructor(
        id,
        userId,
        status,
        amount,
        rewardId,
        endDate,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.status = status;
        this.amount = amount;
        this.rewardId = rewardId;
        this.endDate = endDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new endDateModel(
            jsonData._id ?? null,
            jsonData.userId != undefined && jsonData.userId != null && !isNaN(parseInt(jsonData.userId)) ? parseInt(jsonData.userId) : jsonData.userId ?? 0,
            jsonData.status != undefined ? JSON.parse(jsonData.status) : false,
            jsonData.amount ?? "",
            jsonData.rewardId != undefined && jsonData.rewardId != null && !isNaN(parseInt(jsonData.rewardId)) ? parseFloat(jsonData.rewardId) : jsonData.rewardId ?? 0,
            jsonData.endDate != undefined && jsonData.endDate != null && !isNaN(parseInt(jsonData.endDate)) ? parseFloat(jsonData.endDate) : jsonData.endDate ?? 0,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }

    toDatabaseJson() {
        return {
            userId: this.userId,
            status: this.status,
            amount: this.amount,
            rewardId: this.rewardId,
            endDate: this.endDate,
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

export default endDateModel;
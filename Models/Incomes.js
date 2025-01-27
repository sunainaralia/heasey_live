class IncomeModel {
    constructor(
        id,
        userId,
        sourceId,
        level,
        type,
        amount,
        status,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.sourceId = sourceId;
        this.level = level;
        this.type = type;
        this.amount = amount;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new IncomeModel(
            jsonData._id ?? null,
            jsonData.userId ?? "",
            jsonData.sourceId ?? "",
            jsonData.level ?? "",
            jsonData.type ?? "tds",
            jsonData.amount ?? "",
            jsonData.status ?? false,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }

    toDatabaseJson() {

        return {
            userId: this.userId,
            sourceId: this.sourceId,
            level: this.level,
            type: this.type,
            amount: this.amount,
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

export default IncomeModel;
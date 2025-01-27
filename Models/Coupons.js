class CouponsModel {
    constructor(
        id,
        title,
        userId,
        productId,
        couponCode,
        amount,
        percent,
        type,
        status,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.title = title;
        this.userId = userId;
        this.productId = productId;
        this.couponCode = couponCode;
        this.amount = amount;
        this.percent = percent;
        this.type = type;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new CouponsModel(
            jsonData._id ?? null,
            jsonData.title ?? "",
            jsonData.userId ?? "",
            jsonData.productId ?? "",
            jsonData.couponCode ?? "",
            jsonData.amount ?? "",
            jsonData.percent ?? "",
            jsonData.type ?? "",
            jsonData.status ?? false,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }

    toDatabaseJson() {

        return {
            title: this.title,
            userId: this.userId,
            productId: this.productId,
            couponCode: this.couponCode,
            amount: this.amount,
            percent: this.percent,
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

export default CouponsModel;
class OrdersModel {
    constructor(
        id,
        userId,
        products,
        type,
        status,
        amount,
        discount,
        image,
        createdAt,
        updatedAt,
        orderId,
        shippingFee,
        coupan,
        platformFee,
        price,
        transactionId,
        sponsorId,
        couponAmount,
        taxValue

    ) {
        this.id = id;
        this.userId = userId;
        this.products = products;
        this.type = type;
        this.status = status;
        this.amount = amount;
        this.discount = discount;
        this.image = image;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.orderId = orderId;
        this.shippingFee = shippingFee;
        this.coupan = coupan;
        this.platformFee = platformFee;
        this.price = price;
        this.transactionId = transactionId;
        this.sponsorId = sponsorId;
        this.couponAmount = couponAmount;
        this.taxValue = taxValue
    }

    static fromJson(jsonData) {
        return new OrdersModel(
            jsonData._id ?? null,
            jsonData.userId,
            jsonData.products ?? [],
            jsonData.type,
            jsonData.status ?? false,
            jsonData.amount,
            jsonData.discount,
            jsonData.image,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date(),
            jsonData.orderId ?? "",
            jsonData.shippingFee ?? 0,
            jsonData.coupan ?? [],
            jsonData.platformFee ?? 0,
            jsonData.price ?? 0,
            jsonData.transactionId ?? "",
            jsonData.sponsorId ?? "",
            jsonData.couponAmount ?? 0,
            jsonData.taxValue ?? 0
        );
    }



    // Function to convert User instance to a JSON object suitable for database insertion
    toDatabaseJson() {
        return {
            userId: this.userId,
            products: this.products,
            type: this.type,
            status: this.status,
            amount: this.amount,
            discount: this.discount,
            image: this.image,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            orderId: this.orderId,
            shippingFee: this.shippingFee,
            coupan: this.coupan,
            platformFee: this.platformFee,
            price: this.price,
            transactionId: this.transactionId,
            sponsorId: this.sponsorId,
            couponAmount: this.couponAmount,
            taxValue: this.taxValue
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

    static fromJsonArray(jsonArray) {
        return jsonArray.map(order => OrdersModel.fromJson(order));
    }


}

export default OrdersModel;

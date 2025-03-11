class OrdersModel {
    constructor(
        id,
        userId,
        title,
        productId,
        type,
        status,
        amount,
        discount,
        image,
        vendorId,
        createdAt,
        updatedAt,
        orderId,
        shippingFee,
        coupan,
        platformFee,
        price,
        transactionId,
        sponsorId

    ) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.productId = productId;
        this.type = type;
        this.status = status;
        this.amount = amount;
        this.discount = discount;
        this.image = image;
        this.vendorId = vendorId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.orderId = orderId;
        this.shippingFee = shippingFee;
        this.coupan = coupan;
        this.platformFee = platformFee;
        this.price = price;
        this.transactionId = transactionId;
        this.sponsorId = sponsorId
    }

    fromJson(jsonData) {
        return new OrdersModel(
            jsonData.id ?? null,
            jsonData.userId,
            jsonData.title,
            jsonData.productId,
            jsonData.type,
            jsonData.status ?? false,
            jsonData.amount,
            jsonData.discount,
            jsonData.image,
            jsonData.vendorId,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date(),
            jsonData.orderId ?? "",
            jsonData.shippingFee ?? 0,
            jsonData.coupan ?? [],
            jsonData.platformFee ?? 0,
            jsonData.price ?? 0,
            jsonData.transactionId ?? "",
            jsonData.sponsorId ?? ""
        );
    }


    // Function to convert User instance to a JSON object suitable for database insertion
    toDatabaseJson() {
        return {
            userId: this.userId,
            title: this.title,
            productId: this.productId,
            type: this.type,
            status: this.status,
            amount: this.amount,
            discount: this.discount,
            image: this.image,
            vendorId: this.vendorId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            orderId: this.orderId,
            shippingFee: this.shippingFee,
            coupan: this.coupan,
            platformFee: this.platformFee,
            price: this.price,
            transactionId: this.transactionId,
            sponsorId: this.sponsorId
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

export default OrdersModel;

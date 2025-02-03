class ProductsModel {
    constructor(
        id,
        title,
        description,
        vendorId,
        categoryId,
        discount,
        images,
        quantity,
        sku,
        status,
        createdAt,
        updatedAt,
        price
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.vendorId = vendorId;
        this.categoryId = categoryId;
        this.discount = discount;
        this.images = images;
        this.quantity = quantity;
        this.sku = sku;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.price = price
    }

    fromJson(jsonData) {
        return new ProductsModel(
            jsonData._id ?? null,
            jsonData.title ?? "",
            jsonData.description ?? "",
            jsonData.vendorId ?? "",
            jsonData.categoryId ?? "",
            jsonData.discount ?? [],
            jsonData.images ?? [],
            jsonData.quantity ?? "",
            jsonData.sku ?? "",
            jsonData.status != null ? JSON.parse(jsonData.status) : false,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date(),
            jsonData.price ?? 0
        );
    }

    toDatabaseJson() {
        return {
            title: this.title,
            description: this.description,
            vendorId: this.vendorId,
            categoryId: this.categoryId,
            discount: this.discount,
            images: this.images,
            quantity: this.quantity,
            sku: this.sku,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            price: this.price
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

export default ProductsModel;

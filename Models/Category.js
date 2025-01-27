class CategoryModel {
    constructor(
        title,
        icon,
        description,
        parentId,
        type,
        metaTitle,
        metaDesc,
        status,
        createdAt,
        updatedAt
    ) {
        this.title = title;
        this.icon = icon;
        this.description = description;
        this.parentId = parentId;
        this.type = type;
        this.metaTitle = metaTitle;
        this.metaDesc = metaDesc;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new CategoryModel(
            jsonData.title ?? "",
            jsonData.icon ?? "",
            jsonData.description ?? "",
            jsonData.parentId ?? "",
            jsonData.type ?? "parent",
            jsonData.metaTitle ?? "",
            jsonData.metaDesc ?? "",
            jsonData.status != null ? JSON.parse(jsonData.status) : true,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }


    // Function to convert User instance to a JSON object suitable for database insertion
    toDatabaseJson() {
        return {
            title: this.title,
            icon: this.icon,
            description: this.description,
            parentId: this.parentId,
            type: this.type,
            metaTitle: this.metaTitle,
            metaDesc: this.metaDesc,
            status: this.status,
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

export default CategoryModel;

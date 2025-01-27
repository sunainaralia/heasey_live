class NotificationModel {
    constructor(
        id,
        title,
        description,
        userId,
        type,
        link,
        route,
        icon,
        status,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.userId = userId;
        this.type = type;
        this.link = link;
        this.route = route;
        this.icon = icon;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new NotificationModel(
            jsonData._id ?? null,
            jsonData.title ?? "",
            jsonData.description ?? "",
            jsonData.userId ?? "",
            jsonData.type ?? "",
            jsonData.link ?? "",
            jsonData.route ?? "",
            jsonData.icon ?? "",
            jsonData.status != null ? JSON.parse(jsonData.status) : false,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }

    toDatabaseJson() {
        return {
            title: this.title,
            description: this.description,
            userId: this.userId,
            type: this.type,
            link: this.link,
            route: this.route,
            icon: this.icon,
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

export default NotificationModel;

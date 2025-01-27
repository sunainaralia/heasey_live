class CarouselModel {
    constructor(
        title,
        path,
        link,
        route,
        color,
        opacity,
        type,
        size,
        status,
        createdAt,
        updatedAt
    ) {
        this.title = title;
        this.path = path;
        this.link = link;
        this.route = route;
        this.color = color;
        this.opacity = opacity;
        this.type = type;
        this.size = size;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new CarouselModel(
            jsonData.title ?? null,
            jsonData.path ?? "",
            jsonData.link ?? "",
            jsonData.route ?? "",
            jsonData.color ?? "black",
            jsonData.opacity ?? 1,
            jsonData.type ?? "home",
            jsonData.size ?? 1200,
            jsonData.status != null ? JSON.parse(jsonData.status) : true,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }


    // Function to convert User instance to a JSON object suitable for database insertion
    toDatabaseJson() {
        return {
            title: this.title,
            path: this.path,
            link: this.link,
            route: this.route,
            color: this.color,
            opacity: this.opacity,
            type: this.type,
            size: this.size,
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

export default CarouselModel;

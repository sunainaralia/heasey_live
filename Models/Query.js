class QueryModel {
    constructor(
        id,
        userId,
        description,
        subject,
        severity,
        contact,
        status,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.description = description;
        this.subject = subject;
        this.severity = severity;
        this.contact = contact;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new QueryModel(
            jsonData._id ?? null,
            jsonData.userId ?? "",
            jsonData.description ?? "",
            jsonData.subject ?? "",
            jsonData.severity ?? "",
            jsonData.contact ?? [],
            jsonData.status != null ? JSON.parse(jsonData.status) : false,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }

    toDatabaseJson() {
        return {
            userId: this.userId,
            description: this.description,
            subject: this.subject,
            severity: this.severity,
            contact: this.contact,
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

export default QueryModel;

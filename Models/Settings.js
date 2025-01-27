class SettingsModel {
    constructor(
        id,
        adminId,
        title,
        value,
        type,
        status,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.adminId = adminId;
        this.title = title;
        this.value = value;
        this.type = type;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromJson(jsonData) {
        return new Settings(
            jsonData._id ?? null,
            jsonData.adminId ?? "",
            jsonData.title ?? "",
            jsonData.value ?? "",
            jsonData.type ?? "",
            jsonData.status === "true" || jsonData.status === true,
            jsonData.createdAt ? new Date(jsonData.createdAt) : new Date(),
            jsonData.updatedAt ? new Date(jsonData.updatedAt) : new Date()
        );
    }

    toDatabaseJson() {
        return {
            adminId: this.adminId,
            title: this.title,
            value: this.value,
            type: this.type,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    toClientJson() {
        return {
            id: this.id,
            adminId: this.adminId,
            title: this.title,
            value: this.value,
            type: this.type,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    toUpdateJson(body) {
        const updateJson = {};

        for (const key in body) {
            if (key !== "id" && this.hasOwnProperty(key) && body[key] !== null && body[key] !== undefined && body[key] !== "") {
                let value = body[key];

                if (value === "true" || value === "false") {
                    value = value === "true";
                }

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

export default SettingsModel;

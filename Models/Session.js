class SessionModel {
    constructor(
        id,
        ip,
        rule,
        type,
        status,
        reward,
        royality,
        salary,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.ip = ip;
        this.rule = rule;
        this.type = type;
        this.status = status;
        this.reward = reward;
        this.royality = royality;
        this.salary = salary;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new SessionModel(
            jsonData._id ?? null,
            jsonData.ip != undefined && jsonData.ip != null && !isNaN(parseInt(jsonData.ip)) ? parseInt(jsonData.ip) : jsonData.ip ?? 0,
            jsonData.rule != undefined && jsonData.rule != null && !isNaN(parseInt(jsonData.rule)) ? parseFloat(jsonData.rule) : jsonData.rule ?? 0,
            jsonData.type ?? "lifetime",
            jsonData.status != undefined ? JSON.parse(jsonData.status) : false,
            jsonData.reward ?? "",
            jsonData.royality != undefined && jsonData.royality != null && !isNaN(parseInt(jsonData.royality)) ? parseFloat(jsonData.royality) : jsonData.royality ?? 0,
            jsonData.salary != undefined && jsonData.salary != null && !isNaN(parseInt(jsonData.salary)) ? parseFloat(jsonData.salary) : jsonData.salary ?? 0,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }

    toDatabaseJson() {
        return {
            ip: this.ip,
            rule: this.rule,
            type: this.type,
            status: this.status,
            reward: this.reward,
            royality: this.royality,
            salary: this.salary,
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
                const parsedNumber = parseInt(value);
                if (!isNaN(parsedNumber)) {
                    value = parsedNumber;
                }

                updateJson[key] = value;
            }
        }

        updateJson.updatedAt = new Date();
        return updateJson;
    }
}

export default SessionModel;
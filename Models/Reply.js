class ReplyModel {
    constructor(
        id,
        userId,
        reply,
        anonymous,
        reviewId,
        like,
        status,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.userId = userId;
        this.reply = reply;
        this.anonymous = anonymous;
        this.reviewId = reviewId;
        this.like = like;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    fromJson(jsonData) {
        return new ReplyModel(
            jsonData._id ?? null,
            jsonData.userId ?? "",
            jsonData.reply ?? "",
            jsonData.anonymous ?? "",
            jsonData.reviewId ?? "",
            jsonData.like ?? [],
            jsonData.status != null ? JSON.parse(jsonData.status) : true,
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date()
        );
    }

    toDatabaseJson() {
        return {
            userId: this.userId,
            reply: this.reply,
            anonymous: this.anonymous,
            reviewId: this.reviewId,
            like: this.like,
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

export default ReplyModel;

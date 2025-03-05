class UserModel {
    constructor(
        _id,
        fullName,
        password,
        email,
        countryCode,
        phone,
        image,
        dob,
        status,
        type,
        attempt,
        isVerified,
        sponsorId,
        placementId,
        placementLevel,
        level,
        leader,
        rewardId,
        designation,
        totalEarn,
        debited,
        wallet,
        withdraw,
        gstIn,
        referralId,
        createdAt,
        updatedAt,
        canLogin,
        address,
        likedProducts
    ) {
        this._id = _id;
        this.fullName = fullName;
        this.password = password;
        this.email = email;
        this.countryCode = countryCode;
        this.phone = phone;
        this.image = image;
        this.dob = dob;
        this.status = status;
        this.type = type;
        this.attempt = attempt;
        this.isVerified = isVerified;
        this.sponsorId = sponsorId;
        this.placementId = placementId;
        this.placementLevel = placementLevel;
        this.level = level;
        this.leader = leader;
        this.rewardId = rewardId;
        this.designation = designation;
        this.totalEarn = totalEarn;
        this.debited = debited;
        this.wallet = wallet;
        this.withdraw = withdraw;
        this.gstIn = gstIn;
        this.referralId = referralId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.canLogin = canLogin;
        this.address = address;
        this.likedProducts = likedProducts
    }

    fromJson(jsonData) {
        return new UserModel(
            jsonData._id,
            jsonData.fullName ?? "Not Available",
            jsonData.password,
            jsonData.email ?? "",
            jsonData.countryCode ?? "IN",
            jsonData.phone,
            jsonData?.image ?? "",
            jsonData.dob ?? "dd-mm-yyyy",
            jsonData.status != null ? JSON.parse(jsonData.status) : false,
            jsonData.type ?? "individual",
            jsonData.attempt != null ? parseInt(jsonData.attempt) : 5,
            jsonData?.isVerified != null ? JSON.parse(jsonData.isVerified) : false,
            jsonData.sponsorId ?? "",
            jsonData.placementId ?? "",
            jsonData.placementLevel != null ? parseInt(jsonData.placementLevel) : 0,
            jsonData.level != null ? parseInt(jsonData.level) : 0,
            jsonData.leader ?? false,
            jsonData.rewardId ?? [],
            jsonData.designation ?? "",
            jsonData.totalEarn != null ? parseInt(jsonData.totalEarn) : 0,
            jsonData.debited != null ? parseInt(jsonData.debited) : 0,
            jsonData.wallet != null ? parseInt(jsonData.wallet) : 0,
            jsonData.withdraw ?? 0,
            jsonData.gstIn ?? 0,
            jsonData.referralId ?? "",
            jsonData.createdAt ?? new Date(),
            jsonData.updatedAt ?? new Date(),
            jsonData.canLogin ?? false,
            jsonData.address ?? "",
            jsonData.likedProducts??[]
        );
    }


    // Function to convert User instance to a JSON object suitable for database insertion
    toDatabaseJson() {
        return {
            _id: this._id,
            fullName: this.fullName,
            password: this.password,
            email: this.email,
            countryCode: this.countryCode,
            phone: this.phone,
            image: this.image,
            dob: this.dob,
            status: this.status,
            type: this.type,
            attempt: this.attempt,
            isVerified: this.isVerified,
            sponsorId: this.sponsorId,
            placementId: this.placementId,
            placementLevel: this.placementLevel,
            level: this.level,
            leader: this.leader,
            rewardId: this.rewardId,
            designation: this.designation,
            totalEarn: this.totalEarn,
            debited: this.debited,
            wallet: this.wallet,
            withdraw: this.withdraw,
            gstIn: this.gstIn,
            referralId: this.referralId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            canLogin: this.canLogin,
            address: this.address,
            likedProducts: this.likedProducts
        };
    }

    // Data to client
    toClientJson() {
        return {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
            countryCode: this.countryCode,
            phone: this.phone,
            image: this.image,
            dob: this.dob,
            status: this.status,
            isVerified: this.isVerified,
            type: this.type,
            attempt: this.attempt,
            sponsorId: this.sponsorId,
            placementId: this.placementId,
            placementLevel: this.placementLevel,
            level: this.level,
            leader: this.leader,
            rewardId: this.rewardId,
            designation: this.designation,
            totalEarn: this.totalEarn,
            debited: this.debited,
            wallet: this.wallet,
            referralId: this.referralId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            canLogin: this.canLogin,
            address: this.address,
            likedProducts: this.likedProducts
        };
    }

    toMemberJson(e) {
        return {
            _id: e._id,
            fullName: e.fullName,
            email: e.email,
            countryCode: e.countryCode,
            phone: e.phone,
            status: e.status,
            isVerified: e.isVerified,
            level: parseInt(e.level),
            placementLevel: parseInt(e.placementLevel),
            sponsorId: e.sponsorId,
            placementId: e.placementId,
            wallet: e.wallet,
            referralId: e.referralId,
            createdAt: e.createdAt,
            canLogin: e.canLogin,
            address: e.address,
            likedProducts: e.likedProducts
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

export default UserModel;

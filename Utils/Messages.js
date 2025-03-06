// 200 Response
export const found = (data) => {
    return {
        status: 200,
        message: `${data} Found Successfully!`
    }
}

export const noToken = {
    status: 200,
    message: "Welcome to Heasey!"
}

export const loggedIn = {
    status: 200,
    message: "You are successfully Logged In."
}


// 404 Response
export const invalidId = (type) => {
    return {
        status: 404,
        message: `${type} you provide is Invalid.`
    }
}
// no image uploaded
export const uploadError = () => {
    return {
        status: 400,
        message: "No photo uploaded.please try again"
    }
}

export const noAccess = {
    status: 404,
    message: "You have no right access for this operation."
}

export const attemptLeft = (atm) => {
    return {
        status: 404,
        message: atm > 0 ? `Invalid Password. ${atm} Attempts left.` : "Your account has been locked due to invalid login attempts. It will be unlocked after 24 hours. Kindly contact support team for further assistance"
    }
}

export const notVerified = {
    status: 401,
    message: "You are not verified. Kindly complete your profile."
}


// 400 Response
export const expired = {
    status: 400,
    message: "Your Session has been expired!"
}

export const notFound = (type) => {
    return {
        status: 400,
        message: `${type} not Found!`
    }
}

export const requiredFields = (fields) => {
    return {
        status: 400,
        message: `${fields} is required!`,
    };
};

export const limitExceeded = (type) => {
    return {
        status: 400,
        message: `You can't use this ${type} anymore. Limit Exceeded`
    }
}
export const limitedSuperAdmin = () => {
    return {
        status: 400,
        message: `You are not authorized to register as super admin`
    }
}

export const notMatched = {
    status: 400,
    message: "Your password & confirm password is not matched."
}

export const invalidFormat = {
    status: 400,
    message: "Password you entered can't be accepted. Your password must contain atleast one capital letter & must be alphanumeric."
}

// 409 Responses

export const alreadyExist = (type) => {
    return {
        status: 409,
        message: `${type} is already exist.`
    }
}

// 500 Response

export const serverError = {
    status: 500,
    message: "Internal Server Error. Kindly contact support team."
}

export const tryAgain = {
    status: 500,
    message: "Something went wrong, Kindly try again."
}
export const unauthorized = {
    status: 401,
    message: "Unauthorized Request",
};
export const InvalidId = (type) => {
    return {
        status: 400,
        type: `invalid`,
        message: `Invalid ${type} ID`,
    };
};
export const columnCreated = (type) => {
    return {
        status: 200,
        message: `${type} has been created Successfully!`,
    };
};
export const columnUpdated = (type) => {
    return {
        status: 200,
        message: `${type} has been updated Successfully!`,
    };
};
export const deleted = (table) => {
    return {
        status: 200,
        message: `${table} has been deleted Successfully`,
    };
};
export const fetched = (column) => {
    return {
        status: 200,
        message: `${column} details are ready!`,
    };
};
export const markedRead = {
    status: 200,
    message: "Notification has been marked read."
};
export const notExist = (collection) => {
    return {
        status: 404,
        message: `${collection} not found`,
    };
};
export const readed = {
    status: 200,
    message: "Notification Marked read!",
};
export const registered = (id, email) => {
    return {
        status: 200,
        message: `Congratulations! You are the part of Heasey. Kindly login using your Email ID and password.\n ( USER ID : ${id}; EMAIL: : ${email} ).`
    }
};
export const invalidLoginCred = (attempt) => {
    return {
        status: 400,
        message: `Invalid Password. ${attempt} Attempts left. Kindly reset your password or enter correct password`,
    }
};
export const otpSent = {
    status: 200,
    message:
        "OTP has been sent to your registered mobile No & Email address. OTP is valid for 5 minutes.",
};
export const invalidOtp = {
    status: 400,
    message: "Invalid or Expired OTP. Kindly enter valid OTP..",
};
export const urlNotFound = {
    status: 404,
    message: "The given url is not present"
}
export const InvalidEmail = (type) => {
    return {
        status: 400,
        type: `invalid`,
        message: `Invalid ${type} email`,
    };
};
export const accActivatedSub = "Your Heasey Account Acctivated successfully!";
export const accountActivated = (userId, name) => {
    return `
<!DOCTYPE html>
                <html>
                    <body>
                        <p>Hello ${name},</p>
                        <ul>
                        <li>User ID: ${userId}</li>
                        <li>You are successfully Activated by Heasey Administrators.</li>
                        <li>Welcome to the world of Knoone India Limited.</li>
                        </ul><br/>
                        <p>Continue Login: <a href="https://acc.heasey.com">click here</a></p></br>
                          <p> Thanks & Regards </p>
                           <p> Heasey India Limited </p>
                    </body>
                </html>`;
};
export const accountCreated = (userId, name) => {
    return `
  <!DOCTYPE html>
  <html>
      <body>
          <p>Hello ${name},</p><br/><br/>
          
          <p>We wanted to inform you that your account has been successfully created with Knoone India Limited.</p>
          <p>Currently, your account is under review by our team. You will be notified as soon as the review process is complete.</p>
          <ul>
            <li><strong>User ID:</strong> ${userId}</li>
          </ul>
          <p>If you have any questions or concerns in the meantime, please feel free to reach out to us. We're here to help!</p>
          <br/>
          <p>Thank you for choosing Knoone India Limited. We appreciate your patience and look forward to serving you.</p>
          <br/>
          <p>Best Regards,</p>
          <p>The Knoone India Limited Team</p>
      </body>
  </html>
  `;
};
export const alreadyActive = {
    status: 206,
    message: "Your Account is already Active",
};
export const forgetPasswordContent = (userId, name) => {
    return `
<!DOCTYPE html>
                <html>
                    <body>
                        <p>Hello ${name},</p>
                        <p>Your Account recovery has been Intiated</p>
                        <ul>
                            <li>User ID: ${userId}</li>
                            <li>If this recovery isn't done by you, kindly contact support team</li>
                        </ul>
                        <p> For More, write us at: Support Email: info@Knoone.com</p>
                        <p>Thanks & Regards</p><br/>
                        <p>Knoone India Limited!</p>
                    </body>
                </html>`;
};
export const limitCrossed = {
    status: 400,
    type: "blocked",
    message:
        "Your have exhausted you login limit. Please contact support team to reactivate your account.",
};
export const loginOtp = (userId, otp, name) => {
    return `
<!DOCTYPE html>
                <html>
                    <body>
                        <p>Hello ${name},</p>
                        <ul>
                            <li>User ID: ${userId}</li>
                            <li>Your verification code is - ${otp}</li>
                            <li>Please don't share code with anyone. Knoone Team never ask you for any otp.</li>
                        </ul>
                        <p> For More, write us at: Support Email: info@Knoone.com</p>
                        <p>Thanks & Regards</p>
                        <p>Knoone India Limited!</p>
                    </body>
                </html>`;
};
export const otPSentForPass = {
    status: 200,
    message:
        "OTP has been sent to your registered mobile No & Email address. OTP is valid for 5 minutes.",
};
export const otpSentSub = "Heasey Account Authentication!";
export const userActivated = {
    status: 200,
    message: `Account is activated Successfully!`,
};
export const unauthorizedLogin = (id) => {
    return {
        status: 400,
        message: `please verify your ${id} firstly`
    }
};
export const passwordUpdated = {
    status: 200,
    message: "Your password has been updated successfully"
}
export const failedToUpdate = {
    status: 401,
    message: "Failed to update password. Please try again"
}
export const invalidCurrentPassword = {
    status: 401,
    message: "Current password is incorrect"
}
export const updateCartFailed = { status: 500, message: "Failed to update cart" }
export const failedToCreate = { status: 500, message: "Failed to create new cart collection" };
export const updateProductQuantity = { status: 200, message: "Product quantity updated successfully" };
export const productRemoved = { status: 200, message: "Product removed from cart" };
export const productLiked = {
    status: 200,
    message: "Product liked successfully",
}
export const productDisliked = {
    status: 200,
    message: "Product disliked successfully",
}
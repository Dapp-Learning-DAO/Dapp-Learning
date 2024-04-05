const { generateNonce } = require("siwe");
const jwt = require("jsonwebtoken");

const { userLoginError, userNonceError } = require("../constant/error.type");
const { JWT_SECRET } = require("../config/config.default");
class UserControll {

  async login(ctx, next) {
    const { siwe } = ctx;
    const { address, chainId } = siwe;
    try {
      ctx.body = {
        code: 0,
        message: "登录成功",
        result: {
          token: jwt.sign(
            { address, chainId },
            JWT_SECRET,
            {
              expiresIn: "1d",
            }
          ),
        },
      };
    } catch (error) {
      ctx.app.emit("error", userLoginError, ctx);
    }
  }

  async getNonce(ctx, next) {
    try {
      const nonce = generateNonce();
      ctx.nonce = nonce;
      ctx.body = {
        status: 0,
        message: "获取nonce成功",
        result: {
          nonce,
        },
      };
    } catch (error) {
      ctx.app.emit("error", userNonceError, ctx);
    }
  }
}

module.exports = new UserControll();

const Router = require("koa-router");
const {
  userValidator,
  verifyUser,
 
} = require("../middleware/user.middleware");
const { login, getNonce } = require("../controller/user.controll");
const router = new Router({
  prefix: "/user",
});

router.get("/nonce", getNonce);

router.post("/login", userValidator, verifyUser, login);



module.exports = router;

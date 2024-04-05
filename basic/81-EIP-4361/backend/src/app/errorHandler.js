module.exports = (error, ctx) => {
  let status = 500;
  switch (error.code) {
    case "10001":
      status = 400;
      break;
    case "10002":
      status = 409;
      break;
    default:
      status = 500;
  }
  ctx.status = status;
  ctx.body = error;
};

const EOL = require("os").EOL;
const path = require("path");
const fs = require("fs");
// we want to generate a TOTP in the _future_, and the `notp`
// library doesn't let us do that unless we set `NODE_ENV = "test"`
process.env.NODE_ENV = "test";

const b32 = require("thirty-two");
const notp = require("notp");
const bin = b32.decode(process.env.NPM_OTP_KEY);
// generate a code 1 seconds in the future
// 1 seconds is arbitrary, and may need to be tweaked if
// the release process is discovered to be too fast or too slow.
const timeOffset = 1000;
const now = Date.now();
const time = now + timeOffset;
// _t is the time at which we want the OTP to be valid for
const otp = notp.totp.gen(bin, {_t: time});

// save to .npmrc so `npm publish` can pick it up later
fs.appendFileSync(path.join(__dirname, "..", ".npmrc"), `${EOL}otp=${otp}`);

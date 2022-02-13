// read and save redpacket contract deployment json file
const path = require('path');
const fs = require('fs');

const DEPLOYMENGT_DIR = path.join(__dirname, '/scripts/redpacket/deployment.json');

/*
 * deployment:
 *   redPacketAddress
 *   redPacketOwner
 *   redPacketID
 *   simpleTokenAddress
 */
function readRedpacketDeployment() {
  if (!fs.existsSync(DEPLOYMENGT_DIR)) return null;
  try {
    return JSON.parse(fs.readFileSync(DEPLOYMENGT_DIR, { encoding: 'utf-8' }));
  } catch {
    return null;
  }
}

function saveRedpacketDeployment(payload) {
  let oldData = readRedpacketDeployment();
  if (!oldData) oldData = {};
  fs.writeFileSync(
    DEPLOYMENGT_DIR,
    JSON.stringify({
      ...oldData,
      ...payload,
    }),
    { flag: 'w+' }
  );
  return true;
}

module.exports = {
  readRedpacketDeployment,
  saveRedpacketDeployment,
};

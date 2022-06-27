const fs = require("fs");

const updateConfig = (func) => {
  const previous = JSON.parse(fs.readFileSync("config.json"));
  const updated = func(previous);
  fs.writeFileSync("config.json", JSON.stringify(updated, null, 2));
};

const readConfig = () => {
  return JSON.parse(fs.readFileSync("config.json"));
};

const setConfig = (path, val) => {
  path = path.split(".").reverse();
  updateConfig((config) => {
    var ref = config;
    while (path.length > 1) {
      const key = path.pop();
      if (!ref[key]) ref[key] = {};
      ref = ref[key];
    }
    ref[path.pop()] = val;
    return config;
  });
};

module.exports = {
  readConfig,
  setConfig,
  updateConfig,
};

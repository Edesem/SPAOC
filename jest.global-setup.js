// The parish is on Australia/Melbourne whatever the device's zone is. Run every
// test as a device in Los Angeles so any code that leaks the device zone shows
// up as a failure, however the developer's machine or CI runner is configured.
module.exports = async () => {
  process.env.TZ = "America/Los_Angeles";
};

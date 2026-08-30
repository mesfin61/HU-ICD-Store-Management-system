const user = require("./user");
const request = require("./request");
const role = require("./role");
const department = require("./department");
const inventoryItem = require("./inventoryItem");
const inventoryReservation = require("./inventoryReservation");
const inventoryReservationException = require("./inventoryReservationException");
const issuance = require("./issuance");
const itemReturn = require("./itemReturn");
const notification = require("./notification");
const category = require("./category");
const message = require("./message");


module.exports = {
  user,
  request,
  role,
  department,
  category,
  inventoryItem,
  inventoryReservation,
  inventoryReservationException,
  issuance,
  itemReturn,
  notification,
  message,
};
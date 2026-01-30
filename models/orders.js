const { DataTypes } = require("sequelize");
const sequelize = require("../connection/dbconnection");

const Order = sequelize.define("Order", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    orderId: DataTypes.STRING,
    status: DataTypes.STRING
});

module.exports = Order;

const { DataTypes } = require("sequelize");
const sequelize = require("../connection/dbconnection");

const Expense = sequelize.define("Expense", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    amount: DataTypes.INTEGER,
    description: DataTypes.STRING,
    category: DataTypes.STRING
});

module.exports = Expense;

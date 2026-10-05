const Inventory = require("../models/Inventory");

const reserveInventory = async (productId, quantity, session) => {
    const inventory = await Inventory.findOneAndUpdate(
        {
            productId: productId,
            availableQuantity: {
                $gte: quantity
            }
        },
        {
            $inc: {
                availableQuantity: -quantity,
                reservedQuantity: quantity,
                version: 1
            }
        },
        {
            new: true,
            session
        }
    );

    return inventory;
};

module.exports = {
    reserveInventory
};
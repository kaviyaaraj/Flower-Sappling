const publicFields = [
    "productId",
    "name",
    "description",
    "category",
    "price",
    "originalPrice",
    "discount",
    "image",
    "rating",
    "reviewCount",
    "plantHeight",
    "potSize",
    "sunlight",
    "waterRequirement",
    "floweringSeason",
    "suitableFor",
    "difficultyLevel",
    "createdAt",
    "updatedAt"
];

const toPublicProduct = (product) => {
    const source = typeof product.toObject === "function"
        ? product.toObject()
        : product;
    const result = {};

    for (const field of publicFields) {
        if (source[field] !== undefined) {
            result[field] = source[field];
        }
    }

    result.isActive = source.active === true;
    return result;
};

module.exports = { toPublicProduct };

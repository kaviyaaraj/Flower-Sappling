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

    // Frontend uses `product.reviews`; model stores it as `reviewCount` — expose both
    if (result.reviewCount !== undefined) {
        result.reviews = result.reviewCount;
    }

    // Frontend uses `product.id` as the universal identifier; backend stores it as `productId`
    if (result.productId !== undefined) {
        result.id = result.productId;
    }

    return result;
};

module.exports = { toPublicProduct };

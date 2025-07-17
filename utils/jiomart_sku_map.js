export function formatJiomartItems(items) {
  return items.map((item) => {
    const sku = item["Variant SKU"] || "";
    const leadTimeUnit = (item["Lead time unit"] || "days").toLowerCase();
    const shippingTimeUnit = (item["Shipping Time unit"] || "days").toLowerCase();

    return {
      "Variant SKU*": sku,
      "Stock SKU*": sku,
      "Fulfiller Branch Number*": item["Fulfiller Branch Number"] || "",
      "Inventory SKU*": sku,
      "Batch Number": item["Batch Number"] || "",
      "Available quantity*": item["Available quantity"] || 0,
      "Low Stock Threshold*": item["Low Stock Threshold"] || 5,
      "Multiplier": item["Multiplier"] || 1,
      "Shelf life value": item["Shelf life value"] || "",
      "Shelf life unit": item["Shelf life unit"] || "",
      "Min lead time to source*": item["Min lead time to source"] || 1,
      "Max lead time to source*": item["Max lead time to source"] || 3,
      "Lead time unit*": leadTimeUnit,
      "Min time to ship*": item["Min time to ship"] || 1,
      "Max time to ship*": item["Max time to ship"] || 4,
      "Shipping Time unit*": shippingTimeUnit,
      "Best Before Buy Date": item["Best Before Buy Date"] || "",
      "Manufactured Date": item["Manufactured Date"] || "",
      "Month and Year of Import": item["Month and Year of Import"] || "",
      "Country of Origin*": item["Country of Origin"] || "India",
      "Notes": item["Notes"] || "",
    };
  });
}

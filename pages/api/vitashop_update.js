import { vitashopMap } from "../../utils/vitashop_product_sku";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { inventory = [], updateMrp = false } = req.body;
  const status = {};

  const shop = process.env.VITASHOP_SHOPIFY_SHOP;
  const token = process.env.VITASHOP_API_TOKEN;
  const locationId = process.env.VITASHOP_LOCATION_ID;

  for (const item of inventory) {
    const sku = item.sku?.trim();
    const mapped = vitashopMap[sku];

    if (!mapped) {
      status[sku] = "❌ SKU not found in vitashopMap";
      continue;
    }

    try {
      // Step 0: Ensure the inventory item is connected to the location
      const connectRes = await fetch(`https://${shop}/admin/api/2023-04/inventory_levels/connect.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({
          location_id: locationId,
          inventory_item_id: mapped.inv_id,
          relocate_if_necessary: true,
        }),
      });
      const connectText = await connectRes.text();

      // Step 1: Update quantity
      const quantityRes = await fetch(
        `https://${shop}/admin/api/2023-04/inventory_levels/set.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token,
          },
          body: JSON.stringify({
            location_id: locationId,
            inventory_item_id: mapped.inv_id,
            available: item.qty,
          }),
        }
      );
      const qtyText = await quantityRes.text();
      let qtyJson;
      try {
        qtyJson = JSON.parse(qtyText);
      } catch {
        qtyJson = null;
      }

      if (!quantityRes.ok) {
        status[sku] = `❌ Qty update failed: ${quantityRes.status} - ${qtyText}`;
        continue;
      }

      if (qtyJson && typeof qtyJson.available !== "undefined" && qtyJson.available != item.qty) {
        status[sku] = `❌ Inventory not updated as expected. Shopify returned: ${qtyText}`;
        continue;
      }

      // Step 2: Optionally update MRP
      if (updateMrp && item.price) {
        const priceRes = await fetch(
          `https://${shop}/admin/api/2023-04/variants/${mapped.variant_id}.json`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": token,
            },
            body: JSON.stringify({
              variant: {
                id: mapped.variant_id,
                price: item.price,
              },
            }),
          }
        );

        const priceText = await priceRes.text();
        if (!priceRes.ok) {
          status[sku] = `❌ MRP update failed: ${priceRes.status} - ${priceText}`;
          continue;
        }
      }

      status[sku] = `✅ Success${qtyJson ? `: ${JSON.stringify(qtyJson)}` : ''}`;
    } catch (err) {
      status[sku] = `❌ Exception: ${err.message}`;
    }

    await delay(200);
  }

  return res.json({ status });
}

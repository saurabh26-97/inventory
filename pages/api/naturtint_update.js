import { naturtintMap } from "../../utils/naturtint_product_sku";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { inventory = [], updateMrp = false } = req.body;
  const status = {};


  
  const shop = process.env.NATURTINT_SHOPIFY_SHOP;
  const token = process.env.NATURTINT_API_TOKEN;
  const locationId = process.env.NATURTINT_LOCATION_ID;

  for (const item of inventory) {
    const sku = item.sku?.trim();
    const mapped = naturtintMap[sku];

    if (!mapped) {
      status[sku] = "❌ SKU not found in naturtintMap";
      continue;
    }

    try {
      // Step 0: Ensure the inventory item is connected to the location
      await fetch(`https://${shop}/admin/api/2023-04/inventory_levels/connect.json`, {
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

      if (!quantityRes.ok) {
        const errorText = await quantityRes.text();
        status[sku] = `❌ Qty update failed: ${quantityRes.status} - ${errorText}`;
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

        if (!priceRes.ok) {
          const errorText = await priceRes.text();
          status[sku] = `❌ MRP update failed: ${priceRes.status} - ${errorText}`;
          continue;
        }
      }

      status[sku] = "✅ Success";
    } catch (err) {
      status[sku] = `❌ Exception: ${err.message}`;
    }

    // Wait to avoid Shopify rate limits
    await delay(200);
  }

  return res.json({ status });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { inventory, updateMrp } = req.body;

  const shopifyToken = process.env.SHOPIFY_API_TOKEN;
  const locationId = process.env.SHOPIFY_LOCATION_ID;
  const shop = process.env.SHOPIFY_SHOP;

  if (!shopifyToken || !locationId || !shop) {
    return res.status(500).json({
      error: 'Missing SHOPIFY_API_TOKEN / SHOPIFY_LOCATION_ID / SHOPIFY_SHOP env vars',
    });
  }

  const status = {};

  // Helper to avoid Shopify API rate-limiting (max 2 req/sec)
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const item of inventory) {
    const { sku, inv_id, qty, variant_id, price, mrp } = item;

    if (!inv_id || qty == null) {
      status[sku] = '❌ Missing inv_id or qty';
      continue;
    }

    try {
      // STEP 1: Update Inventory Quantity
      const inventoryRes = await fetch(
        `https://${shop}/admin/api/2023-01/inventory_levels/set.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shopifyToken,
          },
          body: JSON.stringify({
            location_id: locationId,
            inventory_item_id: inv_id,
            available: qty,
          }),
        }
      );

      const inventoryText = await inventoryRes.text();
      let inventoryJson;
      try {
        inventoryJson = JSON.parse(inventoryText);
      } catch {
        inventoryJson = null;
      }

      if (!inventoryRes.ok) {
        status[sku] = `❌ Inventory error: ${inventoryText}`;
        continue;
      }

      // Optional: Check if returned available matches
      if (inventoryJson && typeof inventoryJson.available !== "undefined" && inventoryJson.available != qty) {
        status[sku] = `❌ Inventory not updated as expected. Shopify returned: ${inventoryText}`;
        continue;
      }

      // STEP 2: Update Selling Price & MRP (Compare At Price)
      if (updateMrp && variant_id) {
        const pricePayload = {
          variant: {
            id: variant_id,
          },
        };

        if (price != null) pricePayload.variant.price = price.toString();
        if (mrp != null) pricePayload.variant.compare_at_price = mrp.toString();

        const priceRes = await fetch(
          `https://${shop}/admin/api/2023-01/variants/${variant_id}.json`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': shopifyToken,
            },
            body: JSON.stringify(pricePayload),
          }
        );

        const priceText = await priceRes.text();

        if (!priceRes.ok) {
          status[sku] = `❌ Price/MRP error: ${priceText}`;
          continue;
        }
      }

      status[sku] = `✅ Success${inventoryJson ? `: ${JSON.stringify(inventoryJson)}` : ''}`;
    } catch (err) {
      status[sku] = `❌ Exception: ${err.message}`;
      console.error(`Error for SKU ${sku}:`, err);
    }

    await delay(500);
  }

  return res.status(200).json({ status });
}

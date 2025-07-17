export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { inventory } = req.body;
  const token = process.env.FLIPKART_TOKEN;
  const locationId = process.env.FLIPKART_LOCATION_ID;

  const status = {};

  for (let i = 0; i < inventory.length; i += 5) {
    const batch = inventory.slice(i, i + 5);
    const payload = {};

    for (const item of batch) {
      if (!item.fsn || item.fsn.startsWith('❌')) {
        status[item.sku] = '❌ FSN missing';
        continue;
      }
      payload[item.sku] = {
        product_id: item.fsn,
        locations: [{ id: locationId, inventory: item.qty }]
      };
    }

    if (Object.keys(payload).length === 0) continue;

    try {
      const response = await fetch('https://api.flipkart.net/sellers/listings/v3/update/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // Only read the body ONCE!
      const result = await response.json();

      batch.forEach(item => {
        if (!payload[item.sku]) return; // skip if not sent
        const message = response.ok
          ? '✅ Success'
          : result?.errors?.[0]?.message || `❌ ${response.status}`;
        status[item.sku] = message;
      });

    } catch (err) {
      batch.forEach(item => {
        status[item.sku] = `❌ ${err.message || 'Network Error'}`;
      });
    }
  }

  return res.status(200).json({ status });
}

/**
 * InventoryTable component: Renders a dynamic, editable inventory table.
 * - Supports Shopify's optional MRP (compare_at_price) and price toggle.
 * - Displays real-time status feedback for each row.
 *
 * Props:
 * @param {Array} items - Array of inventory row objects.
 * @param {Function} setItems - Function to update `items`.
 * @param {Array} columns - Array of column definitions (key, label, editable, type).
 * @param {Object} statusMap - Map of status messages per row (by SKU or ID).
 * @param {Boolean} showMrp - If true, MRP (compare_at_price) column is shown.
 * @param {Boolean} showPrice - If true, Price (selling) column is shown.
 * @param {Boolean} isShopify - Flag to render Shopify-specific column structure.
 */
export default function InventoryTable({
  items,
  setItems,
  columns,
  statusMap = {},
  showMrp = true,
  showPrice = true,
  isShopify = false,
}) {


  // Construct columns dynamically based on Shopify mode and MRP toggle
    const activeColumns = isShopify
    ? [
        { key: "sku", label: "SKU" },
        { key: "variant_id", label: "Variant ID" },
        { key: "inv_id", label: "INV_ID" },
        ...(showPrice
          ? [{ key: "price", label: "Price (Selling)", editable: true, type: "number" }]
          : []),
        ...(showMrp
          ? [{ key: "mrp", label: "MRP (Compare At)", editable: true, type: "number" }]
          : []),
        { key: "qty", label: "Quantity", editable: true, type: "number" },
      ]
    : columns;


  // Handle updates to any editable field in the table
  const handleChange = (index, field, value) => {
    const updatedItems = [...items];
    const colDef = activeColumns.find((c) => c.key === field);
    updatedItems[index][field] =
      colDef?.type === "number" ? Number(value) : value;
    setItems(updatedItems);
  };

  return (
    <>
     

      {/* Responsive scroll container for horizontal overflow */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse mt-2 min-w-[640px] text-sm">
          <thead>
            <tr>
              {activeColumns.map((col) => (
                <th
                  key={col.key}
                  className="border px-3 py-2 bg-blue-100 text-left whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              <th className="border px-3 py-2 bg-blue-100 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIdx) => (
              <tr
                key={rowIdx}
                className="bg-white border-b hover:bg-gray-50 transition"
              >
                {activeColumns.map((col, colIdx) => (
                  <td
                    key={col.key}
                    className="border px-3 py-2 whitespace-nowrap"
                  >
                    {col.editable ? (
                      <input
                        type={col.type || "text"}
                        value={item[col.key] ?? ""}
                        onChange={(e) =>
                          handleChange(rowIdx, col.key, e.target.value)
                        }
                        aria-label={`Edit ${col.label}`}
                        className="w-24 px-2 py-1 border rounded-md text-sm"
                        autoFocus={rowIdx === 0 && colIdx === 3} // Autofocus first editable field
                      />
                    ) : (
                      item[col.key] ?? "-"
                    )}
                  </td>
                ))}

                {/* Status Column */}
                <td className="border px-3 py-2">
                  {statusMap[item.sku || item.id] === "✅ Success" ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      Success
                    </span>
                  ) : statusMap[item.sku || item.id]?.startsWith("❌") ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                      {statusMap[item.sku || item.id]}
                    </span>
                  ) : statusMap[item.sku || item.id] ? (
                    <span className="text-gray-500 text-xs">{statusMap[item.sku || item.id]}</span>
                  ) : (
                    <span className="text-gray-300 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

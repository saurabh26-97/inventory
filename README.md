# 📦 Flipkart Inventory Updater

This is a simple web app that lets you upload a CSV and update Flipkart inventory in batches using the Flipkart Seller API.

## ✅ Features

- Upload CSV with SKU + Quantity
- Editable table before submission
- Flipkart FSN lookup via `product_sku.js`
- Batched API calls with success/failure feedback
- Non-coder-friendly interface

## 📂 CSV Format

Ensure your CSV has at least the following:

| MP SKU (Column A) | MVQ-No Threshold (Column Q) |
|-------------------|-----------------------------|
| PT0139-00006GB-1M1| 1131                        |

Only these two columns are used.
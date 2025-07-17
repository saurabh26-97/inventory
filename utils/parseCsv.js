import Papa from 'papaparse';
import { skuMap as flipkartSkuMap } from './product_sku'; // Flipkart SKU → FSN
import { shopifyMap } from './ptfs_product_sku';           // PTFS Shopify SKU → { variant_id, inv_id, price }
import { vitashopMap } from './vitashop_product_sku';      // Vitashop Shopify SKU → { variant_id, inv_id, price }
import { naturtintMap } from './naturtint_product_sku';    // Naturtint Shopify SKU → { variant_id, inv_id, price }
import { formatJiomartItems as jiomartMap } from './jiomart_sku_map'; // Jiomart SKU → {...}

/**
 * Parses a CSV file and returns platform-specific datasets.
 * Accepts any capitalization or whitespace for column headers.
 * - For SKUs starting with PT: if qty <= 5, set to 0, else keep qty.
 * - For all other SKUs: keep qty as is, even if it is 1, 2, etc.
 * @param {File} file - Uploaded CSV file.
 * @param {Function} callback - Receives { flipkart, shopify, vitashop, naturtint, jiomart } as arrays.
 */
export function parseCsvFile(file, callback) {
  const reader = new FileReader();

  reader.onload = () => {
    const csvText = reader.result;

    // Parse CSV with PapaParse
    const { data: rawRows } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    // Helper: normalize all keys in a row (lowercase, remove all spaces)
    function normalizeKey(key) {
      return key.toLowerCase().replace(/\s+/g, '');
    }

    // Helper: get value from row by possible field names (tries all, returns first match)
    function getField(row, ...candidates) {
      for (const candidate of candidates) {
        const norm = normalizeKey(candidate);
        if (row.hasOwnProperty(norm)) return row[norm];
      }
      return '';
    }

    // Normalize all keys in each row for robust field access
    const normalizedRows = rawRows.map(row => {
      const newRow = {};
      for (const key in row) {
        newRow[normalizeKey(key)] = row[key];
      }
      return newRow;
    });

    // Helper for threshold: If SKU contains "PT", set threshold 5, else 0
    const getThreshold = (sku) => {
      if (typeof sku !== "string") return 0;
      return sku.toUpperCase().includes("PT") ? 5 : 0;
    };

    // Helper for PT logic:
    // - For SKUs starting with PT: if qty <= 5, set to 0, else keep qty.
    // - For all others: keep qty as is, even if it is 1, 2, etc.
    const parseQtyPTLogic = (sku, qtyStr) => {
      const qty = parseInt(qtyStr?.trim?.() || '0', 10);
      if (!sku) return 0; // empty SKU fallback
      if (/^PT/i.test(sku)) { // starts with PT (case-insensitive)
        return (!Number.isNaN(qty) && qty > 5) ? qty : 0;
      } else {
        return !Number.isNaN(qty) ? qty : 0;
      }
    };

    // Helper for dual quantity columns
    const getQtyFromRow = (row) => {
      // Prefer 'MVQ-No Threshold', then 'MP Allotment'
      return getField(row, 'MVQ-No Threshold', 'MP Allotment');
    };

    /** ------------------------------
     * FLIPKART Parsing
     * ------------------------------ */
    const flipkartMarkets = ['sf_flipkart/flipkart_fc', 'sf_flipkart'];
    const flipkartRows = normalizedRows
      .filter(row => flipkartMarkets.includes((getField(row, 'Marketplace') || '').trim().toLowerCase()))
      .map((row, index) => {
        const sku = (getField(row, 'MP SKU') || '').trim();
        return {
          sku,
          qty: parseQtyPTLogic(sku, getQtyFromRow(row)), // Use PT logic helper
          threshold: getThreshold(sku),
          fsn: flipkartSkuMap[sku] || '❌ FSN not found',
          rowNum: index + 2, // CSV data rows start at line 2 (after header)
          marketplace: getField(row, 'Marketplace') || '',
        };
      });

    /** ------------------------------
     * PTFS SHOPIFY Parsing
     * ------------------------------ */
    const shopifyRows = normalizedRows
      .filter(row => (getField(row, 'Marketplace') || '').toLowerCase().includes('ptfs'))
      .map((row, index) => {
        const sku = (getField(row, 'MP SKU') || '').trim();
        const mapData = shopifyMap[sku] || {};
        return {
          sku,
          variant_id: mapData.variant_id || '',
          inv_id: mapData.inv_id || '',
          qty: parseQtyPTLogic(sku, getQtyFromRow(row)), // Use PT logic helper
          threshold: getThreshold(sku),
          price: mapData.price || '',
          mrp: mapData.mrp || '',
          rowNum: index + 2,
          marketplace: getField(row, 'Marketplace') || '',
        };
      });

    /** ------------------------------
     * VITASHOP SHOPIFY Parsing
     * ------------------------------ */
    const vitashopRows = normalizedRows
      .filter(row => (getField(row, 'Marketplace') || '').toLowerCase().includes('vitashop'))
      .map((row, index) => {
        const sku = (getField(row, 'MP SKU') || '').trim();
        const mapData = vitashopMap[sku] || {};
        return {
          sku,
          variant_id: mapData.variant_id || '',
          inv_id: mapData.inv_id || '',
          qty: parseQtyPTLogic(sku, getQtyFromRow(row)), // Use PT logic helper
          threshold: getThreshold(sku),
          price: mapData.price || '',
          mrp: mapData.mrp || '',
          rowNum: index + 2,
          marketplace: getField(row, 'Marketplace') || '',
        };
      });

    /** ------------------------------
     * NATURTINT SHOPIFY Parsing
     * ------------------------------ */
    const naturtintRows = normalizedRows
      .filter(row => (getField(row, 'Marketplace') || '').toLowerCase().includes('naturtint'))
      .map((row, index) => {
        const sku = (getField(row, 'MP SKU') || '').trim();
        const mapData = naturtintMap[sku] || {};
        return {
          sku,
          variant_id: mapData.variant_id || '',
          inv_id: mapData.inv_id || '',
          qty: parseQtyPTLogic(sku, getQtyFromRow(row)), // Use PT logic helper
          threshold: getThreshold(sku),
          price: mapData.price || '',
          mrp: mapData.mrp || '',
          rowNum: index + 2,
          marketplace: getField(row, 'Marketplace') || '',
        };
      });

    /** ------------------------------
     * JIOMART Parsing
     * ------------------------------ */
    const jiomartRows = normalizedRows
      .filter(row => (getField(row, 'Marketplace') || '').toLowerCase().includes('jiomart'))
      .map((row, index) => {
        const sku = (getField(row, 'MP SKU') || '').trim();
        const mapData = jiomartMap[sku] || {};
        return {
          "Variant SKU": sku,
          "Stock SKU": mapData.stock_sku || '',
          "Fulfiller Branch Number": mapData.branch || '3P2SUOA2FC02',
          "Inventory SKU": mapData.inventory_sku || '',
          // PT logic for available qty
          "Available quantity": parseQtyPTLogic(sku, getQtyFromRow(row)),
          "Low Stock Threshold": getThreshold(sku),
          "Min lead time to source": mapData.min_lead_time || 1,
          "Max lead time to source": mapData.max_lead_time || 2,
          "Lead time unit": mapData.lead_time_unit || 'Days',
          "Min time to ship": mapData.min_ship_time || 1,
          "Max time to ship": mapData.max_ship_time || 2,
          "Shipping Time unit": mapData.shipping_time_unit || 'Days',
          "Country of Origin": mapData.origin || 'India',
          rowNum: index + 2,
          marketplace: getField(row, 'Marketplace') || '',
        };
      });

    // Callback with all marketplace data arrays
    callback({
      flipkart: flipkartRows,
      shopify: shopifyRows,
      vitashop: vitashopRows,
      naturtint: naturtintRows,
      jiomart: jiomartRows,
    });
  };

  // Start reading the file as plain text
  reader.readAsText(file);
}

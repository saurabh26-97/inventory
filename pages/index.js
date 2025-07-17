import { useState } from "react";
import InventoryTable from "../components/InventoryTable";
import { parseCsvFile } from "../utils/parseCsv";
import { formatJiomartItems } from "../utils/jiomart_sku_map";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

// Table column configuration
const flipkartColumns = [
  { key: "sku", label: "SKU" },
  { key: "fsn", label: "FSN" },
  { key: "qty", label: "Quantity", editable: true, type: "number" },
];

const shopifyColumns = [
  { key: "sku", label: "SKU" },
  { key: "variant_id", label: "Variant ID" },
  { key: "inv_id", label: "INV_ID" },
  { key: "qty", label: "Quantity", editable: true, type: "number" },
];

export default function Home() {
  // ===========================
  // === State: UI Controls ===
  // ===========================
  const [selectedTab, setSelectedTab] = useState("Flipkart");
  const [showMrp, setShowMrp] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [loading, setLoading] = useState(false);

  // ===========================
  // === State: Inventory Data ===
  // ===========================
  const [flipkartItems, setFlipkartItems] = useState([]);
  const [shopifyItems, setShopifyItems] = useState([]);
  const [vitashopItems, setVitashopItems] = useState([]);
  const [naturtintItems, setNaturtintItems] = useState([]);
  const [jiomartItems, setJiomartItems] = useState([]);

  // ===========================
  // === State: API Status Map ===
  // ===========================
  const [flipkartStatus, setFlipkartStatus] = useState({});
  const [shopifyStatus, setShopifyStatus] = useState({});
  const [vitashopStatus, setVitashopStatus] = useState({});
  const [naturtintStatus, setNaturtintStatus] = useState({});

  // ===========================
  // === CSV Upload Handler ===
  // ===========================
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    parseCsvFile(file, (parsed) => {
      setFlipkartItems(parsed.flipkart || []);
      setShopifyItems(parsed.shopify || []);
      setVitashopItems(parsed.vitashop || []);
      setNaturtintItems(parsed.naturtint || []);
      setJiomartItems(parsed.jiomart || []);
      setFlipkartStatus({});
      setShopifyStatus({});
      setVitashopStatus({});
      setNaturtintStatus({});
    });
  };

  // ===========================
  // === API Updaters ===
  // ===========================

  const updateFlipkart = async () => {
    toast.loading("Updating Flipkart inventory...");
    setLoading(true);
    try {
      const res = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory: flipkartItems }),
      });
      const result = await res.json();
      setFlipkartStatus(result.status || {});
      toast.success("✅ Flipkart inventory updated!");
    } catch (err) {
      toast.error("❌ Flipkart update failed.");
    } finally {
      toast.dismiss();
      setLoading(false);
    }
  };
  
  const updateShopify = async () => {
    toast.loading("Updating Shopify inventory...");
    setLoading(true);
    try {
      const res = await fetch("/api/ptfs_update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory: shopifyItems,
          updateMrp: showMrp,
          updatePrice: showPrice,
        }),
      });
      const result = await res.json();
      setShopifyStatus(result.status || {});
      toast.success("✅ Shopify inventory updated!");
    } catch (err) {
      toast.error("❌ Shopify update failed.");
    } finally {
      toast.dismiss();
      setLoading(false);
    }
  };

  const updateVitashop = async () => {
    toast.loading("Updating Vitashop inventory...");
    setLoading(true);
    try {
      const res = await fetch("/api/vitashop_update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory: vitashopItems,
          updateMrp: showMrp,
          updatePrice: showPrice,
        }),
      });
      const result = await res.json();
      setVitashopStatus(result.status || {});
      toast.success("✅ Vitashop inventory updated!");
    } catch (err) {
      toast.error("❌ Vitashop update failed.");
    } finally {
      toast.dismiss();
      setLoading(false);
    }
  };

  const updateNaturtint = async () => {
    toast.loading("Updating Naturtint inventory...");
    setLoading(true);
    try {
      const res = await fetch("/api/naturtint_update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventory: naturtintItems,
          updateMrp: showMrp,
          updatePrice: showPrice,
        }),
      });
      const result = await res.json();
      setNaturtintStatus(result.status || {});
      toast.success("✅ Naturtint inventory updated!");
    } catch (err) {
      toast.error("❌ Naturtint update failed.");
    } finally {
      toast.dismiss();
      setLoading(false);
    }
  };

  // ===========================
  // === Jiomart XLSX Export ===
  // ===========================
  const generateJiomartXlsx = () => {
    if (jiomartItems.length === 0) {
      toast.error("❌ No Jiomart items found in uploaded CSV.");
      return;
    }

    const items = formatJiomartItems(jiomartItems);
    const headers = Object.keys(items[0]);
    const worksheet = XLSX.utils.json_to_sheet(items, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "inventories");
    XLSX.writeFile(workbook, "jiomart_inventory_template.xlsx");
  };

  // ===========================
  // === JSX UI Rendering ===
  // ===========================
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-3 text-blue-800">
          🛒 Multi-Platform Inventory Updater
        </h1>
        <p className="text-gray-600 mb-4">
          Upload your CSV file and update inventory for Flipkart, Shopify, Vitashop, Naturtint or Jiomart Amazon Coming Soon.
        </p>

        {/* === File Upload Box === */}
        <label className="block mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleUpload}
            className="hidden"
            id="fileUpload"
          />
          <div className="cursor-pointer p-4 border-2 border-dashed border-blue-400 text-center text-blue-600 rounded-lg hover:bg-blue-50 transition">
            Click or drag file to upload CSV
          </div>
        </label>

        {/* === Tabs === */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["Flipkart", "Shopify", "Vitashop", "Naturtint", "Jiomart"].map((tab) => (
            <button
              key={tab}
              className={`text-sm px-4 py-2 rounded ${
                selectedTab === tab ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setSelectedTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* === Flipkart Tab === */}
        {selectedTab === "Flipkart" && flipkartItems.length > 0 && (
          <>
            <InventoryTable
              items={flipkartItems}
              setItems={setFlipkartItems}
              columns={flipkartColumns}
              statusMap={flipkartStatus}
            />
            <button
              onClick={updateFlipkart}
              className={`w-full mt-6 px-6 py-2 rounded text-white font-semibold shadow ${
                loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={loading}
            >
              {loading ? "Updating..." : "🔄 Update Flipkart Inventory"}
            </button>
          </>
        )}

        {/* === Shopify/Vitashop/Naturtint Shared Tab === */}
{["Shopify", "Vitashop", "Naturtint"].includes(selectedTab) &&
  (
    (selectedTab === "Shopify" && shopifyItems.length > 0) ||
    (selectedTab === "Vitashop" && vitashopItems.length > 0) ||
    (selectedTab === "Naturtint" && naturtintItems.length > 0)
  ) && (
    <>
      {/* Toggle Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <label
          className={`toggle ${showMrp ? "toggle-on" : "toggle-off"}`}
          onClick={() => setShowMrp((v) => !v)}
        >
          Include MRP (compare_at_price)
        </label>
        <label
          className={`toggle ${showPrice ? "toggle-on" : "toggle-off"}`}
          onClick={() => setShowPrice((v) => !v)}
        >
          Include Price (selling price)
        </label>
      </div>

      <InventoryTable
        items={
          selectedTab === "Shopify" ? shopifyItems :
          selectedTab === "Vitashop" ? vitashopItems :
          naturtintItems
        }
        setItems={
          selectedTab === "Shopify" ? setShopifyItems :
          selectedTab === "Vitashop" ? setVitashopItems :
          setNaturtintItems
        }
        columns={shopifyColumns}
        statusMap={
          selectedTab === "Shopify" ? shopifyStatus :
          selectedTab === "Vitashop" ? vitashopStatus :
          naturtintStatus
        }
        showMrp={showMrp}
        showPrice={showPrice}
        onToggleMrp={() => setShowMrp((v) => !v)}
        onTogglePrice={() => setShowPrice((v) => !v)}
        isShopify={true}
      />

      <button
        onClick={
          selectedTab === "Shopify" ? updateShopify :
          selectedTab === "Vitashop" ? updateVitashop :
          updateNaturtint
        }
        className={`w-full mt-6 px-6 py-2 rounded text-white font-semibold shadow ${
          loading ? "bg-gray-400"
            : selectedTab === "Shopify"
              ? "bg-purple-600 hover:bg-purple-700"
              : selectedTab === "Vitashop"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-yellow-600 hover:bg-yellow-700"
        }`}
        disabled={loading}
      >
        {loading
          ? "Updating..."
          : `🔄 Update ${selectedTab} Inventory`}
      </button>
    </>
)}

        {/* === Jiomart Tab === */}
        {selectedTab === "Jiomart" && (
          <div className="mt-8 text-center text-gray-700">
            <p className="mb-4">
              Jiomart does not support direct API updates. Please upload the XLSX manually.
            </p>
            <button
              onClick={generateJiomartXlsx}
              className="w-full sm:w-auto px-6 py-2 font-semibold rounded shadow text-white bg-orange-500 hover:bg-orange-600"
            >
              ⬇️ Download Jiomart Inventory XLSX
            </button>
            <p className="mt-4">
              Upload at:{" "}
              <a
                href="https://seller.jiomart.com/cat/catalog#!/bulk/upload"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline"
              >
                Jiomart Bulk Upload → Inventory Feed
              </a>
            </p>
          </div>
        )}

        {/* === Empty State === */}
        {((selectedTab === "Flipkart" && flipkartItems.length === 0) ||
          (selectedTab === "Shopify" && shopifyItems.length === 0) ||
          (selectedTab === "Vitashop" && vitashopItems.length === 0) ||
          (selectedTab === "Naturtint" && naturtintItems.length === 0) ||
          (selectedTab === "Jiomart" && jiomartItems.length === 0)) && (
          <div className="text-center text-gray-500 mt-10">
            Please upload a CSV file to begin.
          </div>
        )}
      </div>
    </div>
  );
}

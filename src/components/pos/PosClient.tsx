"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { formatRupiah } from "@/lib/utils";
import { processPosTransaction, type CartItemInput } from "@/app/actions/pos";
import CheckoutModal from "./CheckoutModal";
import ReceiptModal from "./ReceiptModal";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  AlertCircle,
  Package,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  categoryId: string;
  category: { id: string; name: string };
  name: string;
  sku?: string | null;
  sellingPrice: number;
  stock: number;
  status: string;
}

interface StoreSettings {
  storeName?: string;
  address?: string | null;
  phone?: string | null;
  receiptFooter?: string | null;
}

interface PosClientProps {
  products: Product[];
  categories: Category[];
  storeSettings?: StoreSettings | null;
  cashierName: string;
}

export default function PosClient({
  products: initialProducts,
  categories,
  storeSettings: initialStoreSettings,
  cashierName,
}: PosClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [cart, setCart] = useState<CartItemInput[]>([]);
  const [discount, setDiscount] = useState<number>(0);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    invoiceNumber: string;
    createdAt: string | Date;
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    paidAmount: number;
    changeAmount: number;
    cashier: { name: string };
    items: {
      id?: string;
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[];
  } | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    initialStoreSettings || null
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        selectedCategory === "ALL" || p.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [initialProducts, search, selectedCategory]);

  // Keyboard shortcut listener (/ to focus search, ESC to close, etc.)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement !== searchInputRef.current &&
        !isCheckoutOpen &&
        !isReceiptOpen
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isCheckoutOpen, isReceiptOpen]);

  // Barcode scanner trigger on exact match in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      e.preventDefault();
      const exactMatch = initialProducts.find(
        (p) =>
          (p.sku && p.sku.toLowerCase() === search.trim().toLowerCase()) ||
          p.name.toLowerCase() === search.trim().toLowerCase()
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearch("");
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearch("");
      }
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      setErrorMsg(`Stok "${product.name}" habis!`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setErrorMsg(
            `Tidak dapat menambah lagi. Jumlah maksimal stok barang (${product.stock}) telah tercapai di keranjang.`
          );
          setTimeout(() => setErrorMsg(null), 3500);
          return prevCart;
        }
        return prevCart.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            price: product.sellingPrice,
            quantity: 1,
            maxStock: product.stock,
          },
        ];
      }
    });
    setErrorMsg(null);
  };

  // Update item quantity in cart
  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productId === productId) {
          const clampedQty = Math.min(newQty, item.maxStock);
          if (newQty > item.maxStock) {
            setErrorMsg(
              `Jumlah melebihi sisa stok (${item.maxStock} unit) untuk "${item.name}".`
            );
            setTimeout(() => setErrorMsg(null), 3000);
          }
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  // Remove single item from cart
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((i) => i.productId !== productId));
  };

  // Clear entire cart
  const clearCart = () => {
    if (cart.length > 0 && confirm("Kosongkan semua barang dari keranjang?")) {
      setCart([]);
      setDiscount(0);
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  }, [cart]);

  const safeDiscount = Math.max(0, Math.min(discount, subtotal));
  const total = subtotal - safeDiscount;
  const totalItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  // Process checkout
  const handleConfirmPayment = async (
    paymentMethod: "CASH" | "QRIS",
    paidAmount: number
  ) => {
    setIsProcessing(true);
    setErrorMsg(null);

    const res = await processPosTransaction({
      items: cart,
      discount: safeDiscount,
      paymentMethod,
      paidAmount,
    });

    setIsProcessing(false);

    if (res.success && res.transaction) {
      setLastTransaction(res.transaction);
      if (res.storeSettings) setStoreSettings(res.storeSettings);
      setIsCheckoutOpen(false);
      setIsReceiptOpen(true);
      setCart([]);
      setDiscount(0);
    } else {
      setErrorMsg(res.message || "Gagal memproses transaksi kasir.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-6rem)]">
      {/* LEFT COLUMN: Product Catalog & Search */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Search Bar & Shortcut Indicator */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari nama barang atau scan barcode (Ketik '/' untuk cari)..."
              className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              autoFocus
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5 pointer-events-none">
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-200/80 rounded border border-slate-300">
                /
              </kbd>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Semua ({initialProducts.length})
          </button>
          {categories.map((cat) => {
            const count = initialProducts.filter((p) => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center my-4">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-700">
                Produk Tidak Ditemukan
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Silakan cari dengan kata kunci lain atau scan barcode produk yang sesuai.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const inCartItem = cart.find((i) => i.productId === p.id);

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={`group relative bg-white p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                      isOutOfStock
                        ? "opacity-50 border-slate-200 cursor-not-allowed bg-slate-50"
                        : inCartItem
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/20"
                        : "border-slate-200/80 hover:border-emerald-500 hover:shadow-md hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md truncate max-w-[100px]">
                          {p.category.name}
                        </span>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? "bg-red-100 text-red-700"
                              : p.stock <= 5
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isOutOfStock ? "Habis" : `Stok: ${p.stock}`}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors">
                        {p.name}
                      </h4>

                      {/* SKU / Barcode */}
                      {p.sku && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {p.sku}
                        </span>
                      )}
                    </div>

                    {/* Bottom Price & Added Badge */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900">
                        {formatRupiah(p.sellingPrice)}
                      </span>

                      {inCartItem && (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[11px] font-black shadow-sm">
                          {inCartItem.quantity}x
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Shopping Cart (Keranjang Kasir) */}
      <div className="w-full lg:w-96 shrink-0 bg-white rounded-3xl border border-slate-200/80 shadow-lg p-5 flex flex-col justify-between">
        {/* Cart Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Keranjang Kasir
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Kasir: {cashierName}
                </p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                title="Kosongkan Keranjang"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Error / Alert banner */}
          {errorMsg && (
            <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="mt-3 max-h-[38vh] overflow-y-auto space-y-2.5 pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">
                  Keranjang Masih Kosong
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Klik barang di sebelah kiri atau scan barcode untuk menambah transaksi.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatRupiah(item.price)} / unit
                      </p>
                    </div>
                    <span className="text-xs font-black text-slate-900 shrink-0">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.maxStock}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.productId,
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-10 text-center font-bold text-xs bg-transparent focus:outline-none"
                      />
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.maxStock}
                        className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center transition disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Hapus Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cart Bottom: Discount, Subtotal, & Pay Button */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          {/* Discount Field */}
          <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600">Diskon Nota (Rp):</span>
            <input
              type="number"
              min="0"
              max={subtotal}
              step="500"
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-right text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Subtotal & Discount summary */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal ({totalItemCount} barang):</span>
              <span className="font-semibold text-slate-700">
                {formatRupiah(subtotal)}
              </span>
            </div>
            {safeDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Diskon:</span>
                <span>-{formatRupiah(safeDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="text-sm font-black text-slate-900">
                TOTAL BAYAR:
              </span>
              <span className="text-2xl font-black text-emerald-600">
                {formatRupiah(total)}
              </span>
            </div>
          </div>

          {/* Checkout CTA Button */}
          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cart.length === 0}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-base font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform active:scale-98"
          >
            <Receipt className="w-5 h-5" />
            <span>BAYAR SEKARANG ({formatRupiah(total)})</span>
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={total}
        itemCount={totalItemCount}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isProcessing}
      />

      {/* Receipt Success Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        transaction={lastTransaction}
        storeSettings={storeSettings}
        onNewTransaction={() => {
          setIsReceiptOpen(false);
          setLastTransaction(null);
          searchInputRef.current?.focus();
        }}
      />
    </div>
  );
}

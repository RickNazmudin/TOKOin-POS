"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  generateReceiptEscPos,
  generateTestReceiptEscPos,
  type ReceiptData,
  type StoreSettingsData,
} from "@/lib/escpos";

export type PrinterMode = "BLUETOOTH" | "USB" | "BROWSER";

interface PrinterContextType {
  printerMode: PrinterMode;
  setPrinterMode: (mode: PrinterMode) => void;
  isConnected: boolean;
  deviceName: string | null;
  autoPrint: boolean;
  setAutoPrint: (val: boolean) => void;
  isConnecting: boolean;
  isPrinting: boolean;
  error: string | null;
  isSupportedBluetooth: boolean;
  isSupportedUsb: boolean;
  connectBluetooth: () => Promise<boolean>;
  connectUsb: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  printReceipt: (
    transaction: ReceiptData,
    storeSettings?: StoreSettingsData | null
  ) => Promise<{ success: boolean; message: string }>;
  testPrint: () => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
}

const PrinterContext = createContext<PrinterContextType | null>(null);

// Common BLE Thermal Printer Service UUIDs
const BLE_PRINT_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ae00-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "0000af30-0000-1000-8000-00805f9b34fb",
];

export function PrinterProvider({ children }: { children: React.ReactNode }) {
  const [printerMode, setPrinterModeState] = useState<PrinterMode>("BROWSER");
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [autoPrint, setAutoPrintState] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSupportedBluetooth, setIsSupportedBluetooth] = useState(false);
  const [isSupportedUsb, setIsSupportedUsb] = useState(false);

  // References for active handles
  const bleDeviceRef = useRef<any>(null);
  const bleCharacteristicRef = useRef<any>(null);
  const usbDeviceRef = useRef<any>(null);
  const usbEndpointRef = useRef<number | null>(null);

  // Check browser API support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupportedBluetooth(!!(navigator as any)?.bluetooth);
      setIsSupportedUsb(!!(navigator as any)?.usb);

      // Load saved preferences
      const savedMode = localStorage.getItem("tokoin_printer_mode") as PrinterMode | null;
      if (savedMode) setPrinterModeState(savedMode);

      const savedAutoPrint = localStorage.getItem("tokoin_printer_autoprint");
      if (savedAutoPrint !== null) {
        setAutoPrintState(savedAutoPrint === "true");
      }
    }
  }, []);

  const setPrinterMode = useCallback((mode: PrinterMode) => {
    setPrinterModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("tokoin_printer_mode", mode);
    }
  }, []);

  const setAutoPrint = useCallback((val: boolean) => {
    setAutoPrintState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("tokoin_printer_autoprint", val.toString());
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Disconnect active device
  const disconnect = useCallback(async () => {
    try {
      if (bleDeviceRef.current?.gatt?.connected) {
        await bleDeviceRef.current.gatt.disconnect();
      }
      if (usbDeviceRef.current?.opened) {
        await usbDeviceRef.current.close();
      }
    } catch (e) {
      console.warn("Error disconnecting:", e);
    } finally {
      bleDeviceRef.current = null;
      bleCharacteristicRef.current = null;
      usbDeviceRef.current = null;
      usbEndpointRef.current = null;
      setIsConnected(false);
      setDeviceName(null);
    }
  }, []);

  // Connect via Web Bluetooth (for Android/Tablet/Chrome)
  const connectBluetooth = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !(navigator as any)?.bluetooth) {
      setError("Browser ini tidak mendukung Web Bluetooth API. Gunakan Google Chrome di Android/PC.");
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Disconnect previous if any
      await disconnect();

      const bluetooth = (navigator as any).bluetooth;
      const device = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_PRINT_SERVICES,
      });

      if (!device) {
        throw new Error("Perangkat Bluetooth tidak dipilih.");
      }

      device.addEventListener("gattserverdisconnected", () => {
        setIsConnected(false);
        setDeviceName(null);
        bleCharacteristicRef.current = null;
      });

      const server = await device.gatt.connect();
      
      // Discover services and writable characteristic
      const services = await server.getPrimaryServices();
      let writeChar: any = null;

      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (
              char.properties.write ||
              char.properties.writeWithoutResponse
            ) {
              writeChar = char;
              break;
            }
          }
          if (writeChar) break;
        } catch {
          // Continue searching other services
        }
      }

      if (!writeChar) {
        throw new Error("Karakteristik cetak Bluetooth tidak ditemukan pada printer ini.");
      }

      bleDeviceRef.current = device;
      bleCharacteristicRef.current = writeChar;
      setDeviceName(device.name || "Bluetooth Thermal 58mm");
      setIsConnected(true);
      setPrinterMode("BLUETOOTH");

      return true;
    } catch (err: any) {
      if (err.name !== "NotFoundError" && err.name !== "AbortError") {
        setError(err.message || "Gagal menghubungkan printer Bluetooth.");
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [disconnect, setPrinterMode]);

  // Connect via WebUSB (for Windows/PC/Chrome)
  const connectUsb = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !(navigator as any)?.usb) {
      setError("Browser ini tidak mendukung WebUSB API. Gunakan Google Chrome atau Edge di Windows/PC.");
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await disconnect();

      const usb = (navigator as any).usb;
      const device = await usb.requestDevice({
        filters: [], // Allow picking any USB printer device
      });

      if (!device) {
        throw new Error("Perangkat USB tidak dipilih.");
      }

      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Find USB OUT endpoint
      let outEndpointNumber: number | null = null;
      let interfaceNumber = 0;

      for (const iface of device.configuration.interfaces) {
        for (const alt of iface.alternates) {
          for (const ep of alt.endpoints) {
            if (ep.direction === "out") {
              outEndpointNumber = ep.endpointNumber;
              interfaceNumber = iface.interfaceNumber;
              break;
            }
          }
          if (outEndpointNumber !== null) break;
        }
        if (outEndpointNumber !== null) break;
      }

      if (outEndpointNumber === null) {
        throw new Error("Port USB Printer (OUT endpoint) tidak terdeteksi.");
      }

      await device.claimInterface(interfaceNumber);

      usbDeviceRef.current = device;
      usbEndpointRef.current = outEndpointNumber;
      setDeviceName(
        device.productName || device.manufacturerName || "USB Thermal POS-58"
      );
      setIsConnected(true);
      setPrinterMode("USB");

      return true;
    } catch (err: any) {
      if (err.name !== "NotFoundError" && err.name !== "AbortError") {
        setError(err.message || "Gagal menghubungkan printer USB.");
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [disconnect, setPrinterMode]);

  // Helper: Send binary chunks to Bluetooth
  const sendBytesBluetooth = async (data: Uint8Array): Promise<void> => {
    const char = bleCharacteristicRef.current;
    if (!char) throw new Error("Printer Bluetooth belum terhubung.");

    const chunkSize = 80; // Safe MTU chunk for thermal printers
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      if (char.properties.writeWithoutResponse) {
        await char.writeValueWithoutResponse(chunk);
      } else {
        await char.writeValue(chunk);
      }
      // Brief delay to prevent buffer overflow on low-cost thermal printers
      await new Promise((r) => setTimeout(r, 15));
    }
  };

  // Helper: Send binary data to USB
  const sendBytesUsb = async (data: Uint8Array): Promise<void> => {
    const device = usbDeviceRef.current;
    const endpoint = usbEndpointRef.current;
    if (!device || endpoint === null) {
      throw new Error("Printer USB belum terhubung.");
    }
    await device.transferOut(endpoint, data);
  };

  // High level print transaction receipt
  const printReceipt = useCallback(
    async (
      transaction: ReceiptData,
      storeSettings?: StoreSettingsData | null
    ): Promise<{ success: boolean; message: string }> => {
      // 1. Fallback / Browser print mode
      if (printerMode === "BROWSER" || !isConnected) {
        if (typeof window !== "undefined") {
          window.print();
        }
        return { success: true, message: "Membuka dialog cetak browser." };
      }

      setIsPrinting(true);
      setError(null);

      try {
        const binaryData = generateReceiptEscPos(transaction, storeSettings);

        if (printerMode === "BLUETOOTH") {
          await sendBytesBluetooth(binaryData);
        } else if (printerMode === "USB") {
          await sendBytesUsb(binaryData);
        }

        return {
          success: true,
          message: "Struk berhasil dicetak langsung ke printer thermal!",
        };
      } catch (err: any) {
        console.error("Direct print failed:", err);
        const errorMsg = err.message || "Gagal mencetak struk secara langsung.";
        setError(errorMsg);

        // Fallback to system print if direct printing fails
        if (typeof window !== "undefined") {
          window.print();
        }

        return {
          success: false,
          message: `${errorMsg} (Beralih ke dialog cetak browser)`,
        };
      } finally {
        setIsPrinting(false);
      }
    },
    [printerMode, isConnected]
  );

  // Test print
  const testPrint = useCallback(async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    if (!isConnected) {
      return {
        success: false,
        message: "Printer belum terhubung. Hubungkan Bluetooth atau USB terlebih dahulu.",
      };
    }

    setIsPrinting(true);
    setError(null);

    try {
      const currentName = deviceName || "Thermal 58mm";
      const binaryData = generateTestReceiptEscPos(
        printerMode === "BLUETOOTH" ? "Direct Web Bluetooth" : "Direct WebUSB",
        currentName
      );

      if (printerMode === "BLUETOOTH") {
        await sendBytesBluetooth(binaryData);
      } else if (printerMode === "USB") {
        await sendBytesUsb(binaryData);
      }

      return {
        success: true,
        message: "Struk uji coba berhasil dicetak!",
      };
    } catch (err: any) {
      const msg = err.message || "Gagal mencetak struk uji coba.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsPrinting(false);
    }
  }, [isConnected, deviceName, printerMode]);

  return (
    <PrinterContext.Provider
      value={{
        printerMode,
        setPrinterMode,
        isConnected,
        deviceName,
        autoPrint,
        setAutoPrint,
        isConnecting,
        isPrinting,
        error,
        isSupportedBluetooth,
        isSupportedUsb,
        connectBluetooth,
        connectUsb,
        disconnect,
        printReceipt,
        testPrint,
        clearError,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error("usePrinter must be used within a PrinterProvider");
  }
  return context;
}

import type { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { WalletProvider } from "../contexts/WalletContext";
import "../styles/globals.css";

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WalletProvider>
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </WalletProvider>
  );
}

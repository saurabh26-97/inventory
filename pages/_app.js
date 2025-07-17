// pages/_app.js

import '../styles/globals.css'; // Global styles (Tailwind, custom CSS)
import { Toaster } from 'react-hot-toast'; // Notification system
import Head from 'next/head';

/**
 * Custom App component for Next.js.
 * - Sets up <Head> with meta and favicon.
 * - Loads global styles.
 * - Provides Toast notification context.
 * - Renders all pages with their props.
 */
function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Multi-Platform Inventory Updater</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* ✅ Use external image as favicon */}
        <link rel="icon" href="https://cdn.infiniteshopping.com/saurabh/56.png" type="image/png" />
        
      </Head>

      {/* Renders the current page */}
      <Component {...pageProps} />

      {/* Toast notifications (global) */}
      <Toaster position="top-right" />
    </>
  );
}

export default MyApp;

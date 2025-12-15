/**
 * LoadingSpinner Component
 * Modern loading indicator for page/auth transitions
 */

import { motion } from "framer-motion";

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-3 border-gray-200 dark:border-gray-700 border-t-primary rounded-full"
        />

        {/* Loading text */}
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-gray-600 dark:text-gray-400 text-sm font-medium"
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;

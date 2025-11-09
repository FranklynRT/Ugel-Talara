// Ruta: @/components/ui/loaders.tsx

"use client";
import { motion } from "motion/react";
import React from "react";

// ... LoaderOne, LoaderTwo ...

export const LoaderThree = () => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-20 w-20 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
    >
      <motion.path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <motion.path
        initial={{ pathLength: 0, fill: "rgba(251, 191, 36, 0)" }}
        animate={{ pathLength: 1, fill: "rgba(251, 191, 36, 1)" }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        d="M13 3l0 7l6 0l-8 11l0 -7l-6 0l8 -11"
      />
    </motion.svg>
  );
};

// ... LoaderFour, LoaderFive ...
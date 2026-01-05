'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LoadingLogo() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8],
                    rotate: [0, 5, -5, 0]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative w-32 h-32"
            >
                <Image
                    src="/logo.png"
                    alt="Loading..."
                    fill
                    className="object-contain drop-shadow-xl"
                    priority
                />
            </motion.div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-2"
            >
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -10, 0],
                            backgroundColor: ["#B03050", "#FFB6C1", "#B03050"]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                        }}
                        className="w-3 h-3 rounded-full bg-[#B03050]"
                    />
                ))}
            </motion.div>
        </div>
    );
}

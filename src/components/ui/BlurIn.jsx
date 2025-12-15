import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const BlurIn = ({ children, className, delay = 0, duration = 0.8, y = 20 }) => {
  return (
    <motion.div
      initial={{ filter: 'blur(20px)', opacity: 0, y: y }}
      whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      viewport={{ once: true }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

export default BlurIn;

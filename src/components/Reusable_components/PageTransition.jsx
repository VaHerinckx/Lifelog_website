import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const routeOrder = {
    '/': 0,
    '/podcast': 1,
    '/music': 2,
    '/nutrition': 3,
    '/sport': 4,
    '/health': 5,
    '/reading': 6,
    '/movies-tv': 7,
    '/finances': 8,
    '/work': 9
  };

  const currentIndex = routeOrder[location.pathname] || 0;
  const previousPath = JSON.parse(sessionStorage.getItem('previousPath')) || '/';
  const previousIndex = routeOrder[previousPath] || 0;

  const isGoingRight = currentIndex > previousIndex;

  useEffect(() => {
    console.log('🔄 Transition Details:');
    console.log('Current Path:', location.pathname);
    console.log('Current Index:', currentIndex);
    console.log('Previous Path:', previousPath);
    console.log('Previous Index:', previousIndex);
    console.log('Going Right:', isGoingRight);
    console.log('------------------------');

    sessionStorage.setItem('previousPath', JSON.stringify(location.pathname));
  }, [location.pathname]);

  return (
    <motion.div
      key={location.pathname}
      initial={{ x: isGoingRight ? '100%' : '-100%', position: "absolute" }} // ✅ Correct entry direction
      animate={{ x: 0, position: "absolute" }} // ✅ Fix layering issues
      exit={{ x: isGoingRight ? '-100%' : '100%', position: "absolute" }} // ✅ Ensures proper exit direction
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      style={{
        position: "absolute", // ✅ Ensures smooth unmounting
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#171738",
        top: 0,
        left: 0,
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;

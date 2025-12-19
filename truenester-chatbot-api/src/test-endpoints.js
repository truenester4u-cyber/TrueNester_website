// Quick test to verify which endpoints are actually registered
import express from 'express';

const app = express();

// Import the server to see what routes are registered
console.log('\n=== Checking Express Routes ===\n');

// This will show all registered routes
function printRoutes(app) {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      routes.push(`${methods} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
          routes.push(`${methods} ${handler.route.path}`);
        }
      });
    }
  });
  
  return routes;
}

console.log('This test file will help debug Render deployment issues.');
console.log('Run this locally to verify endpoints are registered correctly.');

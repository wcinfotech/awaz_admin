import express from 'express';
import router from './router.js';

const app = express();

// Load the router
app.use('/', router);

// Print all registered routes
function printRoutes(path, router) {
  router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Route registered directly on this router
      const routePath = path + (middleware.route.path === '/' ? '' : middleware.route.path);
      const methods = Object.keys(middleware.route.methods).join(', ');
      console.log(`${methods.toUpperCase()} ${routePath}`);
    } else if (middleware.name === 'router') {
      // Sub-router
      const subPath = path + (middleware.regexp.source.replace('^\\', '').replace('\\/?$', '') || '');
      printRoutes(subPath, middleware.handle);
    }
  });
}

console.log('=== REGISTERED ROUTES ===');
printRoutes('', router);
console.log('========================');

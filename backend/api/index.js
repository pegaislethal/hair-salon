const app = require('../dist/app').default;

module.exports = (req, res) => {
  const requestUrl = new URL(req.url || '/', 'http://vercel.local');
  const originalPath = requestUrl.searchParams.get('__vercel_path');

  if (originalPath && originalPath.startsWith('/api/')) {
    requestUrl.searchParams.delete('__vercel_path');
    req.url = `${originalPath}${requestUrl.search}`;
  }

  return app(req, res);
};

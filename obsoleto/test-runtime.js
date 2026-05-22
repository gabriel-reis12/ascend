import fs from 'fs';
import { createServer } from 'vite';

async function testRuntime() {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  try {
    const { renderToString } = await vite.ssrLoadModule('react-dom/server');
    const { default: App } = await vite.ssrLoadModule('/src/App.tsx');
    const React = await vite.ssrLoadModule('react');
    
    // Simulate mounting App
    console.log("Rendering App...");
    const html = renderToString(React.createElement(App));
    console.log("Render successful!");
  } catch (e) {
    console.error("RUNTIME ERROR:", e);
  } finally {
    vite.close();
  }
}

testRuntime();

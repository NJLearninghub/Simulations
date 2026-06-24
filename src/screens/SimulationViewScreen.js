import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

const PROTECTION_JS = `(function() {
  document.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; }, true);
  var s = document.createElement('style');
  s.innerHTML = '* { -webkit-user-select:none!important; user-select:none!important; -webkit-touch-callout:none!important; }';
  document.head.appendChild(s);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12') e.preventDefault();
    if ((e.ctrlKey||e.metaKey) && e.shiftKey && ['I','J','C'].includes(e.key)) e.preventDefault();
    if ((e.ctrlKey||e.metaKey) && ['U','S'].includes(e.key)) e.preventDefault();
  }, true);
  document.addEventListener('dragstart', function(e) { e.preventDefault(); }, true);
  true;
})();`;

const MODULE_TO_GLOBAL = {
  'lucide-react': 'lucideReact',
  'recharts': 'Recharts',
  'framer-motion': 'FramerMotion',
  'd3': 'd3',
  'three': 'THREE',
  'katex': 'katex',
  'lodash': '_',
  'date-fns': 'dateFns',
  'clsx': 'clsx',
  'classnames': 'classnames',
};

function buildTsxHtml(tsxContent) {
  // Convert named imports to window global destructuring
  let cleaned = tsxContent.replace(
    /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
    (_, names, mod) => {
      const g = MODULE_TO_GLOBAL[mod];
      if (!g) return '';
      const parts = names.split(',').map(n => {
        const t = n.trim();
        const alias = t.split(/\s+as\s+/);
        return alias.length === 2 ? `${alias[0].trim()}: ${alias[1].trim()}` : t;
      }).filter(Boolean).join(', ');
      return `const { ${parts} } = window.${g} || {};`;
    }
  );

  // Convert default imports
  cleaned = cleaned.replace(
    /^import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?\s*$/gm,
    (_, name, mod) => {
      const g = MODULE_TO_GLOBAL[mod];
      return g ? `const ${name} = window.${g};` : '';
    }
  );

  // Strip side-effect / CSS / unknown imports
  cleaned = cleaned.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');

  // Strip export declarations
  cleaned = cleaned
    .replace(/export\s+default\s+/g, '')
    .replace(/export\s+\{[^}]*\};?\s*/g, '')
    .replace(/^export\s+/gm, '');

  // Prevent premature </script> tag closing in the HTML wrapper
  const safeCode = cleaned.replace(/<\/script/gi, '<\\/script');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="https://unpkg.com/katex@0.16.10/dist/katex.min.css">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone@7.24.0/babel.min.js"><\/script>
  <script src="https://unpkg.com/lucide-react@0.395.0/dist/umd/lucide-react.js"><\/script>
  <script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.js"><\/script>
  <script src="https://unpkg.com/framer-motion@11.3.0/dist/framer-motion.js"><\/script>
  <script src="https://unpkg.com/d3@7.9.0/dist/d3.min.js"><\/script>
  <script src="https://unpkg.com/katex@0.16.10/dist/katex.min.js"><\/script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body, #root { height: 100%; margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="__err" style="display:none;padding:16px;color:#dc2626;font-family:monospace;font-size:11px;white-space:pre-wrap;background:#fef2f2;border:1px solid #fca5a5;margin:12px;border-radius:8px;max-height:80vh;overflow:auto"></div>
  <script>
    window.__showErr = function(msg) {
      var el = document.getElementById('__err');
      if (el) { el.style.display = 'block'; el.textContent = String(msg); }
      var root = document.getElementById('root');
      if (root) root.style.display = 'none';
    };
    window.addEventListener('error', function(e) {
      window.__showErr('Runtime Error:\\n' + (e.error ? e.error.message + '\\n' + e.error.stack : e.message));
    });
    window.addEventListener('unhandledrejection', function(e) {
      window.__showErr('Unhandled Promise:\\n' + e.reason);
    });
  <\/script>
  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useCallback, useMemo, useRef, useContext,
            createContext, Fragment, forwardRef, memo, lazy, Suspense,
            useReducer, useLayoutEffect, useTransition, useDeferredValue } = React;
    const __fm = window.FramerMotion || {};
    const motion = __fm.motion || {};
    const AnimatePresence = __fm.AnimatePresence || (({ children }) => children);

    ${safeCode}

    try {
      if (typeof App !== 'undefined') {
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
      } else {
        window.__showErr('No component named "App" found.\\nRename your main component to: function App() { ... }');
      }
    } catch(e) {
      window.__showErr('Render Error: ' + e.message + (e.stack ? '\\n\\n' + e.stack : ''));
    }
  <\/script>
</body>
</html>`;
}

export default function SimulationViewScreen({ route }) {
  const { htmlUrl, fileType = 'html' } = route.params;
  const [htmlContent, setHtmlContent] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    fetch(htmlUrl)
      .then(r => r.text())
      .then(content => {
        setHtmlContent(fileType === 'tsx' ? buildTsxHtml(content) : content);
      })
      .catch(() => setLoadError('Could not load simulation. Check your internet connection.'));
  }, [htmlUrl, fileType]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {loadError}</Text>
      </View>
    );
  }

  if (!htmlContent) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Loading simulation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent, baseUrl: 'https://localhost' }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={PROTECTION_JS}
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        allowFileAccessFromFileURLs={false}
        mixedContentMode="always"
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onShouldStartLoadWithRequest={(request) => {
          if (
            request.isTopFrame &&
            !request.url.startsWith('https://localhost') &&
            request.url !== 'about:blank'
          ) {
            return false;
          }
          return true;
        }}
        onError={(e) => setLoadError(e.nativeEvent.description)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#64748b' },
  errorText: { color: '#dc2626', textAlign: 'center', fontSize: 15, lineHeight: 24 },
});

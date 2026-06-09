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

function buildTsxHtml(tsxContent) {
  // Strip import/export statements — React globals are injected instead
  const cleaned = tsxContent
    .replace(/^import\s+[\s\S]*?from\s+['"](.*?)['"];?\s*$/gm, '')
    .replace(/^import\s+['"](.*?)['"];?\s*$/gm, '')
    .replace(/export\s+default\s+/g, '')
    .replace(/export\s+\{[^}]*\};?\s*/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body, #root { height: 100%; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    // React hooks available as globals — no imports needed in your component
    const { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext, Fragment } = React;

    ${cleaned}

    if (typeof App !== 'undefined') {
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
    } else {
      document.getElementById('root').innerHTML =
        '<div style="padding:24px;color:#dc2626;font-family:sans-serif"><b>Error:</b> No component named <code>App</code> found.<br>Name your main component <b>App</b>.</div>';
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

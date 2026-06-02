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

export default function SimulationViewScreen({ route }) {
  const { htmlUrl } = route.params;
  const [htmlContent, setHtmlContent] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    fetch(htmlUrl)
      .then(r => r.text())
      .then(setHtmlContent)
      .catch(() => setLoadError('Could not load simulation. Check your internet connection.'));
  }, [htmlUrl]);

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

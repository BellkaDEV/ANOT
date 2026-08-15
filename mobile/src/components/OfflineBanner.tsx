import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import api, { subscribeToConnection } from '../services/api';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = subscribeToConnection((status) => {
      setIsOnline(status);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  const handleRetry = async () => {
    try {
      // Simple ping request to check connectivity
      await api.get('/classes');
    } catch (err) {
      // Ignored: Axios interceptor will trigger status updates automatically
    }
  };

  if (isOnline) {
    return null;
  }

  return (
    <Animated.View style={[styles.banner, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.text}>Sem conexão com o servidor ANOT</Text>
      </View>
      <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
        <Text style={styles.retryBtnText}>Reconectar</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#b45309', // Amber warning color matching theme
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 9999,
    marginTop: 40, // Below standard safe status bar padding
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  retryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});

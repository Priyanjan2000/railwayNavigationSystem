import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { accelerometer, gyroscope, magnetometer, SensorTypes, setUpdateIntervalForType } from 'react-native-sensors';
import { map, filter } from 'rxjs/operators';

const IndoorNavigation = () => {
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [magneticField, setMagneticField] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    // Set the update intervals for sensors
    setUpdateIntervalForType(SensorTypes.accelerometer, 100); // 100ms
    setUpdateIntervalForType(SensorTypes.gyroscope, 100); // 100ms
    setUpdateIntervalForType(SensorTypes.magnetometer, 100); // 100ms

    const accelSubscription = accelerometer
      .pipe(map(({ x, y, z }) => ({ x, y, z })))
      .subscribe(accelData => setAcceleration(accelData));

    const gyroSubscription = gyroscope
      .pipe(map(({ x, y, z }) => ({ x, y, z })))
      .subscribe(gyroData => setRotation(gyroData));

    const magnetoSubscription = magnetometer
      .pipe(map(({ x, y, z }) => ({ x, y, z })))
      .subscribe(magnetoData => setMagneticField(magnetoData));

    // Cleanup subscriptions
    return () => {
      accelSubscription.unsubscribe();
      gyroSubscription.unsubscribe();
      magnetoSubscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Indoor Navigation System</Text>
      <Text style={styles.label}>Acceleration (m/s²)</Text>
      <Text>X: {acceleration.x.toFixed(2)}, Y: {acceleration.y.toFixed(2)}, Z: {acceleration.z.toFixed(2)}</Text>

      <Text style={styles.label}>Rotation (rad/s)</Text>
      <Text>X: {rotation.x.toFixed(2)}, Y: {rotation.y.toFixed(2)}, Z: {rotation.z.toFixed(2)}</Text>

      <Text style={styles.label}>Magnetic Field (μT)</Text>
      <Text>X: {magneticField.x.toFixed(2)}, Y: {magneticField.y.toFixed(2)}, Z: {magneticField.z.toFixed(2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginTop: 10,
  },
});

export default IndoorNavigation;

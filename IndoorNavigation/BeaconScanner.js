import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules, PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';

// Initialize BleManager
const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const BeaconScanner = () => {
    const [beacons, setBeacons] = useState([]);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        BleManager.start({ showAlert: false }).then(() => {
            console.log('BLE Manager initialized');
        });
    
        requestPermissions();
        startScanning();  // Start scanning indefinitely
    
        return () => {
            stopScanning();
        };

        return () => {
            stopScanning();
        };
    }, []);

    const requestPermissions = async () => {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    };

    const startScanning = () => {
        if (!isScanning) {
            BleManager.scan([], 0, true)
                .then(() => {
                    console.log('Scan started');
                    setIsScanning(true);
                })
                .catch(error => {
                    console.error('Scan error:', error);
                });
        }
    };

    const stopScanning = () => {
        BleManager.stopScan()
            .then(() => {
                console.log('Scan stopped');
                setIsScanning(false);
            })
            .catch(error => {
                console.error('Stop scan error:', error);
            });
    };

    useEffect(() => {
        const extractUUIDSegment = (uuid) => {
            const prefix = '0215';
            if (uuid.startsWith(prefix)) {
                return uuid.slice(prefix.length, prefix.length + 4); // Extract 4 digits after '0215'
            }
            return '';
        };
        
        const handleDiscoverPeripheral = (data) => {
            const { id, advertising, rssi } = data;
            console.log('Discovered peripheral:', data);
        
            const manufacturerData = advertising?.manufacturerRawData?.data;
        
            if (manufacturerData) {
                const ibeaconData = parseIBeaconData(manufacturerData);
                if (ibeaconData) {
                    const distance = calculateDistance(rssi, ibeaconData.txPower);
        
                    // Update state with the new beacon
                    setBeacons(prevBeacons => {
                        const index = prevBeacons.findIndex(beacon => beacon.id === id);
                        if (index === -1) {
                            return [...prevBeacons, { id, ...ibeaconData, rssi, distance }];
                        }
                        return prevBeacons;
                    });
        
                    // Extract segment of UUID
                    const uuidSegment = extractUUIDSegment(ibeaconData.uuid);
        
                    // Prepare data for API
                    const apiData = {
                        id,
                        uuid: uuidSegment,
                        major: ibeaconData.major,
                        minor: ibeaconData.minor,
                        txPower: ibeaconData.txPower,
                        rssi,
                        distance,
                        timestamp: new Date().toISOString() // Current timestamp
                    };
        
                    // Send data to API after 2 seconds
                    setTimeout(() => {
                        fetch('http://192.168.101.171:5000/api/beacons', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(apiData)
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log('API Response:', data);
                        })
                        .catch(error => {
                            console.error('API Error:', error);
                        });
                        
                    }, 2000); // Delay of 2 seconds
                }
            }
        };
        

        const discoverPeripheralListener = BleManagerEmitter.addListener(
            'BleManagerDiscoverPeripheral',
            handleDiscoverPeripheral
        );

        return () => {
            discoverPeripheralListener.remove();
        };
    }, []);

    const parseIBeaconData = (base64Data) => {
        // Convert Base64 to bytes
        const rawDataBytes = Buffer.from(base64Data, 'base64');
        console.log("\n\n")
        console.log(rawDataBytes);
        console.log("\n\n")
        // Extract UUID, Major, Minor, and Tx Power
        const uuid = rawDataBytes.slice(4, 22).toString('hex'); // "2f234454cf6d4a0fadf2f4911ba9ffa6"
const major = (rawDataBytes[22] << 8) | rawDataBytes[23]; // 1
const minor = (rawDataBytes[24] << 8) | rawDataBytes[25]; // 1
const txPower = rawDataBytes[26] >= 128 ? rawDataBytes[26] - 256 : rawDataBytes[26]; // -59

        // Format UUID (adding hyphens for standard UUID format)
        const formattedUUID = `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;

        return { uuid: formattedUUID, major, minor, txPower };
    };

    const calculateDistance = (rssi, txPower) => {
        if (rssi === 0) {
            return -1.0; // if we cannot determine accuracy, return -1.
        }

        const ratio = rssi * 1.0 / txPower;
        if (ratio < 1.0) {
            return Math.pow(ratio, 10);
        } else {
            const distance = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
            return distance;
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.beaconCard}>
            <Text style={styles.beaconText}>ID: {item.id}</Text>
            <Text style={styles.beaconText}>UUID: {item.uuid}</Text>
            <Text style={styles.beaconText}>Major: {item.major}</Text>
            <Text style={styles.beaconText}>Minor: {item.minor}</Text>
            <Text style={styles.beaconText}>Tx Power: {item.txPower}</Text>
            <Text style={styles.beaconText}>RSSI: {item.rssi}</Text>
            <Text style={styles.beaconText}>Distance: {item.distance.toFixed(2)} meters</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={startScanning} style={styles.scanButton}>
                <Text style={styles.buttonText}>{isScanning ? 'Scanning...' : 'Start Scan'}</Text>
            </TouchableOpacity>
            <FlatList
                data={beacons}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanButton: {
        padding: 10,
        backgroundColor: '#007bff',
        borderRadius: 5,
        marginBottom: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
    listContainer: {
        width: '100%',
    },
    beaconCard: {
        padding: 15,
        marginVertical: 10,
        backgroundColor: 'red',
        borderRadius: 5,
        elevation: 3,
    },
    beaconText: {
        fontSize: 16,
    },
});

export default BeaconScanner;

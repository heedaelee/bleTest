/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
} from 'react-native';
import {BleManager} from 'react-native-ble-plx';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import base64 from 'react-native-base64';
//import { Buffer } from 'buffer';

const App = () => {
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [leftInsoleData, setLeftInsoleData] = useState('');
  const [rightInsoleData, setRightInsoleData] = useState('');

  const manager = new BleManager();
  useEffect(() => {
    //scanAndConnect();
    manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        console.log('파워켜짐');
      }
    });
  }, []);

  const scanAndConnect = (deviceName) => {
    console.log('실행');
    manager.startDeviceScan(null, null, (error, device) => {
      setInfo('Scanning...');
      if (error) {
        setError(error.message);
        return;
      }
        setInfo(`Connecting to TI Sensor device.name: ${deviceName}`);
        manager.stopDeviceScan();
        device
          .connect({requestMTU: 260})
          .then((device) => {
            setInfo('Discovering services and characteristics');
            return device.discoverAllServicesAndCharacteristics();
          })
          .then((device) => {
            setInfo('Setting notifications');
            return setupNotifications(device, deviceName);
          })
          .then(
            () => {
              setInfo('Listening...');
            },
            (error) => {
              setError(error.message);
            },
          );
    });
  };
  let chID;
  let characteristicUUID = '';
  let chDevice;
  let data;
  let uuid;
  const setupNotifications = async (device, deviceName) => {
    await device.services().then(async (services) => {
      let servicesMap = {};
      for (let service of services) {
        let characteristicsMap = {};
        let characteristics = await service.characteristics();
        for (let characteristic of characteristics) {
          characteristicsMap[characteristic.uuid] = {
            uuid: characteristic.uuid,
            isReadable: characteristic.isReadable,
            isWritableWithResponse: characteristic.isWritableWithResponse,
            isWritableWithoutResponse: characteristic.isWritableWithoutResponse,
            isNotifiable: characteristic.isIndicatable,
            isNotifying: characteristic.isNotifying,
            value: characteristic.value,
          };
        }
        servicesMap[service.uuid] = {
          uuid: service.uuid,
          isPrimary: service.isPrimary,
          characteristicsCount: characteristics.length,
          characteristics: characteristicsMap,
        };
      }

      for (let i in servicesMap) {
        uuid = i;
        if (
          uuid === '8183d256-b358-4c62-a487-d2e7429bfc39' ||
          '889f06ce-b1d3-11ea-b3de-0242ac130004'
        ) {
          chID = servicesMap[uuid].characteristics;
          chDevice = servicesMap[uuid].characteristics;
          for (let inner in chID) characteristicUUID = inner;
        }
      }
    });

    setInterval(() => {
      device
        .readCharacteristicForService(uuid, characteristicUUID)
        .then((res) => console.log(base64.decode(res.value)));
    }, 1000);

    // device.monitorCharacteristicForService('8183d256-b358-4c62-a487-d2e7429bfc39', characteristicUUID, (error, characteristic) => {
    //   if (error) {
    //     setError(error.message)
    //     return
    //   }
    //   //buffer 써도 똑같음. 너무많은 수신 문제인 거 같음. 다만 try catch로 에러 날때 자동 재실행 코드로 할 수는 있을 듯.
    //   //const data = Buffer.from( base64.decode(characteristic.value))
    //   data = base64.decode(characteristic.value);
    //   console.log(characteristic.value);
    //   setInsoleData(data)
    // })
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <View>
          <View>
            <Button
              onPress={() => scanAndConnect('L')}
              title="L connect"></Button>
            <Button
              color={'red'}
              onPress={() => scanAndConnect('R')}
              title="R connect"></Button>
            <Text>{info}</Text>
            <Text>{error}</Text>
            <Text>{leftInsoleData}</Text>
            <Text>{rightInsoleData}</Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;

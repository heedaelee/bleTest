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
} from 'react-native';
import {BleManager} from 'react-native-ble-plx';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import base64 from "react-native-base64";

const App = () => {
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [insoleData, setInsoleData] = useState('');

  const manager = new BleManager();
  useEffect(() => {
    scanAndConnect();
    manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        console.log('파워켜짐');
      }
    });
  }, []);

  const scanAndConnect = () => {
    console.log('실행');
    manager.startDeviceScan(null, null, (error, device) => {
      setInfo('Scanning...');
      if (error) {
        setError(error.message);
        return;
      }

      if (device.name === 'L') {
        setInfo('Connecting to TI Sensor');
        manager.stopDeviceScan();
        device
          .connect({ requestMTU:260 })
          .then((device) => {
            setInfo('Discovering services and characteristics');
            return device.discoverAllServicesAndCharacteristics();
          })
          .then((device) => {
            setInfo('Setting notifications');
            return setupNotifications(device);
          })
          .then(
            () => {
              setInfo('Listening...');
            },
            (error) => {
              setError(error.message);
            },
          );
      }
    });
  };
  let chID;
  let characteristicUUID="";
  let data;
  const setupNotifications = async (device) => {
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
        let uuid = i;
        if (uuid === '8183d256-b358-4c62-a487-d2e7429bfc39') {
          chID = servicesMap[uuid].characteristics;
          for (let inner in chID) characteristicUUID = inner;
        }
      }
    });
    console.log(characteristicUUID);
    for(let i = 0; i<2000; i++){
      await device.readCharacteristicForService('8183d256-b358-4c62-a487-d2e7429bfc39', characteristicUUID)
      .then(
        (res)=>{
        data = base64.decode(res.value);
        console.log(`${i} : ${data}`);
        setInsoleData(data)
        }
      )
    }
    

    //1000번 지나니까 에러뜸.
    // device.monitorCharacteristicForService('8183d256-b358-4c62-a487-d2e7429bfc39', characteristicUUID, (error, characteristic) => {
    //   if (error) {
    //     setError(error.message)
    //     return
    //   }
    //   data = base64.decode(characteristic.value);
    //   console.log(data);
    //   setInsoleData(data)
    // })
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <View onTouchEnd={() => scanAndConnect()}>
          <View>
            <Text>{info}</Text>
            <Text>{error}</Text>
            <Text>{insoleData}</Text>
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

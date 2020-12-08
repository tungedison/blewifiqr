//
// BLE WiFi QR - app.js
//

var defaultNamePrefix = "RL_WIFIQR_Generator";
var storeNamePrefix = localStorage.getItem("deviceNamePrefix");
console.log('> StoreNamePrefix: ' + storeNamePrefix);

if (!storeNamePrefix || storeNamePrefix === "") {
    document.getElementById("namePrefix").value = defaultNamePrefix;
} else {
    document.getElementById("namePrefix").value = storeNamePrefix;
}


var bluetoothDevice;
var bleMsgLabel = document.getElementById("bleStateLabel");
var setupMsgLabel = document.getElementById("setupStateLabel");

var serviceUuid    = "0000dd00-0000-1000-8000-00805f9b34fb";
var typeCharUuid   = "0000dd01-0000-1000-8000-00805f9b34fb";
var ssidCharUuid   = "0000dd02-0000-1000-8000-00805f9b34fb";
var passCharUuid   = "0000dd03-0000-1000-8000-00805f9b34fb";
var actionCharUuid = "0000dd05-0000-1000-8000-00805f9b34fb";

var typeCharacteristic;
var ssidCharacteristic;
var passCharacteristic;
var actionCharacteristic;



function onScanButtonClick() {
    let namePrefix = document.getElementById("namePrefix").value;
    
    if (namePrefix !== "") {
        localStorage.setItem("deviceNamePrefix", namePrefix);

        let options = {filters: [], "optionalServices": [serviceUuid]};
        options.filters.push({namePrefix: namePrefix});

        bluetoothDevice = null;
        console.log('Requesting Bluetooth Device...');
        navigator.bluetooth.requestDevice(options)
        .then(device => {
            bluetoothDevice = device;
            bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
            return connect();
        })
        .catch(error => {
            console.log('Argh! ' + error);
            bleMsgLabel.innerText = "Request device failed!";
        });
    } else {
        bleMsgLabel.innerText = "Please enter a device name prefix!";
    }
}

function connect() {
    console.log('Connecting to Bluetooth Device...');
    return bluetoothDevice.gatt.connect()
    .then(server => {
        console.log('> Bluetooth Device connected');
        bleMsgLabel.innerText = "Connected to " + bluetoothDevice.name;
        return server.getPrimaryService(serviceUuid);
    })
    .then(service => {
        console.log('Getting Characteristics...');
        // Get all characteristics.
        // return service.getCharacteristics();

        // get type Characteristic (1)
        service.getCharacteristic(typeCharUuid).then(function(typech) {
            console.log(typech.uuid);
            typeCharacteristic = typech;

            // get ssid Characteristic (2)
            service.getCharacteristic(ssidCharUuid).then(function(ssidch) {
                console.log(ssidch.uuid);
                ssidCharacteristic = ssidch;

                // get pass Characteristic (3)
                service.getCharacteristic(passCharUuid).then(function(passch) {
                    console.log(passch.uuid);
                    passCharacteristic = passch;

                    // get action Characteristic (4)
                    service.getCharacteristic(actionCharUuid).then(function(actionch) {
                        console.log(actionch.uuid);
                        actionCharacteristic = actionch;

                        document.getElementById("setupButton").disabled = false;
                        document.getElementById("setupButton").style.background='#019858';
                        console.log('setupButton enable!');
                    });
                });
            });
        });
    })
    // .then(characteristics => {
    //     characteristics.forEach(function(ch) {
    //         console.log(ch.uuid);
    //         if (ch.uuid === typeCharUuid) {
    //             typeCharacteristic = ch;
    //         }
    //         else if (ch.uuid === ssidCharUuid ) {
    //             ssidCharacteristic = ch;
    //         }
    //         else if (ch.uuid === passCharUuid) {
    //             passCharacteristic = ch;
    //         }
    //         else if (ch.uuid === actionCharUuid) {
    //             actionCharacteristic = ch;
    //         }
    //     });
    //     document.getElementById("setupButton").disabled = false;
    //     document.getElementById("setupButton").style.background='#019858';
    // })
    .catch(error => {
        console.log('Argh! ' + error);
        bleMsgLabel.innerText = 'Error: ' + error;
    });
}
  
function onDisconnectButtonClick() {
    setupMsgLabel.innerText = '';
    if (!bluetoothDevice) {
        return;
    }

    console.log('Disconnecting from Bluetooth Device...');
    if (bluetoothDevice.gatt.connected) {
        bluetoothDevice.gatt.disconnect();
    } else {
        console.log('> Bluetooth Device is already disconnected');
        bleMsgLabel.innerText = "Bluetooth Device is already disconnected";
        document.getElementById("setupButton").disabled = true;
        document.getElementById("setupButton").style.background='#9d9d9d';
    }
}

function onDisconnected(event) {
    // Object event.target is Bluetooth Device getting disconnected.
    console.log('> Bluetooth Device disconnected');
    bleMsgLabel.innerText = "Bluetooth Device is disconnected";
    document.getElementById("setupButton").disabled = true;
    document.getElementById("setupButton").style.background='#9d9d9d';
}

function onReconnectButtonClick() {
    bleMsgLabel.innerText = '';
    setupMsgLabel.innerText = '';

    if (!bluetoothDevice) {
      return;
    }

    if (bluetoothDevice.gatt.connected) {
        console.log('> Bluetooth Device is already connected');
        bleMsgLabel.innerText = "Connected to " + bluetoothDevice.name;
        return;
    }
    connect()
    .catch(error => {
        console.log('Argh! ' + error);
        bleMsgLabel.innerText = "Connection failed!";
    });
}

function onWriteButtonClick() {
    setupMsgLabel.innerText = '';
    if (!bluetoothDevice) {
        setupMsgLabel.innerText = "Error: Not connect to bluetooth device!";
        return;
    }
    if (!typeCharacteristic && !ssidCharacteristic && !passCharacteristic && !actionCharacteristic) {
        setupMsgLabel.innerText = "Error: Lack of required Characteristic!";
        return;
    }

    setupMsgLabel.innerText = 'Writing data to ' + bluetoothDevice.name + '...';

    // get type
    let typeStr = document.getElementById("auth_type").value;

    // get ssid
    let ssidStr = document.getElementById("wifi_ssid").value.trim();
    if (ssidStr === "") {
        setupMsgLabel.innerText = "Please enter a SSID name!";
        return;
    }

    // get pass
    let passStr = document.getElementById("wifi_password").value.trim();
    if (passStr === "") {
        setupMsgLabel.innerText = "Please enter a Password!";
        return;
    }

    console.log("----------------------");
    console.log("type: " + typeStr);
    console.log("ssid: " + ssidStr);
    console.log("pass: " + passStr);
    console.log("----------------------");

    let encoder = new TextEncoder('utf-8');

    // Step 1: Write data to typeCharacteristic
    typeCharacteristic.writeValue(encoder.encode(typeStr))
    .then(_ => {
        console.log('> Write data to typeCharacteristic is ok.');
        // Step 2: Write data to ssidCharacteristic
        ssidCharacteristic.writeValue(encoder.encode(ssidStr))
        .then(_ => {
            console.log('> Write data to ssidCharacteristic is ok.');
            // Step 3: Write data to passCharacteristic
            passCharacteristic.writeValue(encoder.encode(passStr))
            .then(_ => {
                console.log('> Write data to passCharacteristic is ok.');
                // Step 4: Write data to actionCharacteristic
                actionCharacteristic.writeValue(encoder.encode("1"))
                .then(_ => {
                    console.log('> Setup done!');
                    setupMsgLabel.innerText = "Setup done!";
                })
                .catch(error => {
                    console.log('Argh! ' + error);
                    setupMsgLabel.innerText = "Error: " + error;
                });
            })
            .catch(error => {
                console.log('Argh! ' + error);
            });
        })
        .catch(error => {
            console.log('Argh! ' + error);
        });
    })
    .catch(error => {
        console.log('Argh! ' + error);
    });
}

//
// BLE RGB Light - app.js
//

var defaultNamePrefix = "RLHome_RGB_Light";
document.getElementById("namePrefix").value = defaultNamePrefix;

disabledControlButtons(true);

var bluetoothDevice;
var bleMsgLabel = document.getElementById("bleStateLabel");
var setupMsgLabel = document.getElementById("setupStateLabel");

var serviceUuid     =  "0000ff00-0000-1000-8000-00805f9b34fb";
var switchCharUuid  =  "0000ff01-0000-1000-8000-00805f9b34fb"
var redCharUuid     =  "0000ff02-0000-1000-8000-00805f9b34fb"
var greenCharUuid   =  "0000ff03-0000-1000-8000-00805f9b34fb"
var blueCharUuid    =  "0000ff04-0000-1000-8000-00805f9b34fb"

var switchCharacteristic;
var redCharacteristic;
var greenCharacteristic;
var blueCharacteristic;

var switchValue = "0";

async function onScanButtonClick() {
    let namePrefix = document.getElementById("namePrefix").value;

    if (namePrefix !== "") {
        let options = {filters: [], "optionalServices": [serviceUuid]};
        options.filters.push({namePrefix: namePrefix});

        try {
            console.log('Requesting Bluetooth Device...');
            bluetoothDevice = await navigator.bluetooth.requestDevice(options);
            bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
            connect();

        } catch(error) {
            console.log('Argh! ' + error);
            bleMsgLabel.innerText = 'Error: ' + error;
        }
    } else {
        bleMsgLabel.innerText = "Please enter a device name prefix!";
    }
}

async function connect() {
    console.log('Connecting to Bluetooth Device...');
    console.log('Connecting to GATT Server...');
    const server = await bluetoothDevice.gatt.connect();

    console.log('> Bluetooth Device connected');
    bleMsgLabel.innerText = "Connected to " + bluetoothDevice.name;

    console.log('Getting Service...');
    const service = await server.getPrimaryService(serviceUuid);

    console.log('Getting Characteristics...');
    switchCharacteristic = await service.getCharacteristic(switchCharUuid);
    redCharacteristic    = await service.getCharacteristic(redCharUuid);
    greenCharacteristic  = await service.getCharacteristic(greenCharUuid);
    blueCharacteristic   = await service.getCharacteristic(blueCharUuid);

    // Read switch value
    const aValue = await switchCharacteristic.readValue();
    let decoder = new TextDecoder('utf-8');
    switchValue = decoder.decode(aValue);
    console.log('> Switch value: ' + switchValue);
    disabledControlButtons(false);
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
        bleMsgLabel.innerText = "Bluetooth Device is already disconnected"
    }
}

function onDisconnected(event) {
    // Object event.target is Bluetooth Device getting disconnected.
    console.log('> Bluetooth Device disconnected');
    bleMsgLabel.innerText = "Bluetooth Device is disconnected";
    disabledControlButtons(true) 
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

    try {
        connect();
    } catch(error) {
        console.log('Argh! ' + error);
        bleMsgLabel.innerText = "Connection failed!";
    }
}

function disabledControlButtons(isDisabled) {
    document.getElementById("switchButton").disabled = isDisabled;
    document.getElementById("select_color").disabled = isDisabled;
    changeSwitchButtonColor(isDisabled);
}

function changeSwitchButtonColor(isDisabled) {
    if (isDisabled) {
        document.getElementById("switchButton").style.background = '#8e8e8e';
    } else {
        if (switchValue === "1") {
            document.getElementById("switchButton").style.background = '#ea7500';
            document.getElementById("switchButton").innerText = "Off";
        } else {
            document.getElementById("switchButton").style.background = '#01b468';
            document.getElementById("switchButton").innerText = "On";
        }
    }
}

function selectColor(e) {
    console.log('> Color: ' + e.value);

    if (e.value === "white") {
        writeColor("255", "255", "255");
    } else if (e.value === "red") {
        writeColor("255", "0", "0");
    } else if (e.value === "green") {
        writeColor("0", "255", "0");
    } else if (e.value === "blue") {
        writeColor("0", "0", "255");
    } else if (e.value === "orange") {
        writeColor("255", "127", "0");
    } else if (e.value === "yellow") {
        writeColor("255", "255", "0");
    }
}

async function onSwitchButtonClick() {
    if (switchValue === "1") {
        switchValue = "0"
    } else {
        switchValue = "1"
    }
    
    let encoder = new TextEncoder('utf-8');
    try {
        await switchCharacteristic.writeValue(encoder.encode(switchValue));
        console.log('> Write data to switchCharacteristic is ok.');
        changeSwitchButtonColor(false);
    } catch(error) {
        console.log('Argh! ' + error);
    }
}

async function writeColor(R, G, B) {
    let encoder = new TextEncoder('utf-8');
    try {
        await redCharacteristic.writeValue(encoder.encode(R));
        console.log('> Write data to redCharacteristic is ok.');
        await greenCharacteristic.writeValue(encoder.encode(G));
        console.log('> Write data to greenCharacteristic is ok.');
        await blueCharacteristic.writeValue(encoder.encode(B));
        console.log('> Write data to blueCharacteristic is ok.');
    } catch(error) {
        console.log('Argh! ' + error);
    }
}

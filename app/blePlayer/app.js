//
// BLE Music Player - app.js
//

var defaultNamePrefix = "RLHome_MP3_Player";
document.getElementById("namePrefix").value = defaultNamePrefix;

disabledControlButtons(true);


var bleMsgLabel    = document.getElementById("bleStateLabel");
var setupMsgLabel  = document.getElementById("setupStateLabel");
var playStateLabel = document.getElementById("playStateLabel");
var volumeLabel    = document.getElementById("volumeLabel");
var playButton     = document.getElementById("playButton");

var currentState  = 0;
var currentVolume = 0;

var bluetoothDevice;
var serviceUuid     =  "0000aa00-0000-1000-8000-00805f9b34fb";
var actionCharUuid  =  "0000aa01-0000-1000-8000-00805f9b34fb";
var volumeCharUuid  =  "0000aa02-0000-1000-8000-00805f9b34fb";
var nextCharUuid    =  "0000aa03-0000-1000-8000-00805f9b34fb";
var loopCharUuid    =  "0000aa04-0000-1000-8000-00805f9b34fb";

var actionCharacteristic;
var volumeCharacteristic;
var nextCharacteristic;
var loopCharacteristic;


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
    actionCharacteristic = await service.getCharacteristic(actionCharUuid);
    volumeCharacteristic = await service.getCharacteristic(volumeCharUuid);
    nextCharacteristic   = await service.getCharacteristic(nextCharUuid);
    loopCharacteristic   = await service.getCharacteristic(loopCharUuid);

    // Read action value
    const actionValue = await actionCharacteristic.readValue();
    currentState = actionValue.getUint8(0);
    console.log( 'action value: ' + currentState);
    setPlayStateＥlement(currentState);
    
    // Read volume
    const volumeValue = await volumeCharacteristic.readValue();
    currentVolume = volumeValue.getUint8(0);
    console.log( 'volume value: ' + currentVolume);
    setVolumeLabel(currentVolume);
    
    // Read loop value
    const loopValue = await loopCharacteristic.readValue();
    const loop = loopValue.getUint8(0);
    console.log( 'loop value: ' + loop);

    const isChecked = ((loop === 0) ? false : true);
    setLoopCheckbox(isChecked);

    // Enable control buttons
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
        disabledControlButtons(true);
    }
}

function onDisconnected(event) {
    // Object event.target is Bluetooth Device getting disconnected.
    console.log('> Bluetooth Device disconnected');
    bleMsgLabel.innerText = "Bluetooth Device is disconnected";
    disabledControlButtons(true);
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

function onPlayButtonClick() {
    if (currentState === 0) {
        currentState = 1;
    } else if (currentState === 1) {
        currentState = 2;
    } else if (currentState === 2) {
        currentState = 1;
    } else {
        return;
    }
    writeActionCharacteristic();
}

function onStopButtonClick() {
    currentState = 0;
    writeActionCharacteristic();
}

function onPrevButtonClick() {
    writeNextCharacteristic(1);
}

function onNextButtonClick() {
    writeNextCharacteristic(2);
}

function onVolumeUpButtonClick() {
    currentVolume = currentVolume + 3;
    if (currentVolume > 30) {
        currentVolume = 30;
    }
    writeVolumeCharacteristic();
}

function onVolumeDownButtonClick() {
    currentVolume = currentVolume - 3;
    if (currentVolume < 0) {
        currentVolume = 0;
    }
    writeVolumeCharacteristic();
}


async function writeActionCharacteristic() {
    let aValue = Uint8Array.of(currentState);
    try {
        await actionCharacteristic.writeValue(aValue);
        console.log('> Write value to actionCharacteristic is ok!');
        setPlayStateＥlement(currentState);
    } catch(error) {
        console.log('Argh! ' + error);
    }
}

async function writeVolumeCharacteristic() {
    let aValue = Uint8Array.of(currentVolume);
    try {
        await volumeCharacteristic.writeValue(aValue)
        console.log('> Write value to volumeCharacteristic is ok!');
        setVolumeLabel(currentVolume);
    } catch(error) {
        console.log('Argh! ' + error);
    }
}

async function writeNextCharacteristic(prevOrNext) {
    let aValue = Uint8Array.of(prevOrNext);
    try {
        await nextCharacteristic.writeValue(aValue);
        console.log('> Write value to nextCharacteristic is ok!');
    } catch(error) {
        console.log('Argh! ' + error);
    }
}

async function writeLoopCharacteristic(loop) {
    let aValue = Uint8Array.of(loop);
    try {
        await loopCharacteristic.writeValue(aValue);
        console.log('> Write value to loopCharacteristic is ok!');
    } catch(error) {
        console.log('Argh! ' + error);
    }
}


function disabledControlButtons(isDisabled) {
    document.getElementById("playButton").disabled = isDisabled;
    document.getElementById("stopButton").disabled = isDisabled;
    document.getElementById("prevButton").disabled = isDisabled;
    document.getElementById("nextButton").disabled = isDisabled;
    document.getElementById("volumeUpButton").disabled = isDisabled;
    document.getElementById("volumeDownButton").disabled = isDisabled;
    document.getElementById("loopCheckbox").disabled = isDisabled;

    let color;

    if (isDisabled) {
        color = '#8e8e8e';
    } else {
        color = '#d84a38';
    }

    document.getElementById("playButton").style.background = color;
    document.getElementById("stopButton").style.background = color;
    document.getElementById("prevButton").style.background = color;
    document.getElementById("nextButton").style.background = color;
    document.getElementById("volumeUpButton").style.background = color;
    document.getElementById("volumeDownButton").style.background = color;
}

function setPlayStateＥlement(stateValue) {
    if (stateValue === 0) {
        playStateLabel.innerText = 'Stop';
        playButton.innerText = 'Play';
    } else if (stateValue === 1) {
        playStateLabel.innerText = 'Playing...';
        playButton.innerText = 'Pause';
    } else if (stateValue === 2) {
        playStateLabel.innerText = 'Pausing...';
        playButton.innerText = 'Play';
    }
}

function setVolumeLabel(volumeValue) {
    volumeLabel.innerText = 'Volume : ' + (volumeValue / 3);
}

function setLoopCheckbox(isChecked) {
    document.getElementById("loopCheckbox").checked = isChecked;
}

function toggleCheckbox(element) {
    //console.log(element.checked)
    if (element.checked === false) {
        writeLoopCharacteristic(0);
    } else {
        writeLoopCharacteristic(1);
    }
}

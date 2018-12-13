function createWindow(){

	var BLE = require('ti.bluetooth');
	var myPeripheral;
	var myService;

	// ESP32 device set as BLE Server with id 'JOYTOOTH'
	var device_name = 'JOYTOOTH';
	// running a service with UUID...
	var device_service_uuid = '4FAFC201-1FB5-459E-8FCC-C5C9C331914B';
	var device_connected = false;
	

	var win = Ti.UI.createWindow({
		title: 'JoyTooth',
		backgroundColor: '#fff',
		layout: 'vertical'
	});


	var btn_conn = Ti.UI.createButton({
			backgroundColor:'#3362c2',
			color:'#ffffff',
			width:180,
			height:40,
			borderRadius:8,
	    title: 'connect',
	    top: 20,
	    enabled : false
	});

	btn_conn.addEventListener('click', function(e){

		if(!device_connected){
			startScanning();
			return;
		}

		centralManager.cancelPeripheralConnection(myPeripheral);

		label.text = '';
	  myPeripheral = null;
	  myService = null;
	  label_value.text = '';

	});

	win.add(btn_conn);


	var centralManager = BLE.createCentralManager();
	var peripheralManager = BLE.createPeripheralManager();

	function stopScanning(){
	    if (centralManager.isScanning()) {
	        centralManager.stopScan();
	    }
	    // label.text = '';
	    // myPeripheral = null;
	    // myService = null;
	    // label_value.text = '';

	}
	function startScanning(){
	    if (centralManager.isScanning()) {
	        stopScanning();
	        return;
	    } else if (centralManager.getState() != BLE.MANAGER_STATE_POWERED_ON) {
	        alert('The BLE manager needs to be powered on before. Call initialize().');
	        return;
	    }
	    
	    label.text = '';
	    // btn1.title = 'Stop Scan';
	    btn_conn.title = 'scanning ...'
	    // Optional: Search for specified services array ( running on ESP32 )
	    centralManager.startScanWithServices([device_service_uuid]);
	    //centralManager.startScan();
	    //centralManager.startScanWithServices(['6E400001-B5A3-F393-E0A9-E50E24DCCA9E']);
	}

	var label = Ti.UI.createLabel({
		text: '...',
		top:15,
		left:10,
		right:10,
		height:Ti.UI.SIZE,
		wordWrap:true,
		textAlign:'center',
		color: '#333',
		font: {
			fontSize: 15
		}
	});



	

	win.add(label);

	
	/** 
	 * Central Manager Events
	 */
	centralManager.addEventListener('didDiscoverPeripheral', function(e) {
	    Ti.API.info('didDiscoverPeripheral');
	    Ti.API.info(e);

	    if(e.advertisementData.kCBAdvDataLocalName === device_name){
		    Ti.API.info('DEVICE FOUND : ', e.advertisementData.kCBAdvDataLocalName);
		    if(e.advertisementData.kCBAdvDataServiceUUIDs.indexOf(device_service_uuid) > -1 ){
			    Ti.API.info('SERVICE FOUND : ', e.advertisementData.kCBAdvDataServiceUUIDs[e.advertisementData.kCBAdvDataServiceUUIDs.indexOf(device_service_uuid)] );
			    label.text = 'device and service found';

			    connectPeripheral(e.peripheral);
		    
		    }
	    }
	});

	centralManager.addEventListener('didUpdateState', function(e) {
	    Ti.API.info('didUpdateState');
	    
	    switch (e.state) {
	        case BLE.MANAGER_STATE_RESETTING: 
	            Ti.API.info('Resetting');
	        break;

	        case BLE.MANAGER_STATE_UNSUPPORTED: 
	            Ti.API.info('Unsupported');
	            btn_conn.enabled = false;
	        break;

	        case BLE.MANAGER_STATE_UNAUTHORIZED: 
	            Ti.API.info('Unauthorized');
	        break;
	        
	        case BLE.MANAGER_STATE_POWERED_OFF: 
	            Ti.API.info('Powered Off');
	            btn_conn.enabled = false;

	        break;
	        
	        case BLE.MANAGER_STATE_POWERED_ON: 
	            Ti.API.info('Powered On');
	            //btn2.enabled = true;
	            btn_conn.enabled = true;

	        break;
	        
	        case BLE.MANAGER_STATE_UNKNOWN: 
	        default: 
	            Ti.API.info('Unknown');
	        break;
	    }
	});


	centralManager.addEventListener('didConnectPeripheral', function(e) {
	    Ti.API.info('didConnectPeripheral');
	    Ti.API.info(e);
	    Ti.API.info('connected to '+ e.peripheral.name);

	    label.text = 'Connected to '+ e.peripheral.name;

	    // Now you can add event listener to the found peripheral.
	    // Make sure to handle event listeners properly and remove them
	    // when you don't need them anymore
	    
	    myPeripheral = e.peripheral;
	    // centralManager.stopScan();

	    stopScanning();
	    
	    device_connected = true;
	    btn_conn.title = 'disconnect';
	    //btn_conn.enabled = true;
	    cross_circ.backgroundColor = '#aaff0000';

	    // empty: console.log('pre-discovery services: ', myPeripheral.services);

	    //myPeripheral.discoverServices(['4FAFC201-1FB5-459E-8FCC-C5C9C331914B']);
	    myPeripheral.discoverServices('4FAFC201-1FB5-459E-8FCC-C5C9C331914B');

	    myPeripheral.addEventListener('didDiscoverServices', function(e) {
	        Ti.API.info('didDiscoverServices');
	        Ti.API.info(e);

	        console.log('services: ', myPeripheral.services);

					myService = myPeripheral.services[0];

					myPeripheral.discoverCharacteristicsForService({
						service:myService
					});

					console.log('pre-discovery characteristics: ', myService.characteristics);

					//startChecker();


	    });

	    myPeripheral.addEventListener('didDiscoverCharacteristicsForService', function(e) {
	        Ti.API.info('didDiscoverCharacteristicsForService');
	        Ti.API.info(e);

	        console.log('characteristics: ', myService.characteristics);

	        console.log('characteristic[0].uuid: ', myService.characteristics[0].uuid);
	
					console.log('characteristic[0].isNotifying: ', myService.characteristics[0].isNotifying);


	        console.log('descriptor: ', myService.characteristics[0].descriptor);

	        console.log('val: ', myService.characteristics[0].value);

	        // listen for notifications of value updates
	        myPeripheral.setNotifyValueForCharacteristic(true, myService.characteristics[0]);


	    });

	    myPeripheral.addEventListener('didUpdateValueForCharacteristic', function(e) {
	        //Ti.API.info('didUpdateValueForCharacteristic');
	        //Ti.API.info(e);
	        console.log('characteristic[0].isNotifying: ', myService.characteristics[0].isNotifying);
	        console.log('val: ', myService.characteristics[0].value);

	        label_value.text = myService.characteristics[0].value;

	    });


	});

	centralManager.addEventListener('didDisconnectPeripheral', function(e) {
	    Ti.API.info('didDisconnectPeripheral');
	    Ti.API.info(e);
	    myPeripheral = null;
	    myService = null;
	    device_connected = false;
	    btn_conn.title = 'connect';
	    label.text = 'disconnected';
	    //btn_conn.enabled = tr;
	    
	    cross_circ.backgroundColor = '#33ffffff';
	    stopScanning();


	});

	centralManager.addEventListener('willRestoreState', function(e) {
	    Ti.API.info('willRestoreState');
	    Ti.API.info(e);
	});

	centralManager.addEventListener('didFailToConnectPeripheral', function(e) {
	    Ti.API.info('didFailToConnectPeripheral');
	    Ti.API.info(e);
	    label.text = 'failed to connect';
	});

	/** 
	 * Peripheral Manager Events
	 */
	 
	peripheralManager.addEventListener('didUpdateState', function(e) {
	    Ti.API.info('didUpdateState');
	    Ti.API.info(e);
	});

	peripheralManager.addEventListener('willRestoreState', function(e) {
	   Ti.API.info('willRestoreState');
	   Ti.API.info(e);
	});

	peripheralManager.addEventListener('didStartAdvertising', function(e) {
	   Ti.API.info('didStartAdvertising');
	   Ti.API.info(e);
	});

	peripheralManager.addEventListener('didAddService', function(e) {
	   Ti.API.info('didAddService');
	   Ti.API.info(e);
	});

	peripheralManager.addEventListener('didSubscribeToCharacteristic', function(e) {
	   Ti.API.info('didSubscribeToCharacteristic');
	   Ti.API.info(e);
	});

	peripheralManager.addEventListener('didUnsubscribeFromCharacteristic', function(e) {
	   Ti.API.info('didUnsubscribeFromCharacteristic');
	   Ti.API.info(e);
	});

	peripheralManager.addEventListener('didReceiveReadRequest', function(e) {
	   Ti.API.info('didReceiveReadRequest');
	   Ti.API.info(e);
	});

	peripheralManager.addEventListener('didReceiveWriteRequests', function(e) {
	   Ti.API.info('didReceiveWriteRequests');
	   Ti.API.info(e);
	});

	peripheralManager.addEventListener('readyToUpdateSubscribers', function(e) {
	   Ti.API.info('readyToUpdateSubscribers');
	   Ti.API.info(e);
	});

	function connectPeripheral(peripheral){
	 	Ti.API.info('connecting..');
	 	centralManager.connectPeripheral(peripheral, {
	 		notifyOnConnection:true,
	 		notifyOnDisconnection: true,
	 		notifyOnNotification: true
	 	});
	}


	var label_xy = Ti.UI.createLabel({
		text: '...',
		top:5,
		width:Ti.UI.FILL,
		textAlign:'center',
		color: '#333',
		font: {fontSize: 34}
	});

	win.add(label_xy);


	var ctrl_view = Ti.UI.createView({
		top:20,
		width:320,
		height:320,
		borderRadius:160,
		backgroundColor:'#333',
		//center:{x:0, y:0}
	});
	var cross_up = Ti.UI.createView({
		width:1,
		height:Ti.UI.FILL,
		backgroundColor:'#eee',
		touchEnabled:false
	});

	var cross_ac = Ti.UI.createView({
		height:1,
		width:Ti.UI.FILL,
		backgroundColor:'#eee',
		touchEnabled:false
	});

	var cross_circ = Ti.UI.createView({
		height:320,
		width:320,
		borderRadius:160,
		borderWidth:3,
		borderColor:'#eee',
		backgroundColor:'#33ffffff',
		touchEnabled:false
	});
	ctrl_view.add(cross_ac);
	ctrl_view.add(cross_up);
	ctrl_view.add(cross_circ);

	var dot_view = Ti.UI.createView({
		width:60,
		height:60,
		borderRadius:30,
		borderWidth:3,
		borderColor:'red',
		backgroundColor:'white',
		touchEnabled:false
	});

	ctrl_view.add(dot_view);


	function updateJoypad(e){
		if(e.x >= 0 && e.x <= ctrl_view.width && e.y >= 0 && e.y <= ctrl_view.height ){
			var x = (e.x - (ctrl_view.width/2)) / (ctrl_view.width/2);
			var y = ((e.y - (ctrl_view.height/2)) / (ctrl_view.height/2) * -1);
			var _x = x.toFixed(2);
			var _y = y.toFixed(2);
			//console.log(x, y, " - ", x / (ctrl_view.width/2), y / (ctrl_view.height/2));
			var xs = _x * _x;
			if(xs < 0){
				xs = xs * -1;
			}
			var ys = _y * _y;
			if(ys < 0){
				ys = ys * -1;
			}
			// radius from centre
			var _rad = Math.sqrt(xs + ys);
			//console.log(_x, ',', _y, ' : ', _rad);
			label_xy.text = _x + ',' + _y;

			// stay inside circle
			if(_rad <= 1){
				dot_view.left = e.x - (dot_view.width/2);
				dot_view.top = e.y - (dot_view.height/2);
			}

			if(myPeripheral===null){
				return;
			}
			
			var buffer = Ti.createBuffer({ length: 255 });
			var length = Ti.Codec.encodeString({
			    source: _x + ',' + _y,
			    dest: buffer
			});
			buffer.length = length;
			if(device_connected){
				// write value to ESP32..
				myPeripheral.writeValueForCharacteristicWithType(buffer.toBlob(), myService.characteristics[0], BLE.CHARACTERISTIC_PROPERTY_WRITE_WITHOUT_RESPONSE);
			}
		}

	}

	ctrl_view.addEventListener('touchstart', updateJoypad);
	ctrl_view.addEventListener('touchmove', updateJoypad);

	ctrl_view.addEventListener('touchend', function(e){
		dot_view.left = ctrl_view.width/2 - (dot_view.width/2);
		dot_view.top = ctrl_view.height/2 - (dot_view.height/2);
		label_xy.text = '0,0';
		var buffer = Ti.createBuffer({ length: 1024 });
		var length = Ti.Codec.encodeString({
		    source: '0,0',
		    dest: buffer
		});
		buffer.length = length;
		if(device_connected){
			myPeripheral.writeValueForCharacteristicWithType(buffer.toBlob(), myService.characteristics[0], BLE.CHARACTERISTIC_PROPERTY_WRITE_WITHOUT_RESPONSE);
		}
	});

	win.add(ctrl_view);


	// For recieved values written from ESP 
	var label_value = Ti.UI.createLabel({
		text: '...',
		top:5,
		left:10,
		right:10,
		height:Ti.UI.SIZE,
		wordWrap:true,
		textAlign:'center',
		color: '#222',
		font: {
			fontSize: 15
		}
	});
	win.add(label_value);


	return win;

}

exports.createWindow = createWindow;
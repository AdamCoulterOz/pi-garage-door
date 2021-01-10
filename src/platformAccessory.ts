import {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicSetCallback, 
  CharacteristicGetCallback,
  CharacteristicEventTypes,
} from 'homebridge';

import { RPiGarageDoorPlatform } from './platform';
import { GarageDoor } from './garageDoor';
export class GarageDoorAccessory {
  private service: Service;

  constructor(
    private readonly platform: RPiGarageDoorPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'AdamCoulter')
      .setCharacteristic(this.platform.Characteristic.Model, 'RPiDoorOpener')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, '00001');

    // get the GarageDoorOpener service if it exists, otherwise create a new GarageDoorOpener service
    this.service = this.accessory.getService(this.platform.Service.GarageDoorOpener) || 
      this.accessory.addService(this.platform.Service.GarageDoorOpener);

    // set the service name
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName);

    // minimum "required characteristics" for GarageDoorOpener
    // https://developers.homebridge.io/#/service/GarageDoorOpener

    this.service.getCharacteristic(this.platform.Characteristic.CurrentDoorState)        
      .on(CharacteristicEventTypes.GET, this.getCurrentDoorState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetDoorState)
      .on(CharacteristicEventTypes.SET, this.setTargetDoorState.bind(this))               
      .on(CharacteristicEventTypes.GET, this.getTargetDoorState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.ObstructionDetected)
      .on(CharacteristicEventTypes.GET, this.getObstructionDetected.bind(this));
  }

  /**
   * Handle requests to get the current value of the "Current Door State" characteristic
   * 
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   * 
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.CurrentDoorState, 
   *    this.platform.Characteristic.CurrentDoorState.OPEN)
   */
  getCurrentDoorState(callback: CharacteristicGetCallback) {

    this.platform.log.debug('Triggered GET CurrentDoorState');

    // this.platform.Characteristic.CurrentDoorState.OPEN;
    // this.platform.Characteristic.CurrentDoorState.CLOSED;
    // this.platform.Characteristic.CurrentDoorState.OPENING;
    // this.platform.Characteristic.CurrentDoorState.CLOSING;
    // this.platform.Characteristic.CurrentDoorState.STOPPED;

    const value = this.platform.Characteristic.CurrentDoorState.OPEN;

    callback(null, value);
  }

  getTargetDoorState(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET TargetDoorState');
    switch (GarageDoor.GetDoorState()) {
      case 'open': callback(null, this.platform.Characteristic.TargetDoorState.OPEN); break;
      case 'closed': callback(null, this.platform.Characteristic.TargetDoorState.CLOSED); break;
      default: callback(new Error('invalid state'), null);
    }
  }

  setTargetDoorState(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.log.debug('Triggered SET TargetDoorState:', value);
    switch (value) {
      case this.platform.Characteristic.TargetDoorState.OPEN:
        GarageDoor.OpenDoor();
        break;
      case this.platform.Characteristic.TargetDoorState.CLOSED:
        GarageDoor.CloseDoor();
        break;
    }
    callback(null);
  }

  getObstructionDetected(callback: CharacteristicSetCallback) {
    this.platform.log.debug('Triggered GET ObstructionDetected');
    callback(null, false);
  }

}

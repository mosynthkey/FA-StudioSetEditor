// Control FA Series via SysEx

function FA(midi) {
  // Search FA (via only USB)
  this.available = false;
  this.notFound = false;
  this.midi = midi;
  this.fain = null;
  this.faout = null;
  this.device_id = null;

  var this_ = this;
  var mins = midi.mins;
  var mouts = midi.mouts;

  for (var i = 0; i < mins.length; i++) {
    if (/*mins[i].manufacturer == 'Roland' && */mins[i].name.match(/FA-06 08$/) == 'FA-06 08') {
      this.fain = mins[i];
    }
  }

  for (var i = 0; i < mouts.length; i++) {
    if (/*mouts[i].manufacturer == 'Roland' && */mouts[i].name.match(/FA-06 08$/) == 'FA-06 08') {
      this.faout = mouts[i];
    }
  }

  if (this.fain != null && this.faout != null) {
    midi.setInOut(this.fain, function (e) { this_.onMidiMsg(e, this_.toCtrl); }, this.faout);
    for (var i = 0x10; i <= 0x1f; i++) midi.send([0xf0, 0x7e, i, 0x06, 0x01, 0xf7]);
  } else {
    this.notFound = true;
  }
}

FA.prototype.onMidiMsg = function (event, toCtrl) {
  var msg = event.data;

  // irm = Identity Reply Message
  var irm_head = [0xf0, 0x7e];
  var dt1_head = [0xf0, 0x41, this.device_id, 0x00, 0x00, 0x77, 0x12];
  var dt1_tail = [0x00 /* CheckSum */, 0xf7];

  if (msg.cmphead(irm_head)) {
    // process Identity Request Message
    if (
      msg[3] == 0x06 && msg[4] == 0x02 && // sub id
      msg[5] == 0x41 && // roland
      msg[6] == 0x77 && msg[7] == 0x02 && // device family code
      msg[8] == 0x00 && msg[9] == 0x00 &&  // device family number code
      msg[11] == 0x00 && msg[13] == 0x00 && // software revision level 
      msg[14] == 0xf7) { // end of exclusive
      this.device_id = msg[2];
      this.available = true;

      const faModelStr = ['FA-06', 'FA-08', 'FA-07'];
      console.log(faModelStr[msg[10]] + ' was detected.');
      if (msg[12] == 0) {
        console.log('~ ver1.03');
      } else if (msg[12] == 1) {
        console.log('ver2.00 ~');
      } else {
        console.log('unknown version ' + msg[12]);
      }
    }
  } else if ((msg[0] & 0xf0) == 0xC0) {
    // Received program change message. Retrieve all information from FA
    this.midi.resetMsgQueue();
    FAParams.recieveAll();
  } else if (msg.cmphead(dt1_head)) {
    // Process data set 1
    var addr = msg.slice(7, 10);
    var data = msg.slice(11, msg.length - 3);
    dt1_tail[0] = getCheckSum(addr.concat(data));
    if (msg.cmptail(dt1_tail)) {
      FAParams.setData(addr, data);
    }
  }
};

FA.prototype.sendRQ1 = function (addr_ary, size_ary) {
  var rq1_head = [0xf0, 0x41, this.device_id, 0x00, 0x00, 0x77, 0x11];
  var rq1_addr_size = addr_ary.concat(size_ary);
  var rq1_tail = [getCheckSum(rq1_addr_size), 0xf7];
  this.midi.send(rq1_head.concat(rq1_addr_size, rq1_tail));
};

FA.prototype.sendDT1 = function (addr_ary, data_ary) {
  var dt1_head = [0xf0, 0x41, this.device_id, 0x00, 0x00, 0x77, 0x12];
  var dt1_addr_data = addr_ary.concat(data_ary);
  var dt1_tail = [getCheckSum(dt1_addr_data), 0xf7];
  this.midi.send(dt1_head.concat(dt1_addr_data, dt1_tail));
};

function getCheckSum(addr_data_arry) {
  var sum = addr_data_arry.reduce(function (a, b) { return a + b; });
  return (128 - (sum % 128)) & 0x7f;
}

FA.getToneType = function (msb, lsb) {
  if (msb == 89) {
    if (lsb == 0) {
      return ["USER", "SN-A"];
    } else if (lsb == 64) {
      return ["PRST", "SN-A"];
    }
  } else if (msb == 95) {
    if (0 <= lsb && lsb <= 3) {
      return ["USER", "SN-S"];
    } else if (64 <= lsb && lsb <= 74) {
      return ["PRST", "SN-S"];
    }
  } else if (msb == 88) {
    if (lsb == 0) {
      return ["USER", "SN-D"];
    } else if (lsb == 64) {
      return ["PRST", "SN-D"];
    }
  } else if (msb == 87) {
    if (0 <= lsb && lsb <= 1) {
      return ["USER", "PCMS"];
    } else if (64 <= lsb && lsb <= 71) {
      return ["PRST", "PCMS"];
    }
  } else if (msb == 121) {
    if (lsb == 0) {
      return ["GM2", "PCMD"];
    }
  } else if (msb == 86) {
    if (lsb == 0) {
      return ["USER", "PCMD"];
    } else if (lsb == 64) {
      return ["PRST", "PCMD"];
    }
  } else if (msb == 120) {
    if (lsb == 0) {
      return ["GM2", "PCMD"];
    }
  } else if (msb == 93) {
    return ["EX  ", "PCMS"];
  } else if (msb == 92) {
    return ["EX  ", "PCMD"];
  }
}

function Midi()
{
  this.available = false;
  // 接続されているすべてのデバイス
  this.mins = [];
  this.mouts = [];
  // 使用するデバイス
  this.min = null;
  this.mout = null;

  this.midi_access = null;
  this.msg_queue = [];
  this.msg_timer = null;

  this_ = this;

  navigator.requestMIDIAccess({sysex: true}).then((function(ma) {
		// MIDIデバイスが使用可能
		if (ma != null) {
			if (typeof ma.inputs == 'function') {
			// For Old Chrome
				this_.mins = ma.inputs();
				this_.mouts = ma.outputs();
			} else {
			// For New Chrome
				var it = ma.inputs.values();
				for (var o = it.next(); !o.done; o = it.next()) {
					this_.mins.push(o.value);
				}
				var it = ma.outputs.values();
				for (var o = it.next(); !o.done; o = it.next()) {
					this_.mouts.push(o.value);
				}
			}
		}
    this_.midi_access = ma;
    this_.available = true;
	}), (function() {
		this_.available = false;
	}));
}

Midi.prototype.setInOut = function(min, onMidiMsg, mout)
{
  this.min = min;
  this.mout = mout;
  this.min.onmidimessage = onMidiMsg;
};

Midi.prototype.sendMsg = function()
{
  if (this.msg_queue.length != 0) {
		if (this.mout != null) {
      this.mout.send(this.msg_queue.shift());
    }
	} else {
		clearInterval(this.msg_timer);
		this.msg_timer = null;
	}
};

Midi.prototype.send = function(msg)
{
  var this_ = this;
  this.msg_queue.push(msg);
	if (this.msg_timer == null) this.msg_timer = setInterval(function(){this_.sendMsg()}, 30);
};

Midi.prototype.resetMsgQueue = function()
{
  this.msg_queue.length = 0;
  clearInterval(this.msg_timer);
  this.msg_timer = null;
}
